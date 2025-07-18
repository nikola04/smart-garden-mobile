export type ThemeHex = {
    background: string,
    backgroundAlt: string,
    foreground: string,
    primary: string,
}

const dark: ThemeHex = {
    background: '#151513',
    backgroundAlt: '#282C25',
    foreground: '#ffffff',
    primary: '#b7e570',
};

const light: ThemeHex = {
    background: '#fff',
    backgroundAlt: '#eee',
    foreground: '#000',
    primary: '#b7e570',
};

export const themes = {
    light,
    dark
}
