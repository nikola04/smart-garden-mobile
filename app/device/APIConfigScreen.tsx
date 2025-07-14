import Button from "components/Button";
import { config } from "constants/config";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import { BLEService } from "services/ble.service";
import { RootNavigationProp } from "navigation/RootNavigation";

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
                    <Text className="font-bold text-lg">Configure API Settings</Text>
                    <Text className="text-black/40 text-sm">Set key generated in project you selected.</Text>
                </View>
                <View className="gap-8">
                    <View className="w-full gap-2">
                        <View className="flex flex-row justify-between items-end">
                            <Text className="font-semibold px-2">Key:</Text>
                            <Text className="text-black/25 text-xs pr-1">Old key won&apos;t be shown here!</Text>
                        </View>
                        <TextInput 
                            className="p-4 rounded-full border border-black/5 text-black/80" 
                            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxx..."
                            value={key}
                            onChangeText={setKey}
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
