import Button from "components/Button";
import { useNavigation } from "@react-navigation/native";
import { config } from "constants/config";
import { RootNavigationProp } from "navigation/RootNavigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import { BLEService } from "services/ble.service";

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
        })
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
                    <Text className="font-bold text-lg">Configure WiFi Settings</Text>
                    <Text className="text-black/40 text-sm">Set wifi ssid and password.</Text>
                </View>
                <View className="gap-8">
                    <View className="w-full gap-2">
                        <View className="flex flex-row justify-between items-end">
                            <Text className="font-semibold px-2">SSID:</Text>
                        </View>
                        <TextInput 
                            className="p-4 rounded-full border border-black/5 text-black/80" 
                            placeholder="WiFi name..."
                            value={ssid}
                            onChangeText={setSSID}
                        />
                    </View>
                    <View className="w-full gap-2">
                        <View className="flex flex-row justify-between items-end">
                            <Text className="font-semibold px-2">Password:</Text>
                            <Text className="text-black/25 text-xs pr-1">Old password won&apos;t be shown here!</Text>
                        </View>
                        <TextInput 
                            className="p-4 rounded-full border border-black/5 text-black/80" 
                            secureTextEntry={true}
                            placeholder="WiFi password..."
                            value={pswd}
                            onChangeText={setPswd}
                        />
                    </View>
                </View>
            </View>
            <View className="flex w-full">
                <Button title="Save" loading={loading} onPress={updateConfig}/>
            </View>
        </View>
    </KeyboardAvoidingView>
}
