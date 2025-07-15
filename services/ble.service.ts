import { Alert, PermissionsAndroid, Platform } from "react-native";
import { BleError, BleManager, Device } from "react-native-ble-plx";
import { Buffer } from 'buffer';

export interface IStrippedDevice {
    id: string;
    name: string | null;
    isConnectable: boolean|null;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
export type StateListener = (state: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void;

export class BLEService {
    private manager: BleManager;
    private scanTimeout: ReturnType<typeof setTimeout> | null = null;
    private connectedDevice: Device | null = null;
    private lastConnectedDeviceId: string | null = null;
    private manuallyDisconnected = false;
    private listeners: (StateListener)[];
    private disconnecting: Promise<void | Device> | null = null;
    private connecting = false;

    private static instance: BLEService;

    public static getInstance(): BLEService {
        if (!BLEService.instance) {
            BLEService.instance = new BLEService();
        }
        return BLEService.instance;
    }

    constructor() {
        this.manager = new BleManager();
        this.listeners = [];
    }

    public getManager(): BleManager | null {
        return this.manager;
    }

    public requestBluetoothPermission = async () => {
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
        const state = await this.manager.state();
        return state === 'PoweredOn';
    }

    public async startScan(allowedUUIDs: string[], timeout: number, callback: (error: BleError | null, device: IStrippedDevice | null) => void, onStop?: () => void) {
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
        this.scanTimeout && clearTimeout(this.scanTimeout);
        this.manager.stopDeviceScan();
    }

    public async connectToDevice(deviceId: string): Promise<Device | null> {
        try {
            if(this.disconnecting) await this.disconnecting;
            if(this.connecting) return null;
            this.connecting = true;

            const isDeviceConnected = await this.manager.isDeviceConnected(deviceId);
            if (isDeviceConnected) {
                const devices = await this.manager.devices([deviceId]);
                console.log('connected already', devices)
                this.connectedDevice = devices.length > 0 ? devices[0] : null;
            }else this.connectedDevice = await this.manager.connectToDevice(deviceId);

            if(this.connectedDevice){
                this.notifyStateChange('connected');
                this.connectedDevice.onDisconnected((err) => {
                    if(this.manuallyDisconnected){
                        this.manuallyDisconnected = false;
                        this.notifyStateChange('disconnected')
                        return;
                    }
                    this.attemptReconnect();
                });
            }

            this.lastConnectedDeviceId = this.connectedDevice?.id ?? null;
            this.connecting = false;
            return this.connectedDevice;
        } catch (error) {
            console.error('Error connecting to device:', error);
            this.connecting = false;
            return null;
        }
    }

    public async disconnectFromDevice(): Promise<void> {
        if (this.connectedDevice) {
            this.manuallyDisconnected = true;
            const device = this.connectedDevice;
            this.disconnecting = this.manager.cancelDeviceConnection(device.id).catch((err) => {
                console.error('Error disconnecting from device:', err);
            }).finally(() => {
                console.log('done', this.connectedDevice)
                this.connectedDevice = null;
                console.log('done', this.connectedDevice)
                this.notifyStateChange('disconnected');
                this.disconnecting = null;
            })

            await this.disconnecting;
        }
    }

    private async attemptReconnect() {
        if(this.connecting || !this.lastConnectedDeviceId)
            return;
        this.connecting = true;

        try{
            this.notifyStateChange('reconnecting');
            this.connectedDevice = await this.manager.connectToDevice(this.lastConnectedDeviceId);
            if(this.connectedDevice){
                this.notifyStateChange('connected');
            } else {
                this.notifyStateChange('disconnected');
                this.connectedDevice = null;
            }
        } catch(err){
            this.notifyStateChange('disconnected');
            this.connectedDevice = null;
            console.warn('error while reconnecting', err);
        }finally{
            this.connecting = false;
        }
    }

    public async addConnectionStateListener(listener: StateListener){
        this.listeners.push(listener);
    }

    public async removeConnectionStateListener(listener: StateListener){
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private notifyStateChange(state: ConnectionState) {
        this.listeners.forEach(listener => listener(state));
    }

    public async readCharacteristicForService(serviceUUID: string, characteristicUUID: string): Promise<string | null> {
        if (!this.connectedDevice) {
            console.error('No connected device to read from.');
            return null;
        }
        try {
            const characteristic = await this.connectedDevice?.readCharacteristicForService(serviceUUID, characteristicUUID);

            const base64Value = characteristic?.value;
            if (!base64Value) return null;

            const response = Buffer.from(base64Value, 'base64').toString('utf-8');
            return response ?? null;
        } catch (error) {
            console.error('Error reading characteristic:', error);
            return null;
        }
    }

    public async writeCharacteristicWithResponseForService(serviceUUID: string, characteristicUUID: string, value: string): Promise<string | null> {
        if(!this.connectedDevice) {
            console.error('No connected device to write to.');
            return null;
        }
        try {
            const base64Request = Buffer.from(value, 'utf-8').toString('base64');
            const characteristic = await this.connectedDevice?.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, base64Request);

            if (!characteristic?.value) return null;

            const response = Buffer.from(characteristic.value, 'base64').toString('utf-8');
            return response ?? null;
        } catch (error) {
            console.error('Error writing characteristic:', error);
            return null;
        }
    }

    public destroy(): void {
        if (this.scanTimeout) clearTimeout(this.scanTimeout);
        this.manager.destroy();
    }
}
