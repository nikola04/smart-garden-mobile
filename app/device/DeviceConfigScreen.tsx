import Button from "components/Button";
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Alert, Animated, KeyboardAvoidingView, Platform, Pressable, PressableProps, Text, View } from "react-native";
import { RootNavigationProp } from "navigation/RootNavigation";
import ConfigField from "components/ConfigField";
import { DeviceRepository } from "repositories/device.repository";
import { useDeviceStore } from "hooks/useDeviceStore";
import { PowerMode } from "types/device";
import { Flame, Leaf, LucideIcon, MonitorCog, Zap } from "lucide-react-native";
import useTheme from "hooks/useTheme";

const deviceRepository = DeviceRepository.getInstance();

export default function DeviceConfigScreen(){
    const { data } = useDeviceStore();
    const theme = useTheme();
    const [name, setName] = useState<string>(data?.device_name ?? '');
    const [powerMode, setPowerMode] = useState<PowerMode|null>(data?.power_mode ?? null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigation = useNavigation<RootNavigationProp>();
    
    const isCanceled = useRef(false);

    const hasChanges = useMemo(() => {
        if(!powerMode) 
            return false;
        if(!name || name.length < 1)
            return false;

        return name !== data?.device_name || powerMode !== data.power_mode;
    }, [name, powerMode, data?.device_name, data?.power_mode]);

    const handleSave = useCallback(async () => {
        if(loading) return;
        setLoading(true);

        const success = await deviceRepository.updateData({
            device_name: name,
            power_mode: powerMode ?? undefined
        });
        if(isCanceled.current) return;

        if(success)
            Alert.alert('Device updated successfully.')

        navigation.goBack();
        setLoading(false);
    }, [loading, name, navigation, powerMode]);

    useEffect(() => {
        isCanceled.current = false;

        (async () => {
            setLoading(true);
            const data = await deviceRepository.getData();

            if(isCanceled.current || !data?.device_name)
                return;

            setLoading(false);
            setName(data.device_name);
            setPowerMode(data.power_mode);
        })();
        
        return () => { isCanceled.current = true };
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
                        <MonitorCog color={theme.foreground} size={16} />
                        <Text className="font-bold text-lg" style={{ color: theme.foreground }}>Configure Device</Text>
                    </View>
                    <Text className="text-sm" style={{ color: theme.rgba(theme.foreground, .4) }}>Set device name and others.</Text>
                </View>
                <View className="gap-8">
                    <ConfigField
                        title="Name"
                        placeholder="ESP32"
                        value={name}
                        onChangeText={setName}
                    />
                    <View className="flex gap-2">
                        <Text className="font-semibold px-2" style={{ color: theme.foreground }}>Wireless Mode:</Text>
                        <View className="flex-row justify-between rounded-3xl p-2" style={{ backgroundColor: theme.backgroundAlt }}>
                            { modes.map((mode) => <PowerModeButton key={mode.name} mode={mode} isSelected={powerMode === mode.name} onPress={() => setPowerMode(mode.name)} />) }
                        </View>
                    </View>
                </View>
            </View>
            <View className="flex w-full">
                <Button title="Save" disabled={!hasChanges} loading={loading} onPress={handleSave} />
            </View>
        </View>
    </KeyboardAvoidingView>
}

function PowerModeButton({ mode, isSelected, ...rest }: {
    mode: any,
    isSelected: boolean
} & PropsWithChildren<PressableProps>) {
    const theme = useTheme();

    const scale = useRef(new Animated.Value(isSelected ? 1 : 0.95)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: isSelected ? 1 : 0.95,
            useNativeDriver: true,
            friction: 5,
        }).start();
    }, [isSelected, scale]);

    return (
        <Pressable { ...rest }>
            <Animated.View style={{ transform: [{ scale }], backgroundColor: isSelected ? theme.primary : undefined }} className='px-4 py-2.5 rounded-2xl'>
                <View className="flex flex-row items-center gap-2">
                    <mode.Icon color={isSelected ? theme.background : theme.foreground} size={15} />
                    <Text className='text-sm font-semibold' style={{ color: isSelected ? theme.background : theme.foreground }} >
                        {mode.name.toUpperCase()}
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
}

const modes: { name: PowerMode, Icon: LucideIcon }[] = [{
    name: 'eco',
    Icon: Leaf
}, {
    name: 'balanced',
    Icon: Flame
}, {
    name: 'power',
    Icon: Zap
}];
