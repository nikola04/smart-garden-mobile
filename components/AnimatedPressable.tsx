import { PropsWithChildren, useRef } from "react";
import { Animated, GestureResponderEvent, Pressable, PressableProps } from "react-native";

export function AnimatedPressable({ children, onPressIn, onPressOut, ...rest }: PropsWithChildren<PressableProps>){
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: GestureResponderEvent) => {
        Animated.timing(pressAnim, {
            toValue: 0.82,
            duration: 100,
            useNativeDriver: true,
        }).start();
        if(onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
        Animated.timing(pressAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
        }).start();
        if(onPressOut) onPressOut(e);
    };
    
    return <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
        <Animated.View style={{ opacity: pressAnim }}>
            { children }
        </Animated.View>
    </Pressable>
}
