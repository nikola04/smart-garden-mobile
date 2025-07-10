import { Alert, PermissionsAndroid, Platform } from "react-native";
import { BleError, BleManager } from "react-native-ble-plx";

export interface IStrippedDevice {
    id: string;
    name: string | null;
    isConnectable: boolean|null;
}

export class BLEService {
    private manager: BleManager | null;
    private isMock: boolean;
    private scanTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.isMock = false // __DEV__;
        this.manager = this.isMock ? null : new BleManager();
    }

    public getManager(): BleManager | null {
        return this.manager;
    }

    public requestBluetoothPermission = async () => {
        if (this.isMock) return true;

        if (Platform.OS === 'ios') return true;
        if (Platform.OS === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
            const apiLevel = parseInt(Platform.Version.toString(), 10);

            if (apiLevel < 31) {
                const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }

            if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN && PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                return (
                    result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
                );
            }
        }

        console.error('Permission has not been granted');
        return false;
    };

    public async isBluetoothEnabled(): Promise<boolean> {
        if (this.isMock) return true;
        if (!this.manager) {
            console.error('BLE Manager is not initialized');
            return false;
        }
        const state = await this.manager.state();
        return state === 'PoweredOn';
    }

    public async startScan(allowedUUIDs: string[], timeout: number, callback: (error: BleError | null, device: IStrippedDevice | null) => void, onStop?: () => void) {
        if (this.isMock) {
            setTimeout(() => callback(null, { id: 'mock-1', name: 'Mock Sensor A', isConnectable: true }), 500);
            setTimeout(() => callback(null, { id: 'mock-2', name: 'Mock Sensor B', isConnectable: true }), 1000);
            this.scanTimeout = setTimeout(() => {
                this.stopScan();
                if (onStop) onStop();
            }, timeout);
            return;
        } else if (!this.manager) {
            console.error('BLE Manager is not initialized');
            if (onStop) onStop();
            return;
        }
        
        const granted = await this.requestBluetoothPermission();
        if (!granted) {
            Alert.alert('Bluetooth Permission', 'Please allow Bluetooth in your settings.',[{
                text: "OK"
            }]);
            if (onStop) onStop();
            return;
        }

        this.manager.startDeviceScan(allowedUUIDs, null, callback);
        this.scanTimeout = setTimeout(() => {
            this.stopScan();
            if (onStop) onStop();
        }, timeout);
        return;
    }

    public stopScan() {
        if (this.isMock) return;

        this.scanTimeout && clearTimeout(this.scanTimeout);
        this.manager?.stopDeviceScan();
    }

    public destroy(): void {
        if (!this.isMock && this.manager) {
            this.scanTimeout && clearTimeout(this.scanTimeout);
            this.manager.destroy();
        }
    }
}
