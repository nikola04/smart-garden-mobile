import Button from "components/Button";
import { config } from "constants/config";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { BLEService, ConnectionState } from "services/ble.service";
import { RootNavigationProp } from "navigation/RootNavigation";
import ConfigField from "components/ConfigField";
import { ServerCog } from "lucide-react-native";
import useTheme from "hooks/useTheme";

const bleService = BLEService.getInstance();

export default function APIConfigScreen(){
    const [key, setKey] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation<RootNavigationProp>();
    const [state, setState] = useState<ConnectionState>('connected');
    const theme = useTheme();
    
    const isCanceled = useRef(false);

    const updateConfig = useCallback(async () => {
        if(loading) return;
        try{
            setLoading(true);
            const serviceUUID = config.allowedServiceUUIDs[0];
            const characteristicUUID = config.characteristic.device.uuid;
            const data = ({
                api_key: key
            });

            await bleService.writeCharacteristicWithResponse(serviceUUID, characteristicUUID, JSON.stringify(data));
            if(isCanceled.current) return;
            Alert.alert('API Key updated successfully.')
            navigation.goBack();
        }catch(err){
            console.log(err)
        }finally{
            if(isCanceled.current) return;
            setLoading(false);
        }
    }, [key, loading, navigation]);

    useEffect(() => {
        if(state !== 'connected'){
            navigation.goBack();
            return;
        }
    }, [navigation, state]);

    useEffect(() => {
        isCanceled.current = false;
        const stateHandler = (state: ConnectionState) => setState(state);
        bleService.addConnectionStateListener(stateHandler);

        return () => {
            isCanceled.current = true;
            bleService.removeConnectionStateListener(stateHandler);
        }
    }, []);

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
                        <ServerCog color={theme.foreground} size={16} />
                        <Text className="font-bold text-lg" style={{ color: theme.foreground }}>Configure API</Text>
                    </View>
                    <Text className="text-sm" style={{ color: theme.rgba(theme.foreground, .4) }}>Set key generated in project settings.</Text>
                </View>
                <View className="gap-8">
                    <ConfigField
                        title="Key"
                        desc="Old key won&apos;t be shown here!"
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxx..."
                        value={key}
                        onChangeText={setKey}
                        secureTextEntry={true}
                    />
                </View>
            </View>
            <View className="flex w-full">
                <Button title="Save" loading={loading} onPress={updateConfig}/>
            </View>
        </View>
    </KeyboardAvoidingView>
}
