import { readFile } from 'node:fs/promises'

import { MockTransport, ReplayTransport, parseRecordedSession } from '@arduconfig/transport'
import { createArduCopterMockScenario } from '@arduconfig/protocol-mavlink'

import { NativeSerialTransport } from './native-serial-transport.js'
import { startWebSocketBridgeServer } from './websocket-bridge-server.js'

interface BridgeOptions {
  host: string
  port: number
  route: string
  source: 'demo' | 'serial' | 'replay'
  serialPath?: string
  baudRate: number
  replayFile?: string
}

const DEFAULT_OPTIONS: BridgeOptions = {
  host: '127.0.0.1',
  port: 14550,
  route: '/',
  source: 'demo',
  baudRate: 115200
}

void main().catch((error) => {
  console.error(`[bridge] ${error instanceof Error ? error.message : 'Unknown bridge error.'}`)
  process.exitCode = 1
})

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const transport = await createBridgeTransport(options)
  const bridge = await startWebSocketBridgeServer({
    transport,
    host: options.host,
    port: options.port,
    route: options.route,
    label: describeSource(options)
  })

  console.log(`[bridge] source=${describeSource(options)}`)
  console.log(`[bridge] listening=${bridge.url}`)
  console.log('[bridge] press Ctrl+C to stop')

  const shutdown = async () => {
    await bridge.close().catch(() => {})
    process.exit(0)
  }

  process.once('SIGINT', () => {
    void shutdown()
  })
  process.once('SIGTERM', () => {
    void shutdown()
  })
}

async function createBridgeTransport(options: BridgeOptions) {
  switch (options.source) {
    case 'demo': {
      const scenario = createArduCopterMockScenario()
      return new MockTransport('bridge-demo-transport', {
        initialFrames: scenario.initialFrames,
        respondToOutbound: scenario.respondToOutbound,
        frameIntervalMs: 12,
        responseDelayMs: 20,
        chunkSize: 7
      })
    }
    case 'serial':
      if (!options.serialPath) {
        throw new Error('Pass --path=/dev/tty.* when using --source=serial.')
      }
      return new NativeSerialTransport('bridge-native-serial', {
        path: options.serialPath,
        baudRate: options.baudRate
      })
    case 'replay':
      if (!options.replayFile) {
        throw new Error('Pass --replay-file=/path/to/session.json when using --source=replay.')
      }
      return new ReplayTransport('bridge-replay-transport', {
        session: parseRecordedSession(await readFile(options.replayFile, 'utf8')),
        speedMultiplier: 1
      })
  }
}

function parseArgs(args: string[]): BridgeOptions {
  const options: BridgeOptions = { ...DEFAULT_OPTIONS }

  for (const argument of args) {
    if (argument === '--demo') {
      options.source = 'demo'
      continue
    }
    if (argument === '--serial') {
      options.source = 'serial'
      continue
    }
    if (argument === '--replay') {
      options.source = 'replay'
      continue
    }

    const valueIndex = argument.indexOf('=')
    if (!argument.startsWith('--') || valueIndex === -1) {
      continue
    }

    const key = argument.slice(2, valueIndex)
    const value = argument.slice(valueIndex + 1)
    switch (key) {
      case 'host':
        options.host = value || DEFAULT_OPTIONS.host
        break
      case 'port':
        options.port = Number.parseInt(value, 10) || DEFAULT_OPTIONS.port
        break
      case 'route':
        options.route = value || DEFAULT_OPTIONS.route
        break
      case 'path':
        options.serialPath = value
        options.source = 'serial'
        break
      case 'baud-rate':
        options.baudRate = Number.parseInt(value, 10) || DEFAULT_OPTIONS.baudRate
        break
      case 'replay-file':
        options.replayFile = value
        options.source = 'replay'
        break
      default:
        break
    }
  }

  return options
}

function describeSource(options: BridgeOptions): string {
  switch (options.source) {
    case 'demo':
      return 'demo mock vehicle'
    case 'serial':
      return `serial ${options.serialPath ?? 'unknown'} @ ${options.baudRate}`
    case 'replay':
      return `replay ${options.replayFile ?? 'unknown'}`
  }
}
