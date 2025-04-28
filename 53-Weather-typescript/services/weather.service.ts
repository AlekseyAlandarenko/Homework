import { getWeather, getIcon } from './api.service.js';
import { printWeather, printError, printSuccess } from './log.service.js';
import { getKeyValue, saveKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { getTranslatedCity } from './translation.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

type MessageKey = keyof (typeof MESSAGES)[keyof typeof MESSAGES];

interface WeatherError extends Error {
    city?: string;
}

const getCities = async (): Promise<string[]> => {
    const cities = await getKeyValue(TOKEN_DICTIONARY.city);
    return Array.isArray(cities) ? cities : cities ? [cities] : [];
};

const errorHandler = (error: unknown, lang: keyof typeof MESSAGES, messageKey: MessageKey): void => {
    const typedError = error as Partial<WeatherError>;
    const message = MESSAGES[lang][messageKey] || MESSAGES[lang].ERROR_FETCHING_CITIES;
    printError(message.replace('{city}', typedError.city || ''));
    printError(typedError.message || String(error));
};

const saveCity = async (city?: string | null): Promise<void> => {
    city = city?.trim() || null;
    if (!city) {
        return printError(MESSAGES[await getLanguage()].CITY_NOT_PROVIDED);
    }

    const lang = await getLanguage();
    try {
        const translatedCity = (await getTranslatedCity(city)).toUpperCase();
        const cities = await getCities();

        if (cities.includes(translatedCity)) {
            return printError(MESSAGES[lang].CITY_ALREADY_SAVED);
        }

        await saveKeyValue(TOKEN_DICTIONARY.city, [...cities, translatedCity]);
        printSuccess(MESSAGES[lang].CITY_SAVED.replace('{city}', translatedCity));
    } catch (error: unknown) {
        errorHandler(error, lang, 'ERROR_SAVING_CITY');
    }
};

const deleteCity = async (city?: string | null): Promise<void> => {
    city = city?.trim() || null;
    if (!city) {
        return printError(MESSAGES[await getLanguage()].CITY_NOT_PROVIDED);
    }

    const lang = await getLanguage();
    try {
        const translatedCity = (await getTranslatedCity(city)).toUpperCase();
        const cities = await getCities();
        const newCities = cities.filter((c) => c !== translatedCity);

        if (newCities.length === cities.length) {
            return printError(MESSAGES[lang].CITY_NOT_FOUND);
        }

        await saveKeyValue(TOKEN_DICTIONARY.city, newCities);
        printSuccess(MESSAGES[lang].CITY_REMOVED.replace('{city}', translatedCity));
    } catch (error: unknown) {
        errorHandler(error, lang, 'ERROR_DELETING_CITY');
    }
};

const getWeatherForSavedCities = async (): Promise<void> => {
    const lang = await getLanguage();
    try {
        const cities = await getCities();
        if (!cities.length) {
            return printError(MESSAGES[lang].NO_SAVED_CITIES);
        }

        await Promise.allSettled(
            cities.map(async (city): Promise<void> => {
                try {
                    const weather = await getWeather(city);
                    printWeather(weather, getIcon(weather.weather[0].icon));
                } catch (error: unknown) {
                    (error as Partial<WeatherError>).city = city;
                    errorHandler(error, lang, 'ERROR_FETCHING_WEATHER');
                }
            })
        );
    } catch (error: unknown) {
        errorHandler(error, lang, 'ERROR_FETCHING_CITIES');
    }
};

export { saveCity, deleteCity, getWeatherForSavedCities };