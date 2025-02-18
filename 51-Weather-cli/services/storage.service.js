import { homedir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
import { printError } from './log.service.js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';

const filePath = join(homedir(), 'weather-data.json');

const TOKEN_DICTIONARY = {
    token: 'token',
    city: 'city',
    lang: 'lang',
};

const saveKeyValue = async (key, value) => {
    try {
        let data = {};

        try {
            const file = await fs.readFile(filePath, 'utf-8');
            data = JSON.parse(file);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        const updatedData = { ...data, [key]: value };

        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
    } catch (error) {
        const lang = await getLanguage();
        printError(`${MESSAGES[lang]?.ERROR_SAVING || MESSAGES.en.ERROR_SAVING} ${error.message}`);
    }
};

const getKeyValue = async (key) => {
    try {
        const file = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(file);
        return data[key];
    } catch (error) {
        if (error.code !== 'ENOENT') {
            const lang = await getLanguage();
            printError(`${MESSAGES[lang]?.ERROR_READING || MESSAGES.en.ERROR_READING} ${error.message}`);
        }
    }
    return undefined;
};

export { saveKeyValue, getKeyValue, TOKEN_DICTIONARY };