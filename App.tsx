import './global.css';

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigation from 'navigation/RootNavigation';
import { enableScreens } from 'react-native-screens';
import useTheme from 'hooks/useTheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Host } from 'react-native-portalize';


enableScreens();
export default function App() {
    const theme = useTheme();
    return <GestureHandlerRootView>
        <Host>
            <NavigationContainer>
                <StatusBar style="auto" backgroundColor={theme.background} translucent={false} />
                <StackNavigation />
            </NavigationContainer>
        </Host>
    </GestureHandlerRootView>
}
