import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, SafeAreaView, Text, View } from "react-native";
import type { StaticScreenProps } from '@react-navigation/native';
import Loader from "components/Loader";
import { BluetoothSearching } from "lucide-react-native";
import { BLEService, IStrippedDevice } from "services/ble.service";
import { Device } from "react-native-ble-plx";

const bleService = BLEService.getInstance();

export default function DeviceScreen({ route }: StaticScreenProps<{
    device: IStrippedDevice
}>) {
    const [state, setState] = useState<'connecting'|'connected'>('connecting');
    const [device, setDevice] = useState<Device|null>(null)
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
                setDevice(connectedDevice);
                setState('connected')
            }catch(err){
                console.warn('error connecting to device...', err);
                return;
            }
        }
        connect();

        return () => {
            if (connectedDevice) {
                console.log("Disconnecting from device...");
                connectedDevice.cancelConnection().catch(err => console.warn("Disconnect failed:", err));
            }
        }
    }, [params.device])
    
    return (
        <SafeAreaView className="flex-1 bg-white">
            <Text className="font-bold text-base text-center pt-4">{ params.device.name }</Text>
            <Text className="font-semibold uppercase text-black/50 text-center pt-2">{ dynamicText }</Text>
            <View className="flex-1 items-center justify-center">
                { state === 'connecting' && <ConnectingLoader state={state} />}
            </View>
        </SafeAreaView>
    );
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
        <Animated.View className="absolute w-full h-full rounded-full bg-black/[7%]" style={{
            transform: [{
                scale: pulseAnimation
            }],
            opacity: pulseOpacity
        }}>
        </Animated.View>
        <BluetoothSearching size={48}/>
    </Loader> 
}
