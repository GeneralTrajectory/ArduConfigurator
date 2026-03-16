import type { ConfiguratorSnapshot } from '@arduconfig/ardupilot-core'
import { StatusBadge } from '@arduconfig/ui-kit'

interface LiveGpsMapCardProps {
  snapshot: ConfiguratorSnapshot
  title: string
  subtitle: string
  compact?: boolean
  testId?: string
}

function formatCoordinate(value: number | undefined, positiveLabel: string, negativeLabel: string): string {
  if (value === undefined) {
    return 'Unknown'
  }

  const hemisphere = value >= 0 ? positiveLabel : negativeLabel
  return `${Math.abs(value).toFixed(5)}° ${hemisphere}`
}

function buildLongitudeDelta(latitudeDeg: number, latitudeDelta: number): number {
  const cosine = Math.cos((latitudeDeg * Math.PI) / 180)
  return latitudeDelta / Math.max(Math.abs(cosine), 0.35)
}

function buildMapBounds(latitudeDeg: number, longitudeDeg: number, compact: boolean): string {
  const latitudeDelta = compact ? 0.01 : 0.006
  const longitudeDelta = buildLongitudeDelta(latitudeDeg, latitudeDelta)
  const minLongitude = longitudeDeg - longitudeDelta
  const minLatitude = latitudeDeg - latitudeDelta
  const maxLongitude = longitudeDeg + longitudeDelta
  const maxLatitude = latitudeDeg + latitudeDelta

  return [minLongitude, minLatitude, maxLongitude, maxLatitude].map((value) => value.toFixed(6)).join(',')
}

function buildOpenStreetMapEmbedUrl(latitudeDeg: number, longitudeDeg: number, compact: boolean): string {
  const bbox = buildMapBounds(latitudeDeg, longitudeDeg, compact)
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitudeDeg.toFixed(6)},${longitudeDeg.toFixed(6)}`
}

function buildOpenStreetMapUrl(latitudeDeg: number, longitudeDeg: number, compact: boolean): string {
  const zoom = compact ? 14 : 15
  return `https://www.openstreetmap.org/?mlat=${latitudeDeg.toFixed(6)}&mlon=${longitudeDeg.toFixed(6)}#map=${zoom}/${latitudeDeg.toFixed(6)}/${longitudeDeg.toFixed(6)}`
}

function formatMetric(value: number | undefined, suffix: string): string {
  return value === undefined ? 'Unknown' : `${value.toFixed(1)}${suffix}`
}

export function LiveGpsMapCard({ snapshot, title, subtitle, compact = false, testId }: LiveGpsMapCardProps) {
  const position = snapshot.liveVerification.globalPosition
  const latitudeDeg = position.latitudeDeg
  const longitudeDeg = position.longitudeDeg
  const verified = position.verified && latitudeDeg !== undefined && longitudeDeg !== undefined
  const embedUrl = verified ? buildOpenStreetMapEmbedUrl(latitudeDeg, longitudeDeg, compact) : undefined
  const externalUrl = verified ? buildOpenStreetMapUrl(latitudeDeg, longitudeDeg, compact) : undefined

  return (
    <div className={`gps-map-card${compact ? ' gps-map-card--compact' : ''}`} data-testid={testId}>
      <div className="gps-map-card__header">
        <div>
          <strong>{title}</strong>
          <p>{subtitle}</p>
        </div>
        <StatusBadge tone={verified ? 'success' : 'warning'}>{verified ? 'position live' : 'waiting'}</StatusBadge>
      </div>

      <div className="gps-map-card__frame">
        {embedUrl ? (
          <iframe
            title={title}
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer"
            aria-label={title}
          />
        ) : (
          <div className="gps-map-card__placeholder">
            <span>No live global position yet</span>
            <strong>
              {snapshot.sessionProfile === 'usb-bench'
                ? 'GPS may be unpowered on USB alone'
                : 'Waiting on GLOBAL_POSITION_INT telemetry'}
            </strong>
            <small>Coordinates will appear here as soon as the controller starts reporting a live global position.</small>
          </div>
        )}
      </div>

      <div className="gps-map-card__meta">
        <article>
          <span>Latitude</span>
          <strong>{formatCoordinate(position.latitudeDeg, 'N', 'S')}</strong>
        </article>
        <article>
          <span>Longitude</span>
          <strong>{formatCoordinate(position.longitudeDeg, 'E', 'W')}</strong>
        </article>
        <article>
          <span>Relative alt</span>
          <strong>{formatMetric(position.relativeAltitudeM, ' m')}</strong>
        </article>
        <article>
          <span>Ground speed</span>
          <strong>{formatMetric(position.groundSpeedMs, ' m/s')}</strong>
        </article>
      </div>

      <div className="gps-map-card__footer">
        <small>
          {verified
            ? 'Map tiles come from OpenStreetMap. The live coordinates remain useful even if the browser cannot load external map tiles.'
            : 'Mission-control style location review appears automatically when the flight controller reports a live global position.'}
        </small>
        {externalUrl ? (
          <a href={externalUrl} target="_blank" rel="noreferrer">
            Open in OpenStreetMap
          </a>
        ) : null}
      </div>
    </div>
  )
}
