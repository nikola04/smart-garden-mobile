import Button from "components/Button";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { RootNavigationProp } from "navigation/RootNavigation";
import ConfigField from "components/ConfigButton";
import { DeviceRepository } from "repositories/device.repository";
import { useDeviceStore } from "hooks/useDeviceStore";

const deviceRepository = DeviceRepository.getInstance();

export default function DeviceConfigScreen(){
    const { data } = useDeviceStore();
    const [name, setName] = useState<string>(data?.device_name ?? '');
    const [loading, setLoading] = useState<boolean>(true);
    const navigation = useNavigation<RootNavigationProp>();
    
    const isCanceled = useRef(false);

    const handleSave = useCallback(async () => {
        if(loading) return;
        setLoading(true);

        const success = await deviceRepository.updateData({
            device_name: name
        });
        if(isCanceled.current) return;

        if(success)
            Alert.alert('Device updated successfully.')

        navigation.goBack();
        setLoading(false);
    }, [loading, name, navigation]);

    useEffect(() => {
        isCanceled.current = false;

        (async () => {
            const data = await deviceRepository.getData();
            setLoading(false);

            if(isCanceled.current || !data?.device_name)
                return;

            setName(data.device_name);
        })();
        
        return () => { isCanceled.current = true };
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
                <Button title="Save" loading={loading} onPress={handleSave} />
            </View>
        </View>
    </KeyboardAvoidingView>
}
