import {  useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, SafeAreaView, Text, View } from "react-native";
import { useNavigation, type StaticScreenProps } from '@react-navigation/native';
import Loader from "components/Loader";
import { BluetoothSearching, ChevronRight } from "lucide-react-native";
import { BLEService, IStrippedDevice } from "services/ble.service";
import { Device } from "react-native-ble-plx";
import { RootNavigationProp } from "navigation/RootNavigation";
import colors from "constants/colors";

const bleService = BLEService.getInstance();

export default function DeviceScreen({ route }: StaticScreenProps<{
    device: IStrippedDevice
}>) {
    const [state, setState] = useState<'connecting'|'connected'>('connecting');
    const navigation = useNavigation<RootNavigationProp>();
    const params = route.params;

    const dynamicText = useMemo(() => {
        if(state === 'connecting') return 'Connecting...';
        if(state === 'connected') return 'Connected';
        return ''
    }, [state]);

    useEffect(() => {
        let isCancelled = false;
        let connectedDevice: Device | null = null;

        const connect = async () => {
            try {
                connectedDevice = await bleService.connectToDevice(params.device.id) ?? null;
                if(!connectedDevice){
                    console.warn('error connecting to device...');
                    return;
                }
                if(isCancelled) return;

                await connectedDevice.discoverAllServicesAndCharacteristics();
                if(isCancelled) return;
                // setDeviceConfig(configResponse)
                setState('connected')
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

    const navigateWifiConfig = () => navigation.navigate('WiFi Configuration');
    const navigateAPIConfig = () => navigation.navigate('API Configuration');
     
    return (
        <SafeAreaView className="flex-1 bg-background">
            <Text className="font-bold text-base text-center text-foreground pt-4">{ params.device.name }</Text>
            <Text className={`font-semibold uppercase text-center pt-2 ${state === 'connecting' ? 'text-yellow-500' : 'text-primary'}`}>{ dynamicText }</Text>
            { state === 'connecting' && <View className="flex-1 items-center justify-center">
                <ConnectingLoader state={state} />
            </View> }
            { state === 'connected' && <View className="flex-1 py-16 px-6 gap-4">
                <ConfigButton name="WiFi Configuration" onPress={navigateWifiConfig} />
                <ConfigButton name="API Configuration" onPress={navigateAPIConfig} />
            </View> }
        </SafeAreaView>
    );
}

function ConfigButton({ name, onPress }: {
    name: string,
    onPress: () => any
}){
    return <Pressable onPress={onPress}>
        <View className="flex flex-row items-center justify-between p-4 bg-background-alt rounded-lg">
            <Text className="text-foreground">{ name }</Text>
            <ChevronRight color={colors.foreground} />
        </View>
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
        if(state !== 'connecting') 
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
