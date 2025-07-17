import { config } from "constants/config";
import { useSensorStore } from "hooks/useSensorsStore";
import { Subscription } from "react-native-ble-plx";
import { BLEService } from "services/ble.service";
import { SensorData } from "types/sensors";

const CACHE_TTL = 10_000;

export class SensorsRepository {
    private static instance: SensorsRepository;
    private bleService: BLEService;
    private serviceUUID: string;
    private characteristicUUID: string;
    private currentLiveSubscription: Subscription | null = null;

    constructor() {
        this.bleService = BLEService.getInstance();
        this.serviceUUID = config.allowedServiceUUIDs[0];
        this.characteristicUUID = config.characteristicUUIDs.sensors;
    }

    public static getInstance() {
        if(!this.instance)
            this.instance = new SensorsRepository();
        return this.instance;
    }

    private setData(data: Partial<SensorData>): void {
        const { data: old, setData } = useSensorStore.getState();
        setData({ 
            ...old,
            ...data
        });
    }

    private async fetchData(): Promise<boolean> {
        const sensorsResponse = await this.bleService.readCharacteristic(this.serviceUUID, this.characteristicUUID).then(response => {
            if(response && typeof response === 'string') return JSON.parse(response) as SensorData;
            return null;
        });

        if(sensorsResponse){
            this.setData(sensorsResponse);
            return true;
        }

        return false;
    }

    public async getData(fetch: boolean = false): Promise<SensorData|null> {
        const { data, lastUpdated } = useSensorStore.getState();
        
        if(!fetch && lastUpdated + CACHE_TTL > Date.now())
            return data;

        const success = await this.fetchData();
        if(!success){
            return data ?? null; // fallback on old value
        }

        return useSensorStore.getState().data;
    }

    private handleLiveDataUpdate(data: string): void {
        const json = JSON.parse(data) as Partial<SensorData>;
        this.setData(json);
    }

    public startLiveListening(): Subscription|null {
        this.currentLiveSubscription?.remove();
        this.currentLiveSubscription = BLEService.getInstance().monitorCharacteristic(this.serviceUUID, this.characteristicUUID, this.handleLiveDataUpdate.bind(this));
        return this.currentLiveSubscription;
    }
}
