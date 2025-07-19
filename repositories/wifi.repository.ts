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
        this.serviceUUID = config.allowedServiceUUIDs[0];
        this.characteristicUUID = config.characteristic.wifi.uuid;
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

        await this.bleService.writeCharacteristicWithResponse(this.serviceUUID, this.characteristicUUID, 'scan').then(response => {
            console.log(response);
            return null;
        });

        return true;
    }

    private handleLiveDataUpdate(raw: string): void {
        const { setStatus } = useWiFiScanStore.getState();
        if(raw === 'done'){
            setStatus('scanned')
            return;
        }
        if(raw === 'fail'){
            console.log('fail')
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
