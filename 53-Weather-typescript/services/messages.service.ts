interface Messages {
    API_KEY_NOT_SET: string;
    WEATHER_FETCH_ERROR: string;
    UNSUPPORTED_LANGUAGE: string;
    LANGUAGE_SET: string;
    HELP_TITLE: string;
    HELP_DESCRIPTION: string;
    HELP_ADD_CITY: string;
    HELP_REMOVE_CITY: string;
    HELP_SAVE_API_KEY: string;
    HELP_SET_LANGUAGE: string;
    HELP_SHOW_HELP: string;
    WEATHER_TITLE: string;
    TEMPERATURE: string;
    FEELS_LIKE: string;
    HUMIDITY: string;
    WIND_SPEED: string;
    ERROR_SAVING: string;
    ERROR_READING: string;
    API_KEY_NOT_PROVIDED: string;
    API_KEY_SAVED: string;
    TRANSLATION_ERROR: string;
    CITY_NOT_PROVIDED: string;
    CITY_ALREADY_SAVED: string;
    CITY_SAVED: string;
    CITY_NOT_FOUND: string;
    CITY_REMOVED: string;
    NO_SAVED_CITIES: string;
    ERROR_SAVING_CITY: string;
    ERROR_DELETING_CITY: string;
    ERROR_FETCHING_WEATHER: string;
    ERROR_FETCHING_CITIES: string;
}

export const MESSAGES: Record<'ru' | 'en', Messages> = {
    ru: {
        API_KEY_NOT_SET: 'Ключ API не установлен!',
        WEATHER_FETCH_ERROR: 'Ошибка при получении погоды!',
        UNSUPPORTED_LANGUAGE: 'Поддерживаемые языки: ru, en.',
        LANGUAGE_SET: 'Установленный язык: {lang}.',
        HELP_TITLE: 'Помощь',
        HELP_DESCRIPTION: 'Без параметров - вывод погоды для всех сохранённых городов.',
        HELP_ADD_CITY: 'Добавить город в список.',
        HELP_REMOVE_CITY: 'Удалить город из списка.',
        HELP_SAVE_API_KEY: 'Сохранить API ключ.',
        HELP_SET_LANGUAGE: 'Установить язык.',
        HELP_SHOW_HELP: 'Вывести помощь.',
        WEATHER_TITLE: 'Погода в городе',
        TEMPERATURE: 'Температура',
        FEELS_LIKE: 'ощущается как',
        HUMIDITY: 'Влажность',
        WIND_SPEED: 'Скорость ветра',
        ERROR_SAVING: 'Ошибка при сохранении данных:',
        ERROR_READING: 'Ошибка при чтении данных:',
        API_KEY_NOT_PROVIDED: 'API ключ не предоставлен!',
        API_KEY_SAVED: 'API ключ сохранён.',
        TRANSLATION_ERROR: 'Ошибка перевода:',
        CITY_NOT_PROVIDED: 'Не передан город!',
        CITY_ALREADY_SAVED: 'Этот город уже сохранён!',
        CITY_SAVED: 'Город "{city}" сохранён.',
        CITY_NOT_FOUND: 'Город не найден!',
        CITY_REMOVED: 'Город "{city}" удалён.',
        NO_SAVED_CITIES: 'Нет сохранённых городов!',
        ERROR_SAVING_CITY: 'Ошибка при сохранении города.',
        ERROR_DELETING_CITY: 'Ошибка при удалении города.',
        ERROR_FETCHING_WEATHER: 'Ошибка при получении погоды для {city}.',
        ERROR_FETCHING_CITIES: 'Ошибка при получении списка городов.',
    },
    en: {
        API_KEY_NOT_SET: 'API key is not set!',
        WEATHER_FETCH_ERROR: 'Error fetching weather data!',
        UNSUPPORTED_LANGUAGE: 'Supported languages: ru, en.',
        LANGUAGE_SET: 'Language set: {lang}.',
        HELP_TITLE: 'Help',
        HELP_DESCRIPTION: 'Without parameters - show weather for all saved cities.',
        HELP_ADD_CITY: 'Add city to the list.',
        HELP_REMOVE_CITY: 'Remove city from the list.',
        HELP_SAVE_API_KEY: 'Save API key.',
        HELP_SET_LANGUAGE: 'Set language.',
        HELP_SHOW_HELP: 'Show help.',
        WEATHER_TITLE: 'Weather in',
        TEMPERATURE: 'Temperature',
        FEELS_LIKE: 'feels like',
        HUMIDITY: 'Humidity',
        WIND_SPEED: 'Wind speed',
        ERROR_SAVING: 'Error saving data:',
        ERROR_READING: 'Error reading data:',
        API_KEY_NOT_PROVIDED: 'API key not provided!',
        API_KEY_SAVED: 'API key saved.',
        TRANSLATION_ERROR: 'Translation error:',
        CITY_NOT_PROVIDED: 'City not provided!',
        CITY_ALREADY_SAVED: 'This city is already saved!',
        CITY_SAVED: 'City "{city}" saved.',
        CITY_NOT_FOUND: 'City not found!',
        CITY_REMOVED: 'City "{city}" removed.',
        NO_SAVED_CITIES: 'No saved cities!',
        ERROR_SAVING_CITY: 'Error saving city.',
        ERROR_DELETING_CITY: 'Error deleting city.',
        ERROR_FETCHING_WEATHER: 'Error getting weather for {city}.',
        ERROR_FETCHING_CITIES: 'Error getting list of cities.',
    },
};