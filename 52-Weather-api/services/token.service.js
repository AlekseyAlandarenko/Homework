import { saveKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const saveToken = async (token) => {
    const currentLang = await getLanguage();

    if (!token) {
        throw new Error(MESSAGES[currentLang].API_KEY_NOT_PROVIDED);
    }

    await saveKeyValue(TOKEN_DICTIONARY.token, token);
};

export { saveToken };