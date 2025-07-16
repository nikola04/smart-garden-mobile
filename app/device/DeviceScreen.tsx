import {  PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PressableProps, SafeAreaView, Text, View } from "react-native";
import { useNavigation, type StaticScreenProps } from '@react-navigation/native';
import Loader from "components/Loader";
import { Battery, Bluetooth, BluetoothSearching, ChevronRight, LucideIcon, MonitorCog, ServerCog, Wifi, WifiCog } from "lucide-react-native";
import { BLEService, ConnectionState, IStrippedDevice } from "services/ble.service";
import { RootNavigationProp } from "navigation/RootNavigation";
import colors from "constants/colors";
import { AnimatedPressable } from "components/AnimatedPressable";

const bleService = BLEService.getInstance();

const getStateColor = (state: ConnectionState) => {
    switch (state) {
        case 'connecting':
        case 'reconnecting':
            return '#FACC15';
        case 'disconnected':
            return '#EF4444';
        default:
            return colors.primary;
    }
}

export default function DeviceScreen({ route }: StaticScreenProps<{
    device: IStrippedDevice
}>) {
    const [state, setState] = useState<ConnectionState>('disconnected');
    const navigation = useNavigation<RootNavigationProp>();
    const params = route.params;

    const dynamicText = useMemo(() => {
        if(state === 'connecting') return 'Connecting...';
        if(state === 'reconnecting') return 'Reconnecting...';
        if(state === 'disconnected') return 'Disconnected';
        if(state === 'connected') return 'Connected';
    }, [state]);

    useEffect(() => {
        const stateHandler = (state: ConnectionState) => {
            setState(state)
        }
        bleService.addConnectionStateListener(stateHandler);

        const connect = async () => {
            try {
                const connectedDevice = await bleService.connectToDevice(params.device.id) ?? null;
                if(!connectedDevice){
                    console.warn('device null...');
                    return;
                }
            }catch(err){
                console.warn('error connecting to device...', err);
                return;
            }
        }

        connect();

        return () => {
            bleService.removeConnectionStateListener(stateHandler);
            bleService.disconnectFromDevice();
        }
    }, [params.device])

    const navigateDeviceConfig = () => navigation.navigate('Device Configuration');
    const navigateWifiConfig = () => navigation.navigate('WiFi Configuration');
    const navigateAPIConfig = () => navigation.navigate('API Configuration');
     
    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex gap-2 py-8">
                <Text className="font-bold text-base text-center text-foreground">{ params.device.name }</Text>
                <Text className="font-semibold uppercase text-center" style={{ color: getStateColor(state) }}>{ dynamicText }</Text>
            </View>
            { (state === 'connecting' || state === 'reconnecting') && <View className="flex-1 items-center justify-center">
                <ConnectingLoader state={state} />
            </View> }
            { state === 'connected' && <View className="flex-1 px-6 gap-8">
                <View className="flex flex-row flex-wrap w-full gap-6">
                    <StatusBox name="Wi-Fi" status={"Connected"} icon={Wifi} />
                    <StatusBox name="Bluetooth" status={"Connected"} icon={Bluetooth} />
                    <StatusBox name="Battery" status={"100%"} icon={Battery} />
                </View>
                <View className="flex-1 gap-4">
                    <ConfigButton name="Device" onPress={navigateDeviceConfig} >
                        <MonitorCog color={colors.foreground} size={16} />
                    </ConfigButton>
                    <ConfigButton name="Wi-Fi Settings" onPress={navigateWifiConfig} >
                        <WifiCog color={colors.foreground} size={16} />
                    </ConfigButton>
                    <ConfigButton name="API Configuration" onPress={navigateAPIConfig} >
                        <ServerCog color={colors.foreground} size={16} />
                    </ConfigButton>
                </View>
            </View> }
        </SafeAreaView>
    );
}

function StatusBox({ name, status, icon, children, ...rest }: {
    name: string;
    status: string;
    icon: LucideIcon;
} & PropsWithChildren<PressableProps>){
    const Icon = icon;
    return <AnimatedPressable {...rest} className="flex min-w-28 max-w-40 flex-grow">
        <View className="flex p-4 gap-4 bg-background-alt rounded-xl">
            <Icon size={16} color={colors.foreground} />
            <View className="flex gap-1">
                <Text className="text-foreground">{ name }</Text>
                <Text className="text-foreground/80 text-sm">{ status }</Text>
            </View>
            { children }
        </View>
    </AnimatedPressable>
}

function ConfigButton({ name, onPress, children }: {
    name: string,
    onPress: () => any
} & PropsWithChildren){
    return <AnimatedPressable onPress={onPress}>
        <View className="flex flex-row items-center justify-between p-4 bg-background-alt rounded-xl">
            <View className="flex flex-row items-center gap-3">
                { children }
                <Text className="text-foreground">{ name }</Text>
            </View>
            <ChevronRight color={colors.foreground} size={22} />
        </View>
    </AnimatedPressable>
}

function ConnectingLoader({ state }: {
    state: string
}){
    const pulseAnimation = useRef(new Animated.Value(0)).current;
    const pulseOpacity = pulseAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 0]
    })

    useEffect(() => {
        if(state !== 'connecting' && state !== 'reconnecting') 
            return;

        const loop = Animated.loop(Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
        }))
        loop.start();

        return loop.stop;
    }, [pulseAnimation, state]);
    
    return <Loader className="relative flex-1 items-center justify-center w-full h-full">
        <Animated.View className="absolute w-full h-full rounded-full bg-primary/25" style={{
            transform: [{
                scale: pulseAnimation
            }],
            opacity: pulseOpacity
        }}>
        </Animated.View>
        <BluetoothSearching color={colors.primary} size={48}/>
    </Loader> 
}
