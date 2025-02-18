import { getWeather, getIcon } from './api.service.js';
import { getKeyValue, saveKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { getTranslatedCity } from './translation.service.js';
import { getLanguage } from './language.service.js';
import { printWeather } from './log.service.js';
import { MESSAGES } from './messages.service.js';

const getCities = async () => {
    const cities = await getKeyValue(TOKEN_DICTIONARY.city) || [];
    return Array.isArray(cities) ? cities : [cities];
};

const saveCity = async (city) => {
    const currentLang = await getLanguage();

    if (!city.length) {
        throw new Error(MESSAGES[currentLang].CITY_REQUIRED);
    }

    const translatedCity = (await getTranslatedCity(city)).toUpperCase();
    const cities = await getCities();

    if (cities.includes(translatedCity)) {
        throw new Error(MESSAGES[currentLang].CITY_ALREADY_SAVED);
    }

    await saveKeyValue(TOKEN_DICTIONARY.city, [...cities, translatedCity]);
};

const deleteCity = async (city) => {
    const currentLang = await getLanguage();

    if (!city.length) {
        throw new Error(MESSAGES[currentLang].CITY_REQUIRED);
    }

    const translatedCity = (await getTranslatedCity(city)).toUpperCase();
    const cities = await getCities();
    const newCities = cities.filter((c) => c !== translatedCity);

    if (newCities.length === cities.length) {
        throw new Error(MESSAGES[currentLang].CITY_NOT_FOUND);
    }

    await saveKeyValue(TOKEN_DICTIONARY.city, newCities);
};

const getWeatherForSavedCities = async () => {
    const cities = await getCities();
    const currentLang = await getLanguage();

    if (!cities.length) {
        throw new Error(MESSAGES[currentLang].NO_SAVED_CITIES);
    }

    const results = await Promise.all(
        cities.map(async (city) => {
            const weather = await getWeather(city);
            return await printWeather(weather, getIcon(weather.weather[0].icon));
        })
    );

    return results;
};

export { saveCity, deleteCity, getWeatherForSavedCities };