import { Loader2 } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

export default function Button({ title, loading, onPress }: {
    title: string;
    loading?: boolean;
    onPress?: () => any;
}){
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

    return <Pressable disabled={loading} onPress={onPress}>
        <View className="flex items-center justify-center w-full py-4 rounded-full bg-primary">
            { !loading ? <Text className="text-black text-center font-semibold">{ title }</Text>
            : <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Loader2 size={16} />
            </Animated.View> }
        </View>
    </Pressable>
}
