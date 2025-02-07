import express from 'express';
import { printHelp } from '../services/log.service.js';

const helpRoutes = express.Router();

helpRoutes.get('/help', async (req, res, next) => {
    try {
        const helpData = await printHelp();
        res.json(helpData);
    } catch (error) {
        next(error);
    }
});

export default helpRoutes;