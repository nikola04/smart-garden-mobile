export type PowerMode = 'eco'|'balanced'|'power'

export type DeviceConfig = {
    device_name: string|null,
    power_mode: PowerMode|null,
    api_key: string|null,
    wifi_password: string|null,
    wifi_ssid: string|null
};
