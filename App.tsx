import './global.css';

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigation from 'navigation/RootNavigation';
import { enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';
import useTheme from 'hooks/useTheme';

enableScreens();
export default function App() {
    const theme = useTheme();
    return <>
        <NavigationContainer>
            <StatusBar style="auto" backgroundColor={theme.background} translucent={false} />
            <StackNavigation />
        </NavigationContainer>
        <Toast />
    </>
}
