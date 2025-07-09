import { createStackNavigator } from '@react-navigation/stack';
import DeviceScreen from 'app/device/DeviceScreen';
import ScanScreen from 'app/scan/ScanScreen';

const Stack = createStackNavigator();

export default function StackNavigation() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Scan" component={ScanScreen} />
            <Stack.Screen name="Device" component={DeviceScreen} />
        </Stack.Navigator>
    );
}
