import Button from "components/Button";
import { RootStackParamList } from "navigation/RootNavigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import ConfigField from "components/ConfigField";
import { DeviceRepository } from "repositories/device.repository";
import { WifiCog } from "lucide-react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { AnimatedPressable } from "components/AnimatedPressable";
import useTheme from "hooks/useTheme";

const deviceRepository = DeviceRepository.getInstance();

type WiFiConfigScreenProps = StackScreenProps<RootStackParamList, 'WiFi Configuration'>;
export default function WiFiConfigScreen({ route, navigation }: WiFiConfigScreenProps){
    const [ssid, setSSID] = useState<string>();
    const [pswd, setPswd] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const theme = useTheme();
    
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
        className="flex-1"
        style={{ backgroundColor: theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
        <View className="flex-1 justify-between items-center px-8 pt-6 pb-16">
            <View className="flex-1 w-full gap-12">
                <View>
                    <View className="flex flex-row items-center gap-2">
                        <WifiCog color={theme.foreground} size={16} />
                        <Text className="font-bold text-lg" style={{ color: theme.foreground }}>Configure Wi-Fi</Text>
                    </View>
                    <Text className="text-sm" style={{ color: theme.rgba(theme.foreground, .4) }}>Set wifi ssid and password.</Text>
                </View>
                <View className="gap-8">
                    <ConfigField
                        title="SSID"
                        placeholder="Name..."
                        value={ssid}
                        onChangeText={setSSID}
                    />
                    <ConfigField
                        title="Password"
                        desc="Old password won&apos;t be shown here!"
                        placeholder="Password..."
                        value={pswd}
                        onChangeText={setPswd}
                        secureTextEntry={true}
                    />
                </View>
                <AnimatedPressable>
                    <View className="flex items-center justify-center p-4 rounded-3xl" style={{ backgroundColor: theme.backgroundAlt }}>
                        <Text className="text-center" style={{ color: theme.rgba(theme.foreground, .8) }}>Scan Networks</Text>
                    </View>
                </AnimatedPressable>
            </View>
            <View className="flex w-full">
                <Button title="Save" loading={loading} onPress={handleSave}/>
            </View>
        </View>
    </KeyboardAvoidingView>
}
