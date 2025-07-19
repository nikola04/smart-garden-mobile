export type ThemeHex = {
    background: string,
    backgroundAlt: string,
    foreground: string,
    primary: string,
    warn: string,
    danger: string
}

const dark: ThemeHex = {
    background: '#151513',
    backgroundAlt: '#282C25',
    foreground: '#ffffff',
    primary: '#b7e570',
    warn: '#FACC15',
    danger: '#EF4444'
};

const light: ThemeHex = {
    background: '#fff',
    backgroundAlt: '#eee',
    foreground: '#000',
    primary: '#b7e570',
    warn: '#FACC15',
    danger: '#EF4444'
};

export const themes = {
    light,
    dark
}
