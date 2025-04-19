import axios from 'axios';
import { getKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const WEATHER_ICONS: Record<string, string> = {
    '01': '☀️ ',
    '02': '🌤️ ',
    '03': '☁️ ',
    '04': '🌥️ ',
    '09': '🌧️ ',
    '10': '🌦️ ',
    '11': '⛈️ ',
    '13': '❄️ ',
    '50': '🌫️ ',
};

const getIcon = (icon: string): string => WEATHER_ICONS[icon.slice(0, -1)] || '';

type WeatherDescription = {
    description: string;
    icon: string;
};

type MainWeather = {
    temp: number;
    feels_like: number;
    humidity: number;
};

type Wind = {
    speed: number;
};

type WeatherData = {
    name: string;
    weather: WeatherDescription[];
    main: MainWeather;
    wind: Wind;
};

const getWeather = async (city: string): Promise<WeatherData> => {
    const token = await getKeyValue(TOKEN_DICTIONARY.token);
    const lang = await getLanguage();

    if (!token) {
        throw new Error(MESSAGES[lang].API_KEY_NOT_SET);
    }

    try {
        const { data } = await axios.get<WeatherData>('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: city,
                appid: token,
                lang,
                units: 'metric',
            },
        });
        return data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            throw new Error(`${MESSAGES[lang].WEATHER_FETCH_ERROR}: ${error.response?.data?.message || error.message}`);
        }
        throw new Error(MESSAGES[lang].WEATHER_FETCH_ERROR);
    }
};

export { getWeather, getIcon, WeatherData };