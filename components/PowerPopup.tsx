import useTheme from "hooks/useTheme";
import { LucideIcon, Moon, RotateCw } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Animated, Easing, Text, TouchableWithoutFeedback, View } from "react-native";
import { Portal } from "react-native-portalize";
import { AnimatedPressable } from "./AnimatedPressable";
import * as Haptics from 'expo-haptics';
import { DeviceController } from "controllers/device.controller";
import { RootNavigationProp } from "navigation/RootNavigation";

const deviceController = DeviceController.getInstance();

export type PowerPopupRef = {
    open: () => void;
    close: () => void;
};
const PowerPopup = forwardRef<PowerPopupRef>((_, ref) => {
    const [shown, setShown] = useState<boolean>(false);
    const [visible, setVisible] = useState<boolean>(shown);
    const navigation = useNavigation<RootNavigationProp>();
    const theme = useTheme();

    const opacityAnimation = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
        open: () => setShown(true),
        close: () => setShown(false)
    }));

    const handleRestart = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setShown(false);
        deviceController.restart();
    }, []);
    const handleSleep = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setShown(false);
        deviceController.sleep();
        navigation.navigate('Pairing');
    }, [navigation]);

    useEffect(() => {
        if(shown){
            setVisible(true);
            Animated.timing(opacityAnimation, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            }).start();
        }else {
            Animated.timing(opacityAnimation, {
                toValue: 0,
                duration: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            }).start(() => setVisible(false));
        }
    }, [opacityAnimation, shown]);

    if(!visible) 
        return null;

    return <Portal>
        <TouchableWithoutFeedback onPress={() => setShown(false)}>
            <Animated.View
                className="absolute w-full h-full z-50 top-0 left-0 right-0 bottom-0 flex-1 items-center justify-center"
                style={{ backgroundColor: theme.rgba("#050505", .85), opacity: opacityAnimation }}
            >
                <View className="flex gap-8">
                    <PowerButton name="Sleep" onPress={handleSleep} Icon={Moon} bgColor={"#758467"} color={"#cbd5c0"} />
                    <PowerButton name="Restart" onPress={handleRestart} Icon={RotateCw} bgColor={"#ba8e23"} color={"#ffffc2"} />
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    </Portal>
});

export default PowerPopup;

function PowerButton({ name, Icon, bgColor, color, onPress }: {
    name: string,
    Icon: LucideIcon,
    bgColor: string,
    color: string,
    onPress: () => any
}){
    return <AnimatedPressable onPress={onPress}>
        <View className="flex items-center justify-center p-4 rounded-3xl w-24 h-24 shadow" style={{ backgroundColor: bgColor, shadowColor: bgColor }}>
            <Icon color={color} />
            <Text style={{ color }}>{ name }</Text>
        </View>
    </AnimatedPressable>
}
