import { requestPermissions } from "hooks/useBLE";
import { Button, View } from "react-native";
import { BleManager } from "react-native-ble-plx";

const scanForDevices = () => {
    requestPermissions()
    const bleManager = new BleManager();
    bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
            console.error("Error scanning for devices:", error);
            return;
        }
        if (device) {
            console.log("Found device:", device.name || "Unnamed device", device.id);
            // Here you can navigate to the DeviceScreen with the found device
            // For example: navigation.navigate('Device', { device });
        }
    });
}

export default function ScanScreen() {
    const handleScan = () => {
        scanForDevices();
    };

    return (
        <View className="flex-1 items-center justify-center bg-white">
            <Button title="Scan Nearby Devices" onPress={handleScan}/>
        </View>
    );
}
