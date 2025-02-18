import express from 'express';
import { saveToken } from '../services/token.service.js';
import { MESSAGES } from '../services/messages.service.js';
import { validateField } from '../middlewares/validateField.js';

const tokenRoutes = express.Router();

tokenRoutes.post('/set-token', validateField('token', 'API_KEY_REQUIRED'), async (req, res, next) => {
    try {
        await saveToken(req.body.token);
        res.json({ message: MESSAGES[req.lang].API_KEY_SAVED });
    } catch (error) {
        next(error);
    }
});

export default tokenRoutes;