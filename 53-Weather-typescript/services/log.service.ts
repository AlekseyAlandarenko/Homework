import chalk from 'chalk';
import dedent from 'dedent-js';
import { getLanguage } from './language.service.js';
import { MESSAGES } from './messages.service.js';
import { WeatherData } from './api.service.js';

const printError = (error: string | Error): void => {
    console.log(chalk.bgRed(' ERROR ') + ' ' + (error instanceof Error ? error.message : error));
};

const printSuccess = (message: string): void => {
    console.log(chalk.bgGreen(' SUCCESS ') + ' ' + message);
};

const printHelp = async (): Promise<void> => {
    const lang = await getLanguage();
    console.log(
        dedent`${chalk.bgCyan(' ' + MESSAGES[lang].HELP_TITLE + ' ')}
        ${MESSAGES[lang].HELP_DESCRIPTION}
        -s [CITY] - ${MESSAGES[lang].HELP_ADD_CITY}
        -r [CITY] - ${MESSAGES[lang].HELP_REMOVE_CITY}
        -t [API_KEY] - ${MESSAGES[lang].HELP_SAVE_API_KEY}
        -l [LANG] - ${MESSAGES[lang].HELP_SET_LANGUAGE}
        -h - ${MESSAGES[lang].HELP_SHOW_HELP}
        `
    );
};

const printWeather = async (res: WeatherData, icon: string): Promise<void> => {
    const lang = await getLanguage();
    console.log(
        dedent`${chalk.bgYellow(' WEATHER ')} ${MESSAGES[lang].WEATHER_TITLE} ${res.name}
        ${icon} ${res.weather[0].description}
        ${MESSAGES[lang].TEMPERATURE}: ${res.main.temp} ( ${MESSAGES[lang].FEELS_LIKE} ${res.main.feels_like})
        ${MESSAGES[lang].HUMIDITY}: ${res.main.humidity}%
        ${MESSAGES[lang].WIND_SPEED}: ${res.wind.speed}
        `
    );
};

export { printError, printSuccess, printHelp, printWeather };