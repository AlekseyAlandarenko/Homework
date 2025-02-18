import express from 'express';
import { saveLanguage } from '../services/language.service.js';
import { MESSAGES } from '../services/messages.service.js';
import { validateField } from '../middlewares/validateField.js';

const languageRoutes = express.Router();

languageRoutes.post('/set-language', validateField('lang', 'LANGUAGE_REQUIRED'), async (req, res, next) => {
    try {
        await saveLanguage(req.body.lang);
        res.json({ message: `${MESSAGES[req.lang].LANGUAGE_SET} ${req.body.lang}.` });
    } catch (error) {
        next(error);
    }
});

export default languageRoutes;