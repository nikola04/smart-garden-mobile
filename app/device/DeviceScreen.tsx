import {  PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PressableProps, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useNavigation, type StaticScreenProps } from '@react-navigation/native';
import Loader from "components/Loader";
import { Battery, BluetoothConnected, BluetoothSearching, ChevronRight, Droplets, LucideIcon, MonitorCog, Power, ServerCog, ThermometerSun, Waves, Wifi, WifiCog } from "lucide-react-native";
import { BLEService, ConnectionState } from "services/ble.service";
import { RootNavigationProp } from "navigation/RootNavigation";
import { AnimatedPressable } from "components/AnimatedPressable";
import { useSensorStore } from "hooks/useSensorsStore";
import { SensorsRepository } from "repositories/sensors.repository";
import ViewSkeleton from "components/ViewSkeleton";
import * as Haptics from 'expo-haptics';
import { Device } from "react-native-ble-plx";
import useTheme from "hooks/useTheme";

const bleService = BLEService.getInstance();
const sensorsRepository = SensorsRepository.getInstance();

export default function DeviceScreen({ route }: StaticScreenProps<{
    device: Device
}>) {
    const { data } = useSensorStore();
    const [device, setDevice] = useState<Device|null>(null);
    const [rssi, setRSSI] = useState<number|null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [state, setState] = useState<ConnectionState>('disconnected');
    const navigation = useNavigation<RootNavigationProp>();
    const theme = useTheme();
    const params = route.params;

    const sensors = useMemo(() => ({
        wifi: data?.wifi ?? '',
        battery: data?.battery ? Number.parseInt(data.battery) + '%' : '',
        charger: data?.charger ?? '',
        air_temp: data?.air_temp ? Number(data.air_temp).toFixed(1) + ' °C' : '',
        air_hum: data?.air_hum ? Number.parseInt(data.air_hum) + '%' : '',
        soil: data?.soil ? Number(data.soil).toFixed(1) + '%' : '',
        light: data?.light === 'true' ? true : false
    }), [data]);

    const dynamicText = useMemo(() => {
        if(state === 'connecting') return 'Connecting...';
        if(state === 'reconnecting') return 'Reconnecting...';
        if(state === 'disconnected') return 'Disconnected';
        if(state === 'connected') return 'Connected';
    }, [state]);

    const getStateColor = (state: ConnectionState) => {
        switch (state) {
            case 'connecting':
            case 'reconnecting':
                return theme.warn;
            case 'disconnected':
                return theme.danger;
            default:
                return theme.primary;
        }
    }

    const handlePowerLongPress = () => {
        Haptics.selectionAsync();
    }

    useEffect(() => {
        if(state !== 'connected')
            return;

        sensorsRepository.getData().then(() => setLoading(false));
        const subscription = sensorsRepository.startLiveListening();

        return () => {
            subscription?.remove();
            setLoading(true);
        }
    }, [state]);

    useEffect(() => {
        let mounted = true;
        if(!device)
            return;

        const interval = setInterval(() => device.readRSSI().then(updated => {
            if(mounted)
            setRSSI(updated.rssi);
        }), 2500);

        return () => { 
            mounted = false;
            clearInterval(interval);
        };
    }, [device]);

    useEffect(() => {
        let mounted = true;
        const stateHandler = (state: ConnectionState) => setState(state);
        bleService.addConnectionStateListener(stateHandler);
        bleService.connectToDevice(params.device.id).then(device => {
            if(!mounted) return;
            setDevice(device);
        })

        return () => {
            mounted = false;
            bleService.removeConnectionStateListener(stateHandler);
            bleService.disconnectFromDevice();
        }
    }, [params.device])

    const navigateDeviceConfig = () => navigation.navigate('Device Configuration');
    const navigateWifiConfig = () => navigation.navigate('WiFi Configuration');
    const navigateAPIConfig = () => navigation.navigate('API Configuration');
     
    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
            <View className="relative flex gap-2 py-8">
                <Text className="font-bold text-base text-center" style={{ color: theme.foreground }}>{ params.device.name }</Text>
                <Text className="font-semibold uppercase text-center" style={{ color: getStateColor(state) }}>{ dynamicText }</Text>
                { state === 'connected' && <AnimatedPressable className="absolute right-6 top-9" onLongPress={handlePowerLongPress}>
                    <View className="p-3 rounded-full" style={{ backgroundColor: theme.backgroundAlt }}>
                        <Power color={theme.foreground} size={18} style={{ marginTop: -1 }} />
                    </View>
                </AnimatedPressable> }
            </View>
            { (state === 'connecting' || state === 'reconnecting') && <View className="flex-1 items-center justify-center">
                <ConnectingLoader state={state} />
            </View> }
            { state === 'connected' && <View className="flex-1 gap-8">
                <ScrollView showsHorizontalScrollIndicator={false} horizontal={true} className="flex-none w-full h-fit gap-6">
                    <View className="flex flex-row px-6 pt-3 gap-4">
                    {   !loading ? <> 
                        <StatusBox name="Wi-Fi" capitalize={true} status={sensors.wifi} icon={Wifi} />
                        <StatusBox name="Bluetooth" status={`${rssi ?? '-'} dBm`} icon={BluetoothConnected} />
                        <StatusBox name="Battery" status={sensors.battery} icon={Battery} />
                        <StatusBox name="Temperature" status={sensors.air_temp} icon={ThermometerSun} />
                        <StatusBox name="Humidity" status={sensors.air_hum} icon={Waves} />
                        <StatusBox name="Soil Moisture" status={sensors.soil} icon={Droplets} />
                        </> : new Array(5).fill(null).map((_, i) => <StatusBoxSkeleton key={i} />)
                    }
                    </View> 
                </ScrollView>
                <View className="flex-1 gap-4 px-6">
                    <Text className="text-lg font-bold" style={{ color: theme.foreground }}>Settings</Text>
                    {/* <ScrollView> */}
                        <View className="flex gap-4">
                            <ConfigButton name="Device" onPress={navigateDeviceConfig} >
                                <MonitorCog color={theme.foreground} size={16} />
                            </ConfigButton>
                            <ConfigButton name="Wi-Fi Settings" onPress={navigateWifiConfig} >
                                <WifiCog color={theme.foreground} size={16} />
                            </ConfigButton>
                            <ConfigButton name="API Configuration" onPress={navigateAPIConfig} >
                                <ServerCog color={theme.foreground} size={16} />
                            </ConfigButton>
                        </View>
                    {/* </ScrollView> */}
                </View>
            </View> }
        </SafeAreaView>
    );
}

