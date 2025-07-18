import { Loader2 } from "lucide-react-native";
import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, Easing, PressableProps, Text } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import useTheme from "hooks/useTheme";

export default function Button({ title, loading, onPressIn, onPressOut, disabled, ...rest }: {
    title: string;
    loading?: boolean;
} & PropsWithChildren<PressableProps>){
    const theme = useTheme();

    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinAnim.stopAnimation();
            spinAnim.setValue(0);
        }
    }, [loading, spinAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return <AnimatedPressable disabled={loading || disabled} {...rest} className="disabled:opacity-50">
        <Animated.View className="flex items-center justify-center w-full py-4 rounded-full" style={{ backgroundColor: theme.primary }}>
            { !loading ? <Text className="text-black text-center font-semibold">{ title }</Text>
            : <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Loader2 size={16} />
            </Animated.View> }
        </Animated.View>
    </AnimatedPressable>
}
