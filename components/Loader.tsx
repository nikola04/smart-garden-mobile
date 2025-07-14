import colors from "constants/colors";
import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, View, ViewProps } from "react-native";
import Svg, { Circle } from "react-native-svg";


const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Loader({ children, ...rest }: PropsWithChildren<ViewProps>){
    const screenWidth = Dimensions.get('window').width;
    const size = screenWidth * 0.6;
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const rotation = useRef(new Animated.Value(0)).current;
    const progress = useRef(new Animated.Value(0)).current;

    const dashOffset = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference * 0.3, circumference * 0.5],
    });
    const rotateInterpolate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(rotation, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ])).start();

        Animated.loop(Animated.sequence([
            Animated.timing(progress, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(progress, {
                toValue: 0,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ])).start();
    }, [circumference, dashOffset, progress, rotation]);
    return <View className="rounded-full overflow-hidden" style={{ width: '60%', aspectRatio: '1/1', justifyContent: 'center', alignItems: 'center' }}>
        <View {...rest}>
            { children }
        </View>
        <Animated.View className="absolute" style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Svg width={size} height={size}>
                <AnimatedCircle
                    stroke={colors.primary}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                />
            </Svg>
        </Animated.View>
    </View>
}
