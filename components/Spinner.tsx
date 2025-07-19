import { Loader2 } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

export default function Spinner({ size = 16, color }: {
    size?: number,
    color?: string
}){
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
        
        return () => {
            spinAnim.stopAnimation();
            spinAnim.setValue(0);
        }
    }, [spinAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });
    
    return <View className="flex items-center justify-center">
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Loader2 size={size} color={color} />
        </Animated.View>
    </View>
}
