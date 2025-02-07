import express from 'express';
import { getWeatherForSavedCities, saveCity, deleteCity } from './services/weather.service.js';
import { saveLanguage, getLanguage } from './services/language.service.js';
import { saveToken } from './services/token.service.js';
import { printHelp } from './services/log.service.js';
import { MESSAGES } from './services/messages.service.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || MESSAGES[req.lang]?.SERVER_ERROR || MESSAGES.en.SERVER_ERROR;
    res.status(status).json({ error: message, details: err.details });
};

const validateField = (field, messageKey) => (req, res, next) => {
    if (!req.body || !req.body[field]) {
        const message = MESSAGES[req.lang]?.[messageKey] || MESSAGES.en[messageKey];
        return res.status(400).json({ error: message });
    }
    next();
};

app.use(async (req, res, next) => {
    req.lang = await getLanguage();
    next();
});

app.post('/set-token', validateField('token', 'API_KEY_REQUIRED'), async (req, res, next) => {
    try {
        await saveToken(req.body.token);
        res.json({ message: MESSAGES[req.lang].API_KEY_SAVED });
    } catch (error) {
        next(error);
    }
});

app.post('/set-language', validateField('lang', 'LANGUAGE_REQUIRED'), async (req, res, next) => {
    try {
        await saveLanguage(req.body.lang);
        res.json({ message: `${MESSAGES[req.lang].LANGUAGE_SET} ${req.body.lang}.` });
    } catch (error) {
        next(error);
    }
});

app.get('/weather', async (req, res, next) => {
    try {
        const data = await getWeatherForSavedCities();
        res.json(data);
    } catch (error) {
        next({ ...error, message: MESSAGES[req.lang].WEATHER_ERROR });
    }
});

app.post('/set-city', validateField('city', 'CITY_REQUIRED'), async (req, res, next) => {
    try {
        await saveCity(req.body.city);
        res.json({ message: `${MESSAGES[req.lang].CITY_SAVED}: ${req.body.city}` });
    } catch (error) {
        next(error);
    }
});

app.delete('/delete-city', validateField('city', 'CITY_REQUIRED'), async (req, res, next) => {
    try {
        await deleteCity(req.body.city);
        res.json({ message: `${MESSAGES[req.lang].CITY_REMOVED}: ${req.body.city}` });
    } catch (error) {
        next(error);
    }
});

app.get('/help', async (req, res, next) => {
    try {
        const helpData = await printHelp();
        res.json(helpData);
    } catch (error) {
        next(error);
    }
});

app.use(errorHandler);

app.listen(PORT, async () => {
    const lang = await getLanguage();
    console.log(`${MESSAGES[lang].SERVER_RUNNING}${PORT}`);
});