function StatusBox({ name, status, icon, capitalize = false, children, ...rest }: {
    name: string;
    status: string;
    icon: LucideIcon;
    capitalize?: boolean;
} & PropsWithChildren<PressableProps>){
    const theme = useTheme();
    const opacity = useRef(new Animated.Value(0.7)).current;
    const Icon = icon;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 250,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.delay(300),
            Animated.timing(opacity, {
                toValue: 0.7,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, [opacity, status]);

    return <AnimatedPressable {...rest} className="flex w-32">
        <View className="flex p-4 gap-4 rounded-3xl" style={{ backgroundColor: theme.backgroundAlt }}>
            <Icon size={16} color={theme.foreground} />
            <View className="flex gap-1">
                <Text className="capitalize" style={{ color: theme.foreground }}>{ name }</Text>
                <Animated.Text style={{ opacity, color: theme.foreground }} className={`text-sm ${capitalize ? 'capitalize' : ''}`}>{ status }</Animated.Text>
            </View>
            { children }
        </View>
    </AnimatedPressable>
}

function StatusBoxSkeleton(){
    const theme = useTheme();
    return <View className="flex w-32">
        <View className="flex p-4 gap-4 rounded-3xl" style={{ backgroundColor: theme.backgroundAlt }}>
            <ViewSkeleton className="w-6 h-6 rounded-lg" style={{ backgroundColor: theme.background }}/>
            <View className="flex gap-2.5">
                <ViewSkeleton className="flex w-3/4 h-4 rounded-full" style={{ backgroundColor: theme.background }} />
                <ViewSkeleton className="flex w-full h-3 rounded-full" style={{ backgroundColor: theme.background }} />
            </View>
        </View>
    </View>
}

function ConfigButton({ name, onPress, children }: {
    name: string,
    onPress: () => any
} & PropsWithChildren){
    const theme = useTheme();
    return <AnimatedPressable onPress={onPress}>
        <View className="flex flex-row items-center justify-between p-4 rounded-3xl"  style={{ backgroundColor: theme.backgroundAlt }}>
            <View className="flex flex-row items-center gap-3">
                { children }
                <Text style={{ color: theme.foreground }}>{ name }</Text>
            </View>
            <ChevronRight color={theme.foreground} size={22} />
        </View>
    </AnimatedPressable>
}

function ConnectingLoader({ state }: {
    state: string
}){
    const pulseAnimation = useRef(new Animated.Value(0)).current;
    const theme = useTheme();
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
        <Animated.View className="absolute w-full h-full rounded-full" style={{
            backgroundColor: theme.rgba(theme.primary, .25),
            transform: [{
                scale: pulseAnimation
            }],
            opacity: pulseOpacity
        }}>
        </Animated.View>
        <BluetoothSearching color={theme.primary} size={48}/>
    </Loader> 
}
