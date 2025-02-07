import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const printHelp = async () => {
    const lang = await getLanguage();
    return [
        `GET /weather - ${MESSAGES[lang].HELP_GET_WEATHER}`,
        `POST /set-city - ${MESSAGES[lang].HELP_ADD_CITY}`,
        `DELETE /delete-city - ${MESSAGES[lang].HELP_REMOVE_CITY}`,
        `POST /set-token - ${MESSAGES[lang].HELP_SAVE_API_KEY}`,
        `POST /set-language - ${MESSAGES[lang].HELP_SET_LANGUAGE}`,
        `GET /help - ${MESSAGES[lang].HELP_SHOW_HELP}`
    ];
};

const printWeather = async (res, icon) => {
    const lang = await getLanguage();
    return [
        `${MESSAGES[lang].WEATHER_TITLE} ${res.name}`,
        `${icon} ${res.weather[0].description}`,
        `${MESSAGES[lang].TEMPERATURE}: ${res.main.temp} (${MESSAGES[lang].FEELS_LIKE} ${res.main.feels_like})`,
        `${MESSAGES[lang].HUMIDITY}: ${res.main.humidity}%`,
        `${MESSAGES[lang].WIND_SPEED}: ${res.wind.speed}`
    ];
};

export { printHelp, printWeather };