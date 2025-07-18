import { themes, ThemeHex } from "constants/themes"
import { useColorScheme } from "react-native";

const hexToRGBA = (color: string, alpha: number = 1): string => {
    const bigint = parseInt(color.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ITheme extends ThemeHex{
    rgba: (color: string, alpha?: number) => string
}

export default function useTheme(): ITheme {
    const colorScheme = useColorScheme();
    const { light, dark } = themes;

    if(colorScheme === 'dark')
        return ({
            ...dark,
            rgba: hexToRGBA
        });
    
    return ({
        ...light,
        rgba: hexToRGBA
    });
}
