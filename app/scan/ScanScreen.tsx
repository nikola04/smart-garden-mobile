import { Bluetooth } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, FlatList, SafeAreaView, Text, View, Animated, Easing } from "react-native";
import { BLEService, IStrippedDevice } from "services/ble.service";

const bleService = new BLEService();

export default function ScanScreen() {
    const [state, setState] = useState<'default'|'scanning'|'scanned'>('default')
    const [devices, setDevices] = useState<IStrippedDevice[]>([]);

    const pulseAnimation = useRef(new Animated.Value(0)).current;
    const buttonAnimation = useRef(new Animated.Value(1)).current;
    const layoutAnimation = useRef(new Animated.Value(0)).current;

    const dynamicText = useMemo(() => {
        if(state === 'default') return 'Scan for Devices';
        if(state === 'scanning') return 'Scanning...';
        if(state === 'scanned') return 'Select Device';
        return ''
    }, [state]);

    const buttonFlex = layoutAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.4], // 100% → 40%
    });
    const listFlex = layoutAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.6], // 0% → 60%
    });

    const animateButton = useCallback(() => {
         Animated.sequence([
            Animated.timing(buttonAnimation, {
                toValue: 0.85,
                duration: 100,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(buttonAnimation, {
                toValue: 1,
                duration: 150,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, [buttonAnimation]);

    const handleScan = useCallback(() => {
        if(state === 'scanning') return;

        setDevices([]);
        setState('scanning')
        animateButton()
        bleService.startScan((device) => {
            if('isConnectable' in device && device.isConnectable === false) return;

            setDevices((prevDevices) => {
                if(prevDevices.some(dev => dev.id === device.id)) return prevDevices;
                return ([...prevDevices, { ...device, name: device.name || 'Unnamed Device' }]);
            });
        }, 5000, () => {
            setState('scanned');
        });

    }, [animateButton, state]);

    const handleScanReset = () => {
        bleService.stopScan();
        setDevices([]);
        setState('default');
    }

    useEffect(() => {
        if(state === 'scanning'){
            Animated.timing(layoutAnimation, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }).start();
            const loop = Animated.loop(Animated.timing(pulseAnimation, {
                toValue: 1,
                duration: 1300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            }))
            loop.start();

            return () => {
                loop.stop()
                animateButton();
                Animated.timing(pulseAnimation, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }).start();
            }
        }
        if(state === 'default'){
            Animated.timing(layoutAnimation, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }).start();
        }
    }, [animateButton, layoutAnimation, pulseAnimation, state])
    return (
        <SafeAreaView className="flex-1 bg-white">
            <Text className="font-bold uppercase text-center pt-4">{ dynamicText }</Text>
            <Animated.View className="items-center justify-center" style={{
                flex: buttonFlex
            }}>
                <Animated.View className="absolute w-56 h-56 bg-black/10 rounded-full" style={{
                    transform: [{
                        scale: pulseAnimation
                    }],
                    opacity: pulseAnimation.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [1, 1, 0]
                    })
                }} />
                <Pressable onPress={handleScan} onLongPress={handleScanReset}>
                    <Animated.View className="bg-black rounded-full w-28 h-28 items-center justify-center" style={{
                        transform: [{
                            scale: buttonAnimation
                        }]
                    }}>
                        <Bluetooth size={36} color={"white"}/>
                    </Animated.View>
                </Pressable>
            </Animated.View>
            { state === 'scanned' && devices.length === 0 && <View className="gap-2">
                <Text className="uppercase font-bold text-center text-[13px]">No nearby devices found.</Text>
                <Text className="text-center">Are you holding button on your device?</Text>
            </View> }
            <Animated.View style={{ flex: listFlex }}>
                <FlatList
                    className="flex-grow w-full"
                    data={devices}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDevice}
                />
            </Animated.View>
        </SafeAreaView>
    );
}

function renderDevice({ item }: { item: IStrippedDevice }) {
    return (
        <View className="p-2 border-b border-gray-200">
            <Text className="text-black font-semibold">{item.name}</Text>
            <Text className="text-gray-500 text-xs">{item.id}</Text>
        </View>
    );
}
