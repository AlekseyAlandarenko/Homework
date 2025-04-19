import { homedir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
import { printError } from './log.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const filePath: string = join(homedir(), 'weather-data.json');

interface StorageData {
    token?: string;
    city?: string[];
    lang?: string;
}

type TokenKeys = keyof StorageData;

const TOKEN_DICTIONARY: Record<TokenKeys, TokenKeys> = {
    token: 'token',
    city: 'city',
    lang: 'lang',
};

const saveKeyValue = async (key: TokenKeys, value: string | string[]): Promise<void> => {
    try {
        let data: StorageData = {};

        try {
            const file: string = await fs.readFile(filePath, 'utf-8');
            data = JSON.parse(file) as StorageData;
        } catch (error: unknown) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }

        const updatedData: StorageData = { ...data, [key]: value };

        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
    } catch (error: unknown) {
        const lang = await getLanguage();
        printError(`${MESSAGES[lang]?.ERROR_SAVING || MESSAGES.en.ERROR_SAVING} ${(error as Error).message}`);
    }
};

const getKeyValue = async (key: TokenKeys): Promise<StorageData[TokenKeys] | undefined> => {
    try {
        const file: string = await fs.readFile(filePath, 'utf-8');
        const data: StorageData = JSON.parse(file);
        return data[key];
    } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            const lang = await getLanguage();
            printError(`${MESSAGES[lang]?.ERROR_READING || MESSAGES.en.ERROR_READING} ${(error as Error).message}`);
        }
    }
    return undefined;
};

export { saveKeyValue, getKeyValue, TOKEN_DICTIONARY, TokenKeys };