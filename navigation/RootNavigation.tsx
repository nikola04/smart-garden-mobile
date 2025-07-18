import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import ScanScreen from 'app/scan/ScanScreen';
import DeviceScreen from 'app/device/DeviceScreen';
import APIConfigScreen from 'app/device/APIConfigScreen';
import DeviceConfigScreen from 'app/device/DeviceConfigScreen';
import { Device } from 'react-native-ble-plx';
import WiFiConfigScreen from 'app/device/WiFiConfigScreen';
import useTheme from 'hooks/useTheme';

export type RootStackParamList = {
    Pairing: undefined,
    Device: { device: Device };
    'WiFi Configuration': undefined,
    'Device Configuration': undefined,
    'API Configuration': undefined,
};

export type RootNavigationProp = StackNavigationProp<RootStackParamList, 'Pairing'>;

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigation() {
    const theme = useTheme();
    return (
        <Stack.Navigator screenOptions={{
            headerStyle: {
                backgroundColor: theme.background, // Background color of the header
                height: 100,
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0, // No border at the bottom of the header
            },
            headerTintColor: theme.foreground, // Color of the back button and title
            headerTitleStyle: {
                textTransform: 'uppercase',
                fontWeight: '500', // Style for the header title text
                letterSpacing: 1, // Letter spacing for the header title
                fontSize: 15, // Font size for the header title
            },
        }}>
            <Stack.Screen name="Pairing" component={ScanScreen} />
            <Stack.Screen
                name="Device"
                component={DeviceScreen}
            />
            <Stack.Screen
                name="Device Configuration"
                component={DeviceConfigScreen}
            />
            <Stack.Screen
                name="WiFi Configuration"
                component={WiFiConfigScreen}
            />
            <Stack.Screen
                name="API Configuration"
                component={APIConfigScreen}
            />
        </Stack.Navigator>
    );
}
