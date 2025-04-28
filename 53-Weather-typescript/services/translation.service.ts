import axios from 'axios';
import { printError } from './log.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const api = axios.create({
    baseURL: 'https://api.mymemory.translated.net/get',
});

interface TranslationResponse {
    responseData: {
        translatedText: string;
    };
}

const getTranslatedCity = async (city: string): Promise<string> => {
    const lang = await getLanguage();

    try {
        const { data } = await api.get<TranslationResponse>('', {
            params: { q: city, langpair: 'ru|en' },
        });

        return (data.responseData.translatedText || city).toUpperCase();
    } catch (error: unknown) {
        printError(`${MESSAGES[lang]?.TRANSLATION_ERROR || MESSAGES.en.TRANSLATION_ERROR} ${(error as Error).message}`);
        return city.toUpperCase();
    }
};

export { getTranslatedCity };

