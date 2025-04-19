import { saveKeyValue, getKeyValue, TOKEN_DICTIONARY } from './storage.service.js';
import { printError, printSuccess } from './log.service.js';
import { MESSAGES } from './messages.service.js';

type SupportedLanguage = keyof typeof MESSAGES;

const SUPPORTED_LANGUAGES: SupportedLanguage[] = Object.keys(MESSAGES).filter(
    (key): key is SupportedLanguage => key in MESSAGES
);

const saveLanguage = async (lang: string): Promise<void> => {
    const currentLang = await getLanguage();

    if (!SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
        printError(MESSAGES[currentLang].UNSUPPORTED_LANGUAGE);
        return;
    }

    try {
        await saveKeyValue(TOKEN_DICTIONARY.lang, lang);
        printSuccess(MESSAGES[currentLang].LANGUAGE_SET.replace('{lang}', lang));
    } catch (error: unknown) {
        printError((error as Error).message);
    }
};

const getLanguage = async (): Promise<SupportedLanguage> => {
    const lang = await getKeyValue(TOKEN_DICTIONARY.lang);
    if (typeof lang !== 'string') return 'en';
    return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage) ? (lang as SupportedLanguage) : 'en';
};

export { saveLanguage, getLanguage, SupportedLanguage };