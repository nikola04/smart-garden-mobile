import { Bluetooth, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, FlatList, SafeAreaView, Text, View, Animated, Easing, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native'
import { BleErrorCode } from "react-native-ble-plx";
import { BLEService, IStrippedDevice } from "services/ble.service";
import { NavigationProp } from "navigation/StackNavigation";

const bleService = new BLEService();

export default function ScanScreen() {
    const [state, setState] = useState<'default'|'scanning'|'scanned'|'connecting'>('default')
    const [devices, setDevices] = useState<IStrippedDevice[]>([]);
    const navigation = useNavigation<NavigationProp>();

    const pulseAnimation = useRef(new Animated.Value(0)).current;
    const buttonAnimation = useRef(new Animated.Value(1)).current;
    const layoutAnimation = useRef(new Animated.Value(0)).current;

    const dynamicText = useMemo(() => {
        if(state === 'default') return 'Scan for Devices';
        if(state === 'scanning') return 'Scanning...';
        if(state === 'scanned') return 'Select Device';
        if(state === 'connecting') return 'Connecting...';
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

    const handleScan = useCallback(async () => {
        if(state === 'scanning') return;
        const isEnabled = await bleService.isBluetoothEnabled();
        if(!isEnabled){
            Alert.alert('Bluetooth is Off', 'Please enable Bluetooth in your settings.',[{
                text: "OK"
            }]);
            return;
        }

        setDevices([]);
        setState('scanning')
        animateButton()
        bleService.startScan([], 5000, (err, device) => {
            if(err) {
                if(err.errorCode === BleErrorCode.BluetoothPoweredOff){
                    Alert.alert('Bluetooth is Off', 'Please enable Bluetooth in your settings.',[{
                        text: "OK"
                    }]);
                    bleService.stopScan();
                    setState('scanned');
                }else{
                    Alert.alert('Bluetooth error', 'Please try again later.',[{
                        text: "OK"
                    }]);
                }
                return;
            }

            if(!device || !device.name) return;
            if('isConnectable' in device && device.isConnectable === false) return;

            setDevices((prevDevices) => {
                if(prevDevices.some(dev => dev.id === device.id)) return prevDevices;
                return ([...prevDevices, { ...device, name: device.name }]);
            });
        }, () => setState('scanned'));

    }, [animateButton, state]);

    const handleScanReset = () => {
        bleService.stopScan();
        setDevices([]);
        setState('default');
    }

    const handleConnect = useCallback(async (deviceId: string) => {
        if(state !== 'scanned' && state !== 'scanning') return;
        setState('connecting');
        bleService.stopScan();
        // console.log("Connecting to device: " + deviceId)
        const device = await bleService.getManager()?.connectToDevice(deviceId);
        if(!device){
            console.warn("Device not connected")
            setState('default')
            return;
        }
        navigation.navigate({ name: 'Device', params: device });
        setState('scanned');
    }, [state, navigation]);

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
                    renderItem={({ item }) => renderDevice(item, handleConnect, state === 'connecting')}
                />
            </Animated.View>
        </SafeAreaView>
    );
}

function renderDevice(item: IStrippedDevice, handleConnect: (device: string) => any, disabled: boolean) {
    return (
        <Pressable onPress={() => handleConnect(item.id)}>
            <View className={`flex flex-row items-center justify-between mx-6 my-1 px-4 py-5 bg-gray-100 rounded-xl ${disabled && 'opacity-45'}`}>
                <Text className="text-black text-lg font-semibold">{item.name}</Text>
                <ChevronRight/>
            </View>
        </Pressable>
    );
}
