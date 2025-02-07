#!/usr/bin/env node

import { getArgs } from './helpers/args.js';
import { printHelp } from './services/log.service.js';
import { saveToken } from './services/token.service.js';
import { saveLanguage } from './services/language.service.js';
import { getWeatherForSavedCities, saveCity, deleteCity } from './services/weather.service.js';

const initCLI = () => {
    const args = getArgs(process.argv);

    if (args.h) return printHelp();
    if (args.t) return saveToken(args.t);
    if (args.l) return saveLanguage(args.l);
    if (args.s) return saveCity(args.s);
    if (args.d) return deleteCity(args.d);

    return getWeatherForSavedCities();
};

initCLI();