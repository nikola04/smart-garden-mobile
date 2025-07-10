import './global.css';

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigation from 'navigation/StackNavigation';
import { enableScreens } from 'react-native-screens';

enableScreens();
export default function App() {
    return (
        <NavigationContainer>
            <StatusBar style="auto" />
            <StackNavigation />
        </NavigationContainer>
    );
}
