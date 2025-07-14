import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import ScanScreen from 'app/scan/ScanScreen';
import { IStrippedDevice } from 'services/ble.service';
import DeviceScreen from 'app/device/DeviceScreen';
import WiFiConfigScreen from 'app/device/WiFiConfigScreen';
import APIConfigScreen from 'app/device/APIConfigScreen';

export type RootStackParamList = {
    Pairing: undefined,
    Device: { device: IStrippedDevice };
    'WiFi Configuration': undefined,
    'API Configuration': undefined
};

export type RootNavigationProp = StackNavigationProp<RootStackParamList, 'Pairing'>;

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigation() {
    return (
        <Stack.Navigator screenOptions={{
            headerStyle: {
                backgroundColor: '#fff', // Background color of the header
                height: 100,
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0, // No border at the bottom of the header
            },
            headerTintColor: '#999', // Color of the back button and title
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
