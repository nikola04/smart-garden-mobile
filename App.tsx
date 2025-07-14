import './global.css';

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigation from 'navigation/RootNavigation';
import { enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';

enableScreens();
export default function App() {
    return <>
        <NavigationContainer>
            <StatusBar style="light" />
            <StackNavigation />
        </NavigationContainer>
        <Toast />
    </>
}
