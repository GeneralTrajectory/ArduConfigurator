import { createHash } from 'node:crypto'
import { createServer, type IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'

import type { Transport, Unsubscribe } from '@arduconfig/transport'

const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

export interface WebSocketBridgeServerOptions {
  transport: Transport
  host?: string
  port?: number
  route?: string
  label?: string
}

export interface StartedWebSocketBridgeServer {
  readonly url: string
  readonly host: string
  readonly port: number
  readonly route: string
  close(): Promise<void>
}

export async function startWebSocketBridgeServer(options: WebSocketBridgeServerOptions): Promise<StartedWebSocketBridgeServer> {
  const host = options.host ?? '127.0.0.1'
  const route = normalizeRoute(options.route)
  const label = options.label ?? 'MAVLink WebSocket bridge'
  const transport = options.transport

  let activeClient: BridgeClient | undefined
  let transportConnected = false
  let closing = false

  const transportUnsubscribes: Unsubscribe[] = [
    transport.onFrame((frame) => {
      activeClient?.sendBinary(frame)
    }),
    transport.onStatus((status) => {
      if (!activeClient) {
        return
      }

      if (status.kind === 'error') {
        activeClient.close(1011, truncateReason(status.message))
      } else if (status.kind === 'disconnected') {
        activeClient.close(1000, truncateReason(status.reason ?? 'Bridge transport disconnected.'))
      }
    })
  ]

  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    response.end(
      JSON.stringify(
        {
          application: 'ArduConfigurator',
          kind: 'mavlink-websocket-bridge',
          label,
          route,
          transportKind: transport.kind,
          transportStatus: transport.getStatus().kind,
          hasActiveClient: activeClient !== undefined
        },
        null,
        2
      )
    )
  })

  server.on('upgrade', async (request, socket) => {
    try {
      if (closing) {
        rejectUpgrade(socket, 503, 'Bridge is closing.')
        return
      }

      if (!isUpgradeRequestForRoute(request, route)) {
        rejectUpgrade(socket, 404, 'Route not found.')
        return
      }

      if (activeClient) {
        rejectUpgrade(socket, 409, 'Bridge already has an active client.')
        return
      }

      const key = request.headers['sec-websocket-key']
      if (typeof key !== 'string' || key.length === 0) {
        rejectUpgrade(socket, 400, 'Missing Sec-WebSocket-Key.')
        return
      }

      completeHandshake(socket, key)
      const client = new BridgeClient(socket, async (frame) => {
        await transport.send(frame)
      }, async () => {
        if (!activeClient || activeClient !== client) {
          return
        }

        activeClient = undefined
        if (transportConnected) {
          transportConnected = false
          await transport.disconnect().catch(() => {})
        }
      })

      activeClient = client

      if (!transportConnected) {
        await transport.connect()
        transportConnected = true
      }
    } catch (error) {
      if (!socket.destroyed) {
        socket.destroy(error instanceof Error ? error : undefined)
      }
      activeClient = undefined
      if (transportConnected) {
        transportConnected = false
        await transport.disconnect().catch(() => {})
      }
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port ?? 14550, host, () => {
      server.off('error', reject)
      resolve()
    })
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine WebSocket bridge address.')
  }

  return {
    url: `ws://${host}:${address.port}${route === '/' ? '' : route}`,
    host,
    port: address.port,
    route,
    async close() {
      closing = true
      activeClient?.close(1001, 'Bridge shutting down.')
      activeClient = undefined

      if (transportConnected) {
        transportConnected = false
        await transport.disconnect().catch(() => {})
      }

      transportUnsubscribes.forEach((unsubscribe) => unsubscribe())

      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
    }
  }
}

class BridgeClient {
  private closed = false
  private buffer: Uint8Array<ArrayBufferLike> = new Uint8Array(0)

  constructor(
    private readonly socket: Duplex,
    private readonly onBinaryFrame: (frame: Uint8Array) => Promise<void>,
    private readonly onClosed: () => Promise<void>
  ) {
    socket.on('data', (chunk: Buffer) => {
      this.buffer = concatBytes(this.buffer, copyBytes(new Uint8Array(chunk)))
      void this.drain()
    })
    socket.on('close', () => {
      void this.handleClosed()
    })
    socket.on('error', () => {
      void this.handleClosed()
    })
    socket.on('end', () => {
      void this.handleClosed()
    })
  }

  sendBinary(frame: Uint8Array): void {
    if (this.closed || this.socket.destroyed) {
      return
    }

    this.socket.write(encodeWebSocketFrame(0x2, frame))
  }

  close(code = 1000, reason = 'Closing.'): void {
    if (this.closed || this.socket.destroyed) {
      return
    }

    const payload = new Uint8Array(2 + new TextEncoder().encode(reason).length)
    const view = new DataView(payload.buffer)
    view.setUint16(0, code, false)
    payload.set(new TextEncoder().encode(reason), 2)
    this.socket.write(encodeWebSocketFrame(0x8, payload))
    this.socket.end()
  }

