import { Loader2 } from "lucide-react-native";
import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, Easing, GestureResponderEvent, Pressable, PressableProps, Text } from "react-native";

export default function Button({ title, loading, onPressIn, onPressOut, ...rest }: {
    title: string;
    loading?: boolean;
} & PropsWithChildren<PressableProps>){
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: GestureResponderEvent) => {
        Animated.timing(pressAnim, {
            toValue: 0.85,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
        }).start();
        if(onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
        Animated.timing(pressAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
        }).start();
        if(onPressOut) onPressOut(e);
    };

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

    return <Pressable disabled={loading} onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
        <Animated.View style={{ opacity: pressAnim }} className="flex items-center justify-center w-full py-4 rounded-full bg-primary">
            { !loading ? <Text className="text-black text-center font-semibold">{ title }</Text>
            : <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Loader2 size={16} />
            </Animated.View> }
        </Animated.View>
    </Pressable>
}
