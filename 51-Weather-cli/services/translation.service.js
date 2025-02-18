import axios from 'axios';
import { printError } from './log.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const api = axios.create({
    baseURL: 'https://api.mymemory.translated.net/get',
});

const getTranslatedCity = async (city) => {
    const lang = await getLanguage();

    try {
        const { data } = await api.get('', {
            params: { q: city, langpair: 'ru|en' },
        });

        return (data.responseData.translatedText || city).toUpperCase();
    } catch (error) {
        printError(`${MESSAGES[lang]?.TRANSLATION_ERROR || MESSAGES.en.TRANSLATION_ERROR} ${error.message}`);
        return city.toUpperCase();
    }
};

export { getTranslatedCity };