  private async drain(): Promise<void> {
    while (true) {
      const decoded = decodeWebSocketFrame(this.buffer)
      if (!decoded) {
        return
      }

      this.buffer = decoded.remaining
      if (decoded.opcode === 0x8) {
        this.close()
        return
      }

      if (decoded.opcode === 0x9) {
        this.socket.write(encodeWebSocketFrame(0xA, decoded.payload))
        continue
      }

      if (decoded.opcode === 0x2) {
        await this.onBinaryFrame(decoded.payload)
        continue
      }

      if (decoded.opcode === 0x1) {
        continue
      }
    }
  }

  private async handleClosed(): Promise<void> {
    if (this.closed) {
      return
    }

    this.closed = true
    await this.onClosed()
  }
}

function isUpgradeRequestForRoute(request: IncomingMessage, route: string): boolean {
  const upgradeHeader = request.headers.upgrade
  if (typeof upgradeHeader !== 'string' || upgradeHeader.toLowerCase() !== 'websocket') {
    return false
  }

  const parsed = new URL(request.url ?? '/', 'http://127.0.0.1')
  return parsed.pathname === route
}

function completeHandshake(socket: Duplex, key: string): void {
  const accept = createHash('sha1').update(`${key}${WEBSOCKET_GUID}`).digest('base64')
  socket.write(
    [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`,
      '',
      ''
    ].join('\r\n')
  )
}

function rejectUpgrade(socket: Duplex, statusCode: number, message: string): void {
  socket.write(
    [
      `HTTP/1.1 ${statusCode} ${httpStatusText(statusCode)}`,
      'Connection: close',
      'Content-Type: text/plain; charset=utf-8',
      `Content-Length: ${Buffer.byteLength(message)}`,
      '',
      message
    ].join('\r\n')
  )
  socket.destroy()
}

function httpStatusText(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request'
    case 404:
      return 'Not Found'
    case 409:
      return 'Conflict'
    case 503:
      return 'Service Unavailable'
    default:
      return 'Error'
  }
}

function normalizeRoute(route: string | undefined): string {
  if (!route || route.trim() === '') {
    return '/'
  }

  return route.startsWith('/') ? route : `/${route}`
}

function truncateReason(reason: string): string {
  return reason.length <= 120 ? reason : `${reason.slice(0, 117)}...`
}

function concatBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
  const merged = new Uint8Array(left.length + right.length)
  merged.set(left, 0)
  merged.set(right, left.length)
  return merged
}

function encodeWebSocketFrame(opcode: number, payload: Uint8Array): Uint8Array {
  const payloadLength = payload.length
  const headerLength = payloadLength < 126 ? 2 : payloadLength < 65536 ? 4 : 10
  const frame = new Uint8Array(headerLength + payloadLength)
  frame[0] = 0x80 | (opcode & 0x0f)

  if (payloadLength < 126) {
    frame[1] = payloadLength
    frame.set(payload, 2)
    return frame
  }

  if (payloadLength < 65536) {
    frame[1] = 126
    frame[2] = (payloadLength >> 8) & 0xff
    frame[3] = payloadLength & 0xff
    frame.set(payload, 4)
    return frame
  }

  frame[1] = 127
  const view = new DataView(frame.buffer)
  view.setBigUint64(2, BigInt(payloadLength), false)
  frame.set(payload, 10)
  return frame
}

function decodeWebSocketFrame(buffer: Uint8Array): { opcode: number; payload: Uint8Array; remaining: Uint8Array } | undefined {
  if (buffer.length < 2) {
    return undefined
  }

  const firstByte = buffer[0]
  const secondByte = buffer[1]
  const opcode = firstByte & 0x0f
  let payloadOffset = 2
  let payloadLength = secondByte & 0x7f

  if (payloadLength === 126) {
    if (buffer.length < 4) {
      return undefined
    }
    payloadLength = (buffer[2] << 8) | buffer[3]
    payloadOffset = 4
  } else if (payloadLength === 127) {
    if (buffer.length < 10) {
      return undefined
    }
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    const longLength = Number(view.getBigUint64(2, false))
    if (!Number.isSafeInteger(longLength)) {
      throw new Error('WebSocket frame too large for bridge.')
    }
    payloadLength = longLength
    payloadOffset = 10
  }

  const masked = (secondByte & 0x80) !== 0
  const maskOffset = masked ? payloadOffset : undefined
  const payloadStart = payloadOffset + (masked ? 4 : 0)
  const frameLength = payloadStart + payloadLength
  if (buffer.length < frameLength) {
    return undefined
  }

  let payload = copyBytes(buffer.subarray(payloadStart, frameLength))
  if (masked && maskOffset !== undefined) {
    const mask = copyBytes(buffer.subarray(maskOffset, maskOffset + 4))
    const unmasked = new Uint8Array(payload.length)
    for (let index = 0; index < payload.length; index += 1) {
      unmasked[index] = payload[index] ^ mask[index % 4]
    }
    payload = unmasked
  }

  return {
    opcode,
    payload,
    remaining: copyBytes(buffer.subarray(frameLength))
  }
}

function copyBytes(source: Uint8Array): Uint8Array {
  const copy = new Uint8Array(source.length)
  copy.set(source)
  return copy
}
