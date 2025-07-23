import { config } from "constants/config";
import { useWiFiScanStore } from "hooks/useWiFiScanStore";
import { Subscription } from "react-native-ble-plx";
import { BLEService } from "services/ble.service";
import { WiFiNetwork } from "types/wifi";

export class WiFiRepository {
    private static instance: WiFiRepository;
    private bleService: BLEService;
    private serviceUUID: string;
    private characteristicUUID: string;
    private currentLiveSubscription: Subscription | null = null;

    constructor() {
        this.bleService = BLEService.getInstance();
        const service = config.bleServices.deviceService;
        this.serviceUUID = service.uuid;
        this.characteristicUUID = service.characteristics.wifi.uuid;
    }

    public static getInstance() {
        if(!this.instance)
            this.instance = new WiFiRepository();
        return this.instance;
    }

    public async startScan(): Promise<boolean> {
        const { resetData, status, setStatus } = useWiFiScanStore.getState();
        if(status === 'scanning')
            return false;

        setStatus('scanning');
        resetData();

        await this.bleService.writeCharacteristicWithResponse(this.serviceUUID, this.characteristicUUID, 'scan');

        return true;
    }

    private handleLiveDataUpdate(raw: string): void {
        const { setStatus } = useWiFiScanStore.getState();
        if(raw === 'done'){
            setStatus('scanned')
            return;
        }
        if(raw === 'fail'){
            setStatus('failed');
            return;
        }
        const json = JSON.parse(raw) as WiFiNetwork;
        const { data, addData } = useWiFiScanStore.getState();
        const found = data.find((val) => val.ssid === json.ssid)
        if(found){
            found.rssi = Math.min(found.rssi, json.rssi)
            return;
        } else addData(json);
    }

    public startLiveListening(): Subscription|null {
        this.currentLiveSubscription?.remove();
        this.currentLiveSubscription = BLEService.getInstance().monitorCharacteristic(this.serviceUUID, this.characteristicUUID, this.handleLiveDataUpdate.bind(this));
        return this.currentLiveSubscription;
    }
}
