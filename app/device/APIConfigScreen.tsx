import Button from "components/Button";
import { config } from "constants/config";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { BLEService } from "services/ble.service";
import { RootNavigationProp } from "navigation/RootNavigation";
import ConfigField from "components/ConfigButton";

const bleService = BLEService.getInstance();

export default function APIConfigScreen(){
    const [key, setKey] = useState<string>("");
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
                api_key: key
            });

            await bleService.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, JSON.stringify(data));
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
        isCanceled.current = false;
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
                    <Text className="font-bold text-foreground text-lg">Configure API Settings</Text>
                    <Text className="text-foreground/40 text-sm">Set key generated in project you selected.</Text>
                </View>
                <View className="gap-8">
                    <ConfigField
                        title="Key"
                        desc="Old key won&apos;t be shown here!"
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxx..."
                        value={key}
                        setValue={setKey}
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
