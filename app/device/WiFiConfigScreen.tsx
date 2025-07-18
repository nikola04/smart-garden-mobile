import Button from "components/Button";
import { useNavigation } from "@react-navigation/native";
import { RootNavigationProp } from "navigation/RootNavigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import ConfigField from "components/ConfigButton";
import { DeviceRepository } from "repositories/device.repository";

const deviceRepository = DeviceRepository.getInstance();

export default function WiFiConfigScreen(){
    const [ssid, setSSID] = useState<string>("");
    const [pswd, setPswd] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const navigation = useNavigation<RootNavigationProp>();
    
    const isCanceled = useRef(false);
    
    const handleSave = useCallback(async () => {
        if(loading) return;
        setLoading(true);

        deviceRepository.updateData({
            wifi_ssid: ssid,
            wifi_password: pswd
        });

        if(isCanceled.current) return;

        setLoading(false);
        Alert.alert('Wi-Fi Settings updated successfully.')
        navigation.goBack();
    }, [loading, navigation, pswd, ssid]);

    useEffect(() => {
        isCanceled.current = false;

        (async () => {
            const data = await deviceRepository.getData();
            setLoading(false);

            if(isCanceled.current || !data?.device_name)
                return;

            setSSID(data.wifi_ssid ?? '');
            setPswd(data.wifi_password ?? '');
        })();
        
        return () => { isCanceled.current = true };
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
                        placeholder="Name..."
                        value={ssid}
                        setValue={setSSID}
                    />
                    <ConfigField
                        title="Password"
                        desc="Old password won&apos;t be shown here!"
                        placeholder="Password..."
                        value={pswd}
                        setValue={setPswd}
                        secureEntry={true}
                    />
                </View>
            </View>
            <View className="flex w-full">
                <Button title="Save" loading={loading} onPress={handleSave}/>
            </View>
        </View>
    </KeyboardAvoidingView>
}
