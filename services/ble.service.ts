import { Alert, PermissionsAndroid, Platform } from "react-native";
import { BleError, BleErrorCode, BleManager, Device, Subscription } from "react-native-ble-plx";
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
    private listeners: (StateListener)[];
    private disconnecting: Promise<void | Device> | null = null;
    private lastDisconnect = 0;
    private connecting = false;
    private disconnectSubscription: Subscription | null = null;

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
        this.disconnectHandler = this.disconnectHandler.bind(this);
    }

    public getManager(): BleManager | null {
        return this.manager;
    }

    public async isBluetoothEnabled(): Promise<boolean> {
        const state = await this.manager.state();
        return state === 'PoweredOn';
    }

    public async startScan(allowedUUIDs: string[], timeout: number, callback: (error: BleError | null, device: IStrippedDevice | null) => void, onStop?: () => void) {
        const granted = await requestBluetoothPermission();
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

    private async disconnectHandler(err: BleError | null, device: Device){
        this.lastDisconnect = Date.now();
        this.notifyStateChange('disconnected')
        this.attemptReconnect();
    }

    public async connectToDevice(deviceId: string): Promise<Device | null> {
        try {
            if(this.connecting) // if connecting or connected already, cancel that connection
                await this.disconnectFromDevice();
            this.connecting = true;

            this.notifyStateChange("connecting") // update state
            if(this.disconnecting) { // if still disconnecting wait to finish
                await this.disconnecting;
                this.notifyStateChange("connecting") // update state because of on disconnect state change
            }

            // THIS CODE IS POTENTIALY CAUSING BUG WHEN DISCONNECT WHILE WAITING HERE TO CONNECT
            // 
            // const hold = 1000 - (Date.now() - this.lastDisconnect); // because of device potential issues hold for at least 1s after disconnect
            // if(hold > 0)
            //     await new Promise(resolve => setTimeout(resolve, hold));

            this.connectedDevice = null;
            const isDeviceConnected = await this.manager.isDeviceConnected(deviceId);
            if (isDeviceConnected) { // if already connected somehow? should be removed probably, idk...
                const devices = await this.manager.devices([deviceId]);
                this.connectedDevice = devices.length > 0 ? devices[0] : null;
            }else this.connectedDevice = await this.manager.connectToDevice(deviceId);

            if(this.connectedDevice) { // if device connected successfully
                await this.connectedDevice.discoverAllServicesAndCharacteristics();

                this.notifyStateChange('connected');

                if(this.disconnectSubscription) this.disconnectSubscription.remove(); // remove old and add new subscription
                this.disconnectSubscription = this.connectedDevice.onDisconnected(this.disconnectHandler)
            }else { // on not connected
                this.notifyStateChange('disconnected');
            }

            this.lastConnectedDeviceId = this.connectedDevice?.id ?? null;
            this.connecting = false;
            return this.connectedDevice;
        } catch (err) {
            if(err instanceof BleError){
                if(err.errorCode === BleErrorCode.DeviceDisconnected
                    || err.errorCode === BleErrorCode.OperationCancelled) // silently handle - probably trying to connect in parallel and one being cancelled
                    return null;
            }
            console.warn('[ble.service.ts]connectToDevice:', err);
            this.notifyStateChange('disconnected')
            this.connecting = false;
            return null;
        }
    }

    public async disconnectFromDevice(): Promise<void> {
        if (!this.connectedDevice) 
            return;

        try{
            const device = this.connectedDevice;
            if(this.disconnectSubscription) this.disconnectSubscription.remove(); // remove it before it disconnects so attemptReconnect wont be called on manually disconnected device
            this.disconnecting = this.manager.cancelDeviceConnection(device.id).catch((err) => {
                if(err instanceof BleError){
                    if(err.errorCode === BleErrorCode.OperationCancelled) // silently handle
                        return;
                }
                console.warn('[ble.service.ts]disconnectFromDevice catched:', err);
            }).finally(() => {
                this.connectedDevice = null;
                this.disconnecting = null;
                this.notifyStateChange('disconnected');
            })
            await this.disconnecting;
        }catch(err){
            console.error('[ble.service.ts]disconnectFromDevice:', err);
        }
    }

    private async attemptReconnect() {
        if(!this.lastConnectedDeviceId)
            return;

        this.notifyStateChange('reconnecting');
        
        if(this.disconnecting) {
            console.warn('waiting for disconnect in reconnect?')
            await this.disconnecting;
            this.notifyStateChange('reconnecting');
        }

        try{
            this.connectedDevice = await this.manager.connectToDevice(this.lastConnectedDeviceId);
            if(this.connectedDevice){
                await this.connectedDevice.discoverAllServicesAndCharacteristics();
                this.notifyStateChange('connected');

                if(this.disconnectSubscription) this.disconnectSubscription.remove();
                this.disconnectSubscription = this.connectedDevice.onDisconnected(this.disconnectHandler);
            } else {
                this.notifyStateChange('disconnected');
                this.connectedDevice = null;
            }
        } catch(err){
            console.warn('[ble.service.ts]attemptReconnect:', err); // this one can also be due to cancelation in parallel connection
            this.notifyStateChange('disconnected');
            this.connectedDevice = null;
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

    public monitorCharacteristic(serviceUUID: string, characteristicUUID: string, onData: (data: string) => void) {
        if (!this.connectedDevice) {
            console.error('No connected device to monitor from.');
            return null;
        }

        return this.connectedDevice.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
            if (error) {                
                if(error.errorCode === BleErrorCode.OperationCancelled // silently handle
                    || error.errorCode === BleErrorCode.DeviceDisconnected // should be handled in onDisconnect
                    || error.errorCode === BleErrorCode.DeviceNotConnected) 
                    return;

                console.error('[ble.service.ts]monitorCharacteristic:', error);
                return;
            }
            if (!characteristic?.value) return;

            const decoded = Buffer.from(characteristic.value, 'base64').toString('utf-8');
            onData(decoded);
        });
    }


    public async readCharacteristic(serviceUUID: string, characteristicUUID: string): Promise<string | null> {
        if (!this.connectedDevice) {
            console.error('No connected device to read from.');
            return null;
        }
        try {
            const characteristic = await this.connectedDevice.readCharacteristicForService(serviceUUID, characteristicUUID);

            const base64Value = characteristic?.value;
            if (!base64Value) return null;

            const response = Buffer.from(base64Value, 'base64').toString('utf-8');
            return response ?? null;
        } catch (err) {
            if(err instanceof BleError){
                if(err.errorCode === BleErrorCode.OperationCancelled // silently handle
                    || err.errorCode === BleErrorCode.DeviceDisconnected // should be handled in onDisconnect
                    || err.errorCode === BleErrorCode.DeviceNotConnected) 
                    return null;
            }
            
            console.error('[ble.service.ts]readCharacteristicForService:', err);
            return null;
        }
    }

    public async writeCharacteristicWithResponse(serviceUUID: string, characteristicUUID: string, value: string): Promise<string | null> {
        if(!this.connectedDevice) {
            console.error('No connected device to write to.');
            return null;
        }
        try {
            const base64Request = Buffer.from(value, 'utf-8').toString('base64');
            const characteristic = await this.connectedDevice.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, base64Request);

            if (!characteristic?.value) return null;

            const response = Buffer.from(characteristic.value, 'base64').toString('utf-8');
            return response ?? null;
        } catch (error) {
            console.error('[ble.service.ts]writeCharacteristicWithResponseForService:', error);
            return null;
        }
    }

    public destroy(): void {
        if (this.scanTimeout) clearTimeout(this.scanTimeout);

        this.disconnectSubscription?.remove();
        this.manager.destroy();
    }
}

const requestBluetoothPermission = async () => {
    if (Platform.OS === 'ios') return true;
    if (Platform.OS === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
        const apiLevel = parseInt(Platform.Version.toString(), 10);

        if (apiLevel < 31) {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
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
