import { View, Text, TextInput } from "react-native";

export default function ConfigField({ title, desc, placeholder = "", value, setValue, secureEntry = false }: {
    title: string;
    desc?: string;
    placeholder?: string;
    value: string;
    setValue: (arg0: string) => any;
    secureEntry?: boolean;
}){
    return <View className="w-full gap-2">
        <View className="flex flex-row justify-between items-end">
            <Text className="text-foreground font-semibold px-2">{ title }:</Text>
            { desc && <Text className="text-foreground/25 text-xs pr-1">{ desc }</Text> }
        </View>
        <TextInput 
            className="p-4 rounded-3xl border border-foreground/10 text-foreground/80 placeholder:text-foreground/40" 
            placeholder={placeholder}
            value={value}
            onChangeText={setValue}
            secureTextEntry={secureEntry}
        />
    </View>
}
