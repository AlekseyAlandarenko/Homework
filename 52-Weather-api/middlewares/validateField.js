import { MESSAGES } from '../services/messages.service.js';

export const validateField = (field, messageKey) => (req, res, next) => {
    if (!req.body || !req.body[field]) {
        const message = MESSAGES[req.lang]?.[messageKey] || MESSAGES.en[messageKey];
        return res.status(400).json({ error: message });
    }
    next();
};