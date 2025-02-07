import { saveKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { printError, printSuccess } from './log.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const saveToken = async (token) => {
    const currentLang = await getLanguage();

    if (!token) {
        printError(MESSAGES[currentLang].API_KEY_NOT_PROVIDED);
        return;
    }

    try {
        await saveKeyValue(TOKEN_DICTIONARY.token, token);
        printSuccess(MESSAGES[currentLang].API_KEY_SAVED);
    } catch (error) {
        printError(error.message);
    }
};

export { saveToken };