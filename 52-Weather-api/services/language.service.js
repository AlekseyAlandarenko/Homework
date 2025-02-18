import { saveKeyValue, getKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { MESSAGES } from './messages.service.js';

const SUPPORTED_LANGUAGES = Object.keys(MESSAGES);

const saveLanguage = async (lang) => {
    const currentLang = await getLanguage();

    if (!SUPPORTED_LANGUAGES.includes(lang)) {
        throw new Error(MESSAGES[currentLang].UNSUPPORTED_LANGUAGE);
    }

    await saveKeyValue(TOKEN_DICTIONARY.lang, lang);
};

const getLanguage = async () => {
    const lang = await getKeyValue(TOKEN_DICTIONARY.lang);
    if (typeof lang !== 'string') return 'en';
    return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
};

export { saveLanguage, getLanguage, SUPPORTED_LANGUAGES };