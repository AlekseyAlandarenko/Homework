import { saveKeyValue, getKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { printError, printSuccess } from './log.service.js';
import { MESSAGES } from './messages.service.js';

const SUPPORTED_LANGUAGES = Object.keys(MESSAGES).filter((key) => key in MESSAGES);

const saveLanguage = async (lang) => {
    const currentLang = await getLanguage();

    if (!SUPPORTED_LANGUAGES.includes(lang)) {
        printError(MESSAGES[currentLang].UNSUPPORTED_LANGUAGE);
        return;
    }

    try {
        await saveKeyValue(TOKEN_DICTIONARY.lang, lang);
        printSuccess(MESSAGES[currentLang].LANGUAGE_SET.replace('{lang}', lang));
    } catch (error) {
        printError(error.message);
    }
};

const getLanguage = async () => {
    const lang = await getKeyValue(TOKEN_DICTIONARY.lang);
    if (typeof lang !== 'string') return 'en';
    return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
};

export { saveLanguage, getLanguage };