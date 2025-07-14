import Button from "components/Button";
import { useNavigation } from "@react-navigation/native";
import { config } from "constants/config";
import { RootNavigationProp } from "navigation/RootNavigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { BLEService } from "services/ble.service";
import ConfigField from "components/ConfigButton";

type DeviceConfig = {
    api_key: string,
    wifi_password: string,
    wifi_ssid: string
} | null;

const bleService = BLEService.getInstance();

export default function WiFiConfigScreen(){
    const [ssid, setSSID] = useState<string>("");
    const [pswd, setPswd] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const navigation = useNavigation<RootNavigationProp>();
    
    const isCanceled = useRef(false);
    
    const updateConfig = useCallback(async () => {
        if(loading) return;
        try{
            setLoading(true);
            const serviceUUID = config.allowedServiceUUIDs[0];
            const characteristicUUID = config.characteristicUUIDs.deviceConfigs;
            const data = ({
                wifi_ssid: ssid,
                wifi_pswd: pswd
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
    }, [loading, navigation, pswd, ssid]);


    const fetchConfig = async () => {
        const serviceUUID = config.allowedServiceUUIDs[0];
        const characteristicUUID = config.characteristicUUIDs.deviceConfigs;
        const configResponse = await bleService.readCharacteristicForService(serviceUUID, characteristicUUID).then(response => {
            if(response && typeof response === 'string') return JSON.parse(response) as DeviceConfig;
            return null;
        });

        if(isCanceled.current)
            return;

        setSSID(configResponse?.wifi_ssid ?? '');
        setLoading(false);
    }

    useEffect(() => {
        isCanceled.current = false;

        fetchConfig();
        return () => {
            isCanceled.current = true;
        }
    }, [])
    
    return <KeyboardAvoidingView 
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
        <View className="flex-1 justify-between items-center px-8 pt-6 pb-16">
            <View className="flex-1 w-full gap-12">
                <View>
                    <Text className="font-bold text-foreground text-lg">Configure WiFi Settings</Text>
                    <Text className="text-foreground/40 text-sm">Set wifi ssid and password.</Text>
                </View>
                <View className="gap-8">
                    <ConfigField
                        title="SSID"
                        placeholder="WiFi name..."
                        value={ssid}
                        setValue={setSSID}
                    />
                    <ConfigField
                        title="Password"
                        desc="Old password won&apos;t be shown here!"
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxx..."
                        value={pswd}
                        setValue={setPswd}
                        secureEntry={true}
                    />
                </View>
            </View>
            <View className="flex w-full">
                <Button title="Save" loading={loading} onPress={updateConfig}/>
            </View>
        </View>
    </KeyboardAvoidingView>
}
