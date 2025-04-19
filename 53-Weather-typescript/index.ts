#!/usr/bin/env node

import { getArgs } from './helpers/args.js';
import { printHelp } from './services/log.service.js';
import { saveToken } from './services/token.service.js';
import { saveLanguage } from './services/language.service.js';
import { getWeatherForSavedCities, saveCity, deleteCity } from './services/weather.service.js';

const initCLI = (): void => {
    const args = getArgs(process.argv);

    if (args.h) printHelp();
    if (typeof args.t === 'string') saveToken(args.t);
    if (typeof args.l === 'string') saveLanguage(args.l);
    if (typeof args.s === 'string') saveCity(args.s);
    if (typeof args.d === 'string') deleteCity(args.d);

    getWeatherForSavedCities();
};

initCLI();