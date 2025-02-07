import { saveKeyValue, getKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { MESSAGES } from './messages.service.js';

const SUPPORTED_LANGUAGES = ['ru', 'en'];

const saveLanguage = async (lang) => {
    const currentLang = await getLanguage();

    if (!SUPPORTED_LANGUAGES.includes(lang)) {
        throw new Error(MESSAGES[currentLang].UNSUPPORTED_LANGUAGE);
    }

    await saveKeyValue(TOKEN_DICTIONARY.lang, lang);
};

const getLanguage = async () => {
    return (await getKeyValue(TOKEN_DICTIONARY.lang)) || 'en';
};

export { saveLanguage, getLanguage, SUPPORTED_LANGUAGES };