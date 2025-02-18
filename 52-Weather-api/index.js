import express from 'express';
import weatherRoutes from './routes/weather.routes.js';
import languageRoutes from './routes/language.routes.js';
import tokenRoutes from './routes/token.routes.js';
import helpRoutes from './routes/help.routes.js';
import { getLanguage } from './services/language.service.js';
import { MESSAGES } from './services/messages.service.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(async (req, res, next) => {
    req.lang = await getLanguage();
    next();
});

app.use('/weather', weatherRoutes);
app.use('/language', languageRoutes);
app.use('/token', tokenRoutes);
app.use('/help', helpRoutes);

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || MESSAGES[req.lang]?.SERVER_ERROR || MESSAGES.en.SERVER_ERROR;
    res.status(status).json({ error: message, details: err.details });
});

app.listen(PORT, async () => {
    const lang = await getLanguage();
    console.log(`${MESSAGES[lang].SERVER_RUNNING} ${PORT}`);
});