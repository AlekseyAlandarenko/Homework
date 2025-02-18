import { getWeather, getIcon } from './api.service.js';
import { printWeather, printError, printSuccess } from './log.service.js';
import { getKeyValue, saveKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { getTranslatedCity } from './translation.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const getCities = async () => {
    const cities = await getKeyValue(TOKEN_DICTIONARY.city);
    return Array.isArray(cities) ? cities : cities ? [cities] : [];
};

const errorHandler = (error, lang, messageKey) => {
    const message = MESSAGES[lang][messageKey] || MESSAGES[lang].ERROR_FETCHING_CITIES;
    printError(message.replace('{city}', error.city || ''));
    printError(error.message || String(error));
};

const saveCity = async (city) => {
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
    } catch (error) {
        errorHandler(error, lang, 'ERROR_SAVING_CITY');
    }
};

const deleteCity = async (city) => {
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
    } catch (error) {
        errorHandler(error, lang, 'ERROR_DELETING_CITY');
    }
};

const getWeatherForSavedCities = async () => {
    const lang = await getLanguage();
    try {
        const cities = await getCities();
        if (!cities.length) {
            return printError(MESSAGES[lang].NO_SAVED_CITIES);
        }

        await Promise.allSettled(
            cities.map(async (city) => {
                try {
                    const weather = await getWeather(city);
                    printWeather(weather, getIcon(weather.weather[0].icon));
                } catch (error) {
                    error.city = city;
                    errorHandler(error, lang, 'ERROR_FETCHING_WEATHER');
                }
            })
        );
    } catch (error) {
        errorHandler(error, lang, 'ERROR_FETCHING_CITIES');
    }
};

export { saveCity, deleteCity, getWeatherForSavedCities };