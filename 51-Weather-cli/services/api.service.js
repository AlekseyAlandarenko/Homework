import axios from 'axios';
import { getKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const WEATHER_ICONS = {
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

const getIcon = (icon) => WEATHER_ICONS[icon.slice(0, -1)] || '';

const getWeather = async (city) => {
    const token = await getKeyValue(TOKEN_DICTIONARY.token);
    const lang = await getLanguage();

    if (!token) {
        throw new Error(MESSAGES[lang].API_KEY_NOT_SET);
    }

    try {
        const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: city,
                appid: token,
                lang,
                units: 'metric',
            },
        });
        return data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`${MESSAGES[lang].WEATHER_FETCH_ERROR}: ${error.response?.data?.message || error.message}`);
        }
        throw new Error(MESSAGES[lang].WEATHER_FETCH_ERROR);
    }
};

export { getWeather, getIcon };