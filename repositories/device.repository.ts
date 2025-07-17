import { config } from "constants/config";
import { useDeviceStore } from "hooks/useDeviceStore";
import { BLEService } from "services/ble.service";
import { DeviceConfig } from "types/device";

const CACHE_TTL = 10_000;

export class DeviceRepository {
    private static instance: DeviceRepository;
    private bleService: BLEService;
    private serviceUUID: string;
    private characteristicUUID: string;

    constructor() {
        this.bleService = BLEService.getInstance();
        this.serviceUUID = config.allowedServiceUUIDs[0];
        this.characteristicUUID = config.characteristicUUIDs.device;
    }

    public static getInstance() {
        if(!this.instance)
            this.instance = new DeviceRepository();
        return this.instance;
    }

    private setData(data: Partial<DeviceConfig>): void {
        const { data: old, setData } = useDeviceStore.getState();
        setData({ 
            device_name: '',
            wifi_ssid: '',
            wifi_password: '',
            api_key: '',
            ...old,
            ...data
        });
    }

    private async fetchData(): Promise<boolean> {
        const deviceResponse = await this.bleService.readCharacteristicForService(this.serviceUUID, this.characteristicUUID).then(response => {
            if(response && typeof response === 'string') return JSON.parse(response) as DeviceConfig;
            return null;
        });

        if(deviceResponse){
            this.setData(deviceResponse);
            return true;
        }

        return false;
    }

    public async getData(fetch: boolean = false): Promise<DeviceConfig|null> {
        const { data, lastUpdated } = useDeviceStore.getState();
        
        if(!fetch && lastUpdated + CACHE_TTL > Date.now())
            return data;

        const success = await this.fetchData();
        if(!success){
            return data ?? null; // fallback on old value
        }

        return useDeviceStore.getState().data;
    }

    public async updateData(data: Partial<DeviceConfig>): Promise<boolean> {
        const response = await this.bleService.writeCharacteristicWithResponseForService(this.serviceUUID, this.characteristicUUID, JSON.stringify(data));
        if(response) {
            this.setData(data);
            return true;
        }

        return false;
    }

    public handleLiveDataUpdate(data: DeviceConfig): void {
        this.setData(data);
    }
}
