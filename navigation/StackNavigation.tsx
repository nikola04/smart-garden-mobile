import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import DeviceScreen from 'app/device/DeviceScreen';
import ScanScreen from 'app/scan/ScanScreen';
import { IStrippedDevice } from 'services/ble.service';

export type RootStackParamList = {
    Pairing: undefined;
    Device: { device: IStrippedDevice };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function StackNavigation() {
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
            <Stack.Screen name="Device" component={DeviceScreen} />
        </Stack.Navigator>
    );
}

export type NavigationProp = StackNavigationProp<RootStackParamList, 'Pairing'>;
