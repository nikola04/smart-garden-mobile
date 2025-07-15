import Button from "components/Button";
import { config } from "constants/config";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { BLEService } from "services/ble.service";
import { RootNavigationProp } from "navigation/RootNavigation";
import ConfigField from "components/ConfigButton";
import { DeviceConfig } from "types/device";

const bleService = BLEService.getInstance();

export default function DeviceConfigScreen(){
    const [name, setName] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation<RootNavigationProp>();
    
    const isCanceled = useRef(false);

    const updateConfig = useCallback(async () => {
        if(loading) return;
        try{
            setLoading(true);
            const serviceUUID = config.allowedServiceUUIDs[0];
            const characteristicUUID = config.characteristicUUIDs.deviceConfigs;
            const data = ({
                device_name: name
            });

            const response = await bleService.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, JSON.stringify(data));
            if(isCanceled.current) return;
            Toast.show({
                type: 'success',
                text1: 'Hello',
                text2: 'This is some something 👋'
            });
            console.log(response);
            navigation.goBack();
        }catch(err){
            console.log(err)
        }finally{
            if(isCanceled.current) return;
            setLoading(false);
        }
    }, [loading, name, navigation]);

        const fetchConfig = async () => {
            const serviceUUID = config.allowedServiceUUIDs[0];
            const characteristicUUID = config.characteristicUUIDs.deviceConfigs;
            const configResponse = await bleService.readCharacteristicForService(serviceUUID, characteristicUUID).then(response => {
                if(response && typeof response === 'string') return JSON.parse(response) as DeviceConfig;
                return null;
            });
    
            if(isCanceled.current)
                return;
    
            setName(configResponse?.device_name ?? '');
            setLoading(false);
        }

    useEffect(() => {
        isCanceled.current = false;
        fetchConfig();

        return () => {
            isCanceled.current = true;
        }
    }, []);

    return <KeyboardAvoidingView 
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
        <View className="flex-1 justify-between items-center px-8 pt-6 pb-16">
            <View className="flex-1 w-full gap-12">
                <View>
                    <Text className="font-bold text-foreground text-lg">Configure Device Settings</Text>
                    <Text className="text-foreground/40 text-sm">Set device name and others.</Text>
                </View>
                <View className="gap-8">
                    <ConfigField
                        title="Name"
                        placeholder="ESP32"
                        value={name}
                        setValue={setName}
                    />
                </View>
            </View>
            <View className="flex w-full">
                <Button title="Save" loading={loading} onPress={updateConfig}/>
            </View>
        </View>
    </KeyboardAvoidingView>
}
