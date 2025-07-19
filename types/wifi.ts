export type WiFiNetwork = {
    ssid: string,
    rssi: number
}

export type WiFiScanStatus = 'scanning'|'scanned'|'failed'
