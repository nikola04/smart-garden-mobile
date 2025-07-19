import { PropsWithChildren } from "react";
import { Animated, PressableProps, Text } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import useTheme from "hooks/useTheme";
import Spinner from "./Spinner";

export default function Button({ title, loading, onPressIn, onPressOut, disabled, ...rest }: {
    title: string;
    loading?: boolean;
} & PropsWithChildren<PressableProps>){
    const theme = useTheme();

    return <AnimatedPressable disabled={loading || disabled} {...rest} className="disabled:opacity-50">
        <Animated.View className="flex items-center justify-center w-full py-4 rounded-full" style={{ backgroundColor: theme.primary }}>
            { !loading ? <Text className="text-black text-center font-semibold">{ title }</Text>
            : <Spinner color={"black"} /> }
        </Animated.View>
    </AnimatedPressable>
}
