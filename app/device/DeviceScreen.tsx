import {  PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PressableProps, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useNavigation, type StaticScreenProps } from '@react-navigation/native';
import Loader from "components/Loader";
import { Battery, BluetoothSearching, ChevronRight, Droplets, LucideIcon, MonitorCog, ServerCog, ThermometerSun, Waves, Wifi, WifiCog } from "lucide-react-native";
import { BLEService, ConnectionState, IStrippedDevice } from "services/ble.service";
import { RootNavigationProp } from "navigation/RootNavigation";
import colors from "constants/colors";
import { AnimatedPressable } from "components/AnimatedPressable";
import { useSensorStore } from "hooks/useSensorsStore";
import { SensorsRepository } from "repositories/sensors.repository";
import ViewSkeleton from "components/ViewSkeleton";

const bleService = BLEService.getInstance();
const sensorsRepository = SensorsRepository.getInstance();

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
    const { data } = useSensorStore();
    const [loading, setLoading] = useState<boolean>(true);
    const [state, setState] = useState<ConnectionState>('disconnected');
    const navigation = useNavigation<RootNavigationProp>();
    const params = route.params;

    const sensors = useMemo(() => ({
        wifi: data?.wifi ?? '',
        battery: data?.battery ? data.battery + '%' : '',
        charger: data?.charger ?? '',
        air_temp: data?.air_temp ? data.air_temp + ' °C' : '',
        air_hum: data?.air_hum ? data.air_hum + '%' : '',
        soil: data?.soil ? data.soil + '%' : '',
        light: data?.light === 'true' ? true : false
    }), [data]);

    const dynamicText = useMemo(() => {
        if(state === 'connecting') return 'Connecting...';
        if(state === 'reconnecting') return 'Reconnecting...';
        if(state === 'disconnected') return 'Disconnected';
        if(state === 'connected') return 'Connected';
    }, [state]);


    useEffect(() => {
        if(state !== 'connected')
            return;

        (async () => {
            await sensorsRepository.getData();
            setLoading(false);
        })();

        return () => setLoading(true);
    }, [state]);

    useEffect(() => {
        const stateHandler = (state: ConnectionState) => {
            setState(state)
        }
        bleService.addConnectionStateListener(stateHandler);

        (async () => {
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
        })();

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
            { state === 'connected' && <View className="flex-1 gap-8">
                <ScrollView showsHorizontalScrollIndicator={false} horizontal={true} className="flex-none w-full h-fit gap-6">
                    <View className="flex flex-row px-6 py-3 gap-4">
                    {   !loading ? <> 
                        <StatusBox name="Wi-Fi" status={sensors.wifi} icon={Wifi} />
                        <StatusBox name="Battery" status={sensors.battery} icon={Battery} />
                        <StatusBox name="Temperature" status={sensors.air_temp} icon={ThermometerSun} />
                        <StatusBox name="Humidity" status={sensors.air_hum} icon={Waves} />
                        <StatusBox name="Soil Moisture" status={sensors.soil} icon={Droplets} />
                        </> : new Array(5).fill(null).map((_, i) => <StatusBoxSkeleton key={i} />)
                    }
                    </View> 
                </ScrollView>
                <View className="flex-1 gap-4 px-6">
                    <Text className="text-foreground text-lg font-bold">Settings</Text>
                    {/* <ScrollView> */}
                        <View className="flex gap-4">
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
                    {/* </ScrollView> */}
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
    return <AnimatedPressable {...rest} className="flex w-32">
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

function StatusBoxSkeleton(){
    return <View className="flex w-32">
        <View className="flex p-4 gap-4 bg-background-alt rounded-xl">
            <ViewSkeleton className="w-6 h-6 bg-background rounded-lg"/>
            <View className="flex gap-2.5">
                <ViewSkeleton className="flex w-3/4 h-4 bg-background rounded-full" />
                <ViewSkeleton className="flex w-full h-3 bg-background rounded-full" />
            </View>
        </View>
    </View>
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
