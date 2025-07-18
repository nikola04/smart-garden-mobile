import useTheme from "hooks/useTheme";
import { PropsWithChildren } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";

export default function ConfigField({ title, desc, placeholder = "", ...rest }: {
    title: string;
    desc?: string;
} & PropsWithChildren<TextInputProps>){
    const theme = useTheme();

    return <View className="w-full gap-2">
        <View className="flex flex-row justify-between items-end">
            <Text className="font-semibold px-2" style={{ color: theme.foreground }}>{ title }:</Text>
            { desc && <Text className="text-xs pr-1" style={{ color: theme.rgba(theme.foreground, .25) }}>{ desc }</Text> }
        </View>
        <TextInput 
            className="p-4 rounded-3xl border placeholder:text-foreground/40" 
            style={{ borderColor: theme.rgba(theme.foreground, .1), color: theme.rgba(theme.foreground, .8) }}
            placeholder={placeholder}
            { ...rest }
        />
    </View>
}
