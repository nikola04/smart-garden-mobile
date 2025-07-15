import {  PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, SafeAreaView, Text, View } from "react-native";
import { useNavigation, type StaticScreenProps } from '@react-navigation/native';
import Loader from "components/Loader";
import { BluetoothSearching, ChevronRight, MonitorCog, ServerCog, WifiCog } from "lucide-react-native";
import { BLEService, ConnectionState, IStrippedDevice } from "services/ble.service";
import { Device } from "react-native-ble-plx";
import { RootNavigationProp } from "navigation/RootNavigation";
import colors from "constants/colors";

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
        let isCancelled = false;
        let connectedDevice: Device | null = null;

        bleService.addConnectionStateListener((state) => {
            setState(state)
        })

        const connect = async () => {
            try {
                setState('connecting')
                connectedDevice = await bleService.connectToDevice(params.device.id) ?? null;
                if(!connectedDevice){
                    console.warn('error connecting to device...');
                    return;
                }
                if(isCancelled) return;

                await connectedDevice.discoverAllServicesAndCharacteristics();
            }catch(err){
                console.warn('error connecting to device...', err);
                return;
            }
        }
        connect();

        return () => {
            if (connectedDevice) {
                isCancelled = true;
                console.log("Disconnecting from device...");
                bleService.disconnectFromDevice();
            }
        }
    }, [params.device])

    const navigateDeviceConfig = () => navigation.navigate('Device Configuration');
    const navigateWifiConfig = () => navigation.navigate('WiFi Configuration');
    const navigateAPIConfig = () => navigation.navigate('API Configuration');
     
    return (
        <SafeAreaView className="flex-1 bg-background">
            <Text className="font-bold text-base text-center text-foreground pt-4">{ params.device.name }</Text>
            <Text className="font-semibold uppercase text-center pt-2" style={{ color: getStateColor(state) }}>{ dynamicText }</Text>
            { (state === 'connecting' || state === 'reconnecting') && <View className="flex-1 items-center justify-center">
                <ConnectingLoader state={state} />
            </View> }
            { state === 'connected' && <View className="flex-1 py-16 px-6 gap-4">
                <ConfigButton name="Device" onPress={navigateDeviceConfig} >
                    <MonitorCog color={colors.foreground} size={16} />
                </ConfigButton>
                <ConfigButton name="Wi-Fi" onPress={navigateWifiConfig} >
                    <WifiCog color={colors.foreground} size={16} />
                </ConfigButton>
                <ConfigButton name="API" onPress={navigateAPIConfig} >
                    <ServerCog color={colors.foreground} size={16} />
                </ConfigButton>
            </View> }
        </SafeAreaView>
    );
}

function ConfigButton({ name, onPress, children }: {
    name: string,
    onPress: () => any
} & PropsWithChildren){
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.timing(pressAnim, {
            toValue: 0.85, // zatamnjenje
            duration: 100,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.timing(pressAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };

    return <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        <Animated.View style={{ opacity: pressAnim }} className="flex flex-row items-center justify-between p-4 bg-background-alt rounded-lg">
            <View className="flex flex-row items-center gap-3">
                { children }
                <Text className="text-foreground">{ name }</Text>
            </View>
            <ChevronRight color={colors.foreground} size={22} />
        </Animated.View>
    </Pressable>
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
