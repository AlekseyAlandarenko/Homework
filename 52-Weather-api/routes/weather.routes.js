import express from 'express';
import { getWeatherForSavedCities, saveCity, deleteCity } from '../services/weather.service.js';
import { MESSAGES } from '../services/messages.service.js';
import { validateField } from '../middlewares/validateField.js';

const weatherRoutes = express.Router();

weatherRoutes.get('/', async (req, res, next) => {
    try {
        const data = await getWeatherForSavedCities();
        res.json(data);
    } catch (error) {
        next({ ...error, message: MESSAGES[req.lang].WEATHER_ERROR });
    }
});

weatherRoutes.post('/set-city', validateField('city', 'CITY_REQUIRED'), async (req, res, next) => {
    try {
        await saveCity(req.body.city);
        res.json({ message: `${MESSAGES[req.lang].CITY_SAVED}: ${req.body.city}` });
    } catch (error) {
        next(error);
    }
});

weatherRoutes.delete('/delete-city', validateField('city', 'CITY_REQUIRED'), async (req, res, next) => {
    try {
        await deleteCity(req.body.city);
        res.json({ message: `${MESSAGES[req.lang].CITY_REMOVED}: ${req.body.city}` });
    } catch (error) {
        next(error);
    }
});

export default weatherRoutes;