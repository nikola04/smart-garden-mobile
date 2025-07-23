import { config } from "constants/config";
import { BLEService } from "services/ble.service";

export class DeviceController{
    private static instance: DeviceController;
    private bleService: BLEService;
    private serviceUUID: string;
    private characteristicUUID: string;

    constructor() {
        this.bleService = BLEService.getInstance();
        const service = config.bleServices.deviceService;
        this.serviceUUID = service.uuid;
        this.characteristicUUID = service.characteristics.system.uuid;
    }

    public static getInstance(){
        if(!this.instance) this.instance = new DeviceController();
        return this.instance;
    }

    private async sendCommand(command: 'sleep'|'restart'){
        return this.bleService.writeCharacteristicWithResponse(this.serviceUUID, this.characteristicUUID, command);
    }

    public async restart(){
        return this.sendCommand('restart');
    }

    public async sleep(){
        return this.sendCommand('sleep');
    }
}
