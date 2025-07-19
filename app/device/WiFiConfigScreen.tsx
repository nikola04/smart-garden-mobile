import Button from "components/Button";
import { RootStackParamList } from "navigation/RootNavigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import ConfigField from "components/ConfigField";
import { DeviceRepository } from "repositories/device.repository";
import { WifiCog } from "lucide-react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { AnimatedPressable } from "components/AnimatedPressable";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import useTheme from "hooks/useTheme";
import { Portal } from "react-native-portalize";
import { WiFiRepository } from "repositories/wifi.repository";
import { BLEService, ConnectionState } from "services/ble.service";
import { useWiFiScanStore } from "hooks/useWiFiScanStore";
import { WiFiNetwork } from "types/wifi";
import Spinner from "components/Spinner";

const deviceRepository = DeviceRepository.getInstance();
const wifiRepository = WiFiRepository.getInstance();

const bleService = BLEService.getInstance();

type WiFiConfigScreenProps = StackScreenProps<RootStackParamList, 'WiFi Configuration'>;
export default function WiFiConfigScreen({ navigation }: WiFiConfigScreenProps){
    const [ssid, setSSID] = useState<string>();
    const [pswd, setPswd] = useState<string>("");
    const [state, setState] = useState<ConnectionState>('connected');
    const [loading, setLoading] = useState<boolean>(true);
    const { data: scanned, status: scanStatus } = useWiFiScanStore();
    const theme = useTheme();
    
    const mounted = useRef(false);
    const pswdRef = useRef<TextInput>(null);
    const sheetRef = useRef<BottomSheet>(null);

    const snapPoints = useMemo(() => ["40%", "70%"], []);

    const selectNetwork = (network: WiFiNetwork) => {
        setSSID(network.ssid)
        setPswd("");
        sheetRef.current?.close();
        pswdRef.current?.focus();
    }

    const handleScanNetworks = () => {
        Keyboard.dismiss();
        sheetRef.current?.snapToIndex(0);
        wifiRepository.startScan();
    }
    
    const handleSave = useCallback(async () => {
        if(loading) return;
        setLoading(true);

        await deviceRepository.updateData({
            wifi_ssid: ssid,
            wifi_password: pswd
        });

        if(!mounted.current) return;

        setLoading(false);
        Alert.alert('Wi-Fi Settings updated successfully.')
        sheetRef.current?.close();
        navigation.goBack();
    }, [loading, navigation, pswd, ssid]);

    useEffect(() => {
        mounted.current = true;
        setLoading(true);

        const stateHandler = (state: ConnectionState) => setState(state);
        bleService.addConnectionStateListener(stateHandler);

        (async () => {
            const data = await deviceRepository.getData();
            setLoading(false);

            if(!mounted.current || !data?.device_name)
                return;

            setSSID(data.wifi_ssid ?? '');
            setPswd(data.wifi_password ?? '');
        })();
        
        return () => {
            mounted.current = false
            // sheetRef.current?.close();
            bleService.removeConnectionStateListener(stateHandler);
        };
    }, [])

    useEffect(() => {
        if(state !== 'connected'){
            sheetRef.current?.close();
            navigation.goBack();
            return;
        }

        const subscription = wifiRepository.startLiveListening();

        return () => {
            subscription?.remove();
        }
    }, [navigation, state]);
    
    return <KeyboardAvoidingView 
        className="flex-1"
        style={{ backgroundColor: theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
        <View className="flex-1 justify-between items-center pt-6">
            <View className="flex-1 w-full gap-12 px-8">
                <View>
                    <View className="flex flex-row items-center gap-2">
                        <WifiCog color={theme.foreground} size={16} />
                        <Text className="font-bold text-lg" style={{ color: theme.foreground }}>Configure Wi-Fi</Text>
                    </View>
                    <Text className="text-sm" style={{ color: theme.rgba(theme.foreground, .4) }}>Set wifi ssid and password.</Text>
                </View>
                <View className="gap-8">
                    <ConfigField
                        title="SSID"
                        placeholder="Name..."
                        value={ssid}
                        onChangeText={setSSID}
                    />
                    <ConfigField
                        title="Password"
                        desc="Old password won&apos;t be shown here!"
                        placeholder="Password..."
                        value={pswd}
                        onChangeText={setPswd}
                        secureTextEntry={true}
                        ref={pswdRef}
                    />
                </View>
                <AnimatedPressable onPress={handleScanNetworks}>
                    <View className="flex items-center justify-center p-4 rounded-3xl" style={{ backgroundColor: theme.backgroundAlt }}>
                        <Text className="text-center" style={{ color: theme.rgba(theme.foreground, .8) }}>Scan Networks</Text>
                    </View>
                </AnimatedPressable>
            </View>
            <View className="flex w-full pt-4 px-8 pb-14 rounded-t-3xl" style={{ backgroundColor: theme.background }}>
                <Button title="Save" loading={loading} onPress={handleSave}/>
            </View>
            <Portal>
                <BottomSheet 
                    ref={sheetRef}
                    snapPoints={snapPoints}
                    index={-1}
                    enableDynamicSizing={false}
                    enablePanDownToClose={true}
                    backgroundStyle={{ 
                        backgroundColor: theme.background,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20
                    }}
                    handleIndicatorStyle={{
                        backgroundColor: theme.foreground
                    }}
                    backdropComponent={(props) => <BottomSheetBackdrop
                        {...props}
                        appearsOnIndex={0}
                        disappearsOnIndex={-1}
                        opacity={0.5}
                        pressBehavior="close"
                    />}
                >
                    <View className="flex py-4 gap-1">
                        <Text className="text-center uppercase font-bold" style={{ color: theme.foreground }}>Network Scan</Text>
                        { scanStatus === 'scanned' && <Text className="text-center text-sm" style={{ color: theme.rgba(theme.foreground, .5) }}>Press to select</Text> }
                    </View>
                    { (scanStatus === 'scanned' || scanStatus === 'scanning') && <BottomSheetScrollView contentContainerClassName="flex-1 items-center gap-2 p-4">
                        { scanned.map((network) => <ScannedNetwork key={network.ssid} network={network} onSelect={() => selectNetwork(network)} />)}
                        { scanStatus === 'scanning' && <View className="flex flex-row gap-2 py-2">
                            <Spinner color={theme.foreground} />
                            <Text className="flex items-center justify-center" style={{ color: theme.foreground }}>Scanning...</Text>
                        </View>}
                    </BottomSheetScrollView> }
                    { scanStatus === 'failed' && <View className="flex items-center py-4 gap-2">
                        <Text className="font-bold uppercase" style={{ color: theme.danger }}>Failed</Text>
                        <Text className="text-center text-sm" style={{ color: theme.rgba(theme.foreground, .5) }}>Try restarting your device.</Text>
                    </View>}
                </BottomSheet>
            </Portal>
        </View>
    </KeyboardAvoidingView>
}

function ScannedNetwork({ network, onSelect }: {
    network: WiFiNetwork,
    onSelect: (network: WiFiNetwork) => void;
}){
    const theme = useTheme();

    const handlePress = () => onSelect(network);

    return <AnimatedPressable key={network.ssid} onPress={handlePress}>
        <View className="flex flex-row w-full items-center justify-between p-4 rounded-3xl" style={{ backgroundColor: theme.backgroundAlt }}>
            <Text style={{ color: theme.foreground }}>{ network.ssid }</Text>
            <Text className="text-sm" style={{ color: theme.rgba(theme.foreground, .7) }}>{ network.rssi } dBm</Text>
        </View>
    </AnimatedPressable>
}
