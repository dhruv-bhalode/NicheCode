import { useEffect } from 'react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

const PALETTES = [
    {
        name: 'violet',
        300: '196 181 253',
        400: '167 139 250',
        500: '139 92 246',
        600: '124 58 237',
        700: '109 40 217',
        900: '76 29 149'
    },
    {
        name: 'pink',
        300: '249 168 212',
        400: '244 114 182',
        500: '236 72 153',
        600: '219 39 119',
        700: '190 24 93',
        900: '131 24 67'
    },
    {
        name: 'rose',
        300: '253 164 175',
        400: '251 113 133',
        500: '244 63 94',
        600: '225 29 72',
        700: '190 18 60',
        900: '136 19 55'
    },
    {
        name: 'orange',
        300: '253 186 116',
        400: '251 146 60',
        500: '249 115 22',
        600: '234 88 12',
        700: '194 65 12',
        900: '124 45 18'
    },
    {
        name: 'amber',
        300: '252 211 77',
        400: '251 191 36',
        500: '245 158 11',
        600: '217 119 6',
        700: '180 83 9',
        900: '120 53 15'
    },
    {
        name: 'yellow',
        300: '253 224 71',
        400: '250 204 21',
        500: '234 179 8',
        600: '202 138 4',
        700: '161 98 7',
        900: '113 63 18'
    },
    {
        name: 'emerald',
        300: '110 231 183',
        400: '52 211 153',
        500: '16 185 129',
        600: '5 150 105',
        700: '4 120 87',
        900: '6 78 59'
    },
    {
        name: 'fuchsia',
        300: '240 171 252',
        400: '232 121 249',
        500: '217 70 239',
        600: '192 38 211',
        700: '162 28 175',
        900: '112 26 117'
    },
    {
        name: 'blue',
        300: '147 197 253',
        400: '96 165 250',
        500: '59 130 246',
        600: '37 99 235',
        700: '29 78 216',
        900: '30 58 138'
    }
];

const ThemeCycler = () => {
    const { isStaticColor } = useUserPreferences();

    useEffect(() => {
        if (isStaticColor) return;

        let currentIndex = 0;

        const applyPalette = (index: number) => {
            // Add a class to force smooth transitions globally
            document.body.classList.add('theme-transitioning');

            // Small delay to ensure the class is applied before variables change
            setTimeout(() => {
                const palette = PALETTES[index];
                const root = document.documentElement;
                root.style.setProperty('--theme-300', palette[300]);
                root.style.setProperty('--theme-400', palette[400]);
                root.style.setProperty('--theme-500', palette[500]);
                root.style.setProperty('--theme-600', palette[600]);
                root.style.setProperty('--theme-700', palette[700]);
                root.style.setProperty('--theme-900', palette[900]);
            }, 50);

            // Remove the smooth transition class after the crossfade completes (2.5s)
            setTimeout(() => {
                document.body.classList.remove('theme-transitioning');
            }, 2600);
        };

        // Initial apply if we just switched back to dynamic
        applyPalette(currentIndex);

        const intervalId = setInterval(() => {
            currentIndex = (currentIndex + 1) % PALETTES.length;
            applyPalette(currentIndex);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [isStaticColor]);

    return null;
};

export default ThemeCycler;
