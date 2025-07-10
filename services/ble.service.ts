import { PermissionsAndroid, Platform } from "react-native";
import { BleManager } from "react-native-ble-plx";

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

    public async startScan(callback: (device: IStrippedDevice) => void, timeout: number = 3000, onStop?: () => void) {
        if (this.isMock) {
            setTimeout(() => {
                callback({ id: 'mock-1', name: 'Mock Sensor A', isConnectable: true });
            }, 500);
            setTimeout(() => {
                callback({ id: 'mock-2', name: 'Mock Sensor B', isConnectable: true });
            }, 1000);
            return;
        }

        if (this.manager) {
            await this.requestBluetoothPermission();
            this.manager.startDeviceScan(null, null, (error, device) => {
                if (device) {
                    callback(device);
                }
            });
            this.scanTimeout = setTimeout(() => {
                this.stopScan();
                onStop?.();
            }, timeout);
            return;
        }
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
