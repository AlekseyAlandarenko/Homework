import { saveKeyValue, getKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { printError, printSuccess } from './log.service.js';
import { MESSAGES } from './messages.service.js';

const SUPPORTED_LANGUAGES = ['ru', 'en'];

const saveLanguage = async (lang) => {
    const currentLang = await getLanguage();

    if (!SUPPORTED_LANGUAGES.includes(lang)) {
        printError(MESSAGES[currentLang].UNSUPPORTED_LANGUAGE);
        return;
    }

    try {
        await saveKeyValue(TOKEN_DICTIONARY.lang, lang);
        printSuccess(MESSAGES[currentLang].LANGUAGE_SET.replace('{lang}', lang));
    } catch (e) {
        printError(e.message);
    }
};

const getLanguage = async () => {
    return (await getKeyValue(TOKEN_DICTIONARY.lang)) || 'en';
};

export { saveLanguage, getLanguage, SUPPORTED_LANGUAGES };