export type WifiStatus = 'disconnected'|'connecting'|'connected'

export type SensorData = {
    wifi?: WifiStatus,
    battery?: string,
    charger?: string,
    air_temp?: string,
    air_hum?: string,
    soil?: string,
    light?: string // bool
}
