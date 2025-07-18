import './global.css';

import { StatusBar } from 'expo-status-bar';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import StackNavigation from 'navigation/RootNavigation';
import { enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';
import colors from 'constants/colors';
import { useEffect } from 'react';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,     // pozadina celog appa
    card: colors.backgroundAlt,        // top bar / header background
    text: colors.foreground,           // text u headeru i ostalo
    border: 'transparent',             // borderi oko stack screenova
    primary: colors.primary,           // linkovi, naglašeni dugmići itd.
    notification: colors.primary,      // boja za badge notifikacije
  },
};

enableScreens();
export default function App() {
    useEffect(() => {
        setBackgroundColorAsync(colors.background);
    }, []);
    return <>
        <NavigationContainer theme={theme}>
            <StatusBar style="light" backgroundColor={colors.background} translucent={false} />
            <StackNavigation />
        </NavigationContainer>
        <Toast />
    </>
}
