import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, Easing, ViewProps } from "react-native";

export default function ViewSkeleton({ children, style, ...rest }: PropsWithChildren<ViewProps>){
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulse = Animated.loop(Animated.sequence([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 700,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]));
        pulse.start();

        return () => pulse.stop();
    }, [opacityAnim]);

    const opacity = opacityAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1]
    })

    return <Animated.View style={[style, { opacity }]} { ...rest }>
        { children }
    </Animated.View>
}
