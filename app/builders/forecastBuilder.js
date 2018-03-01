const Forecast = require('../models/Forecast');
const R = require('ramda');

exports.buildForecasts = (data) => {
    return R.map((forecastData) => {
        return this.buildForecast(forecastData);
    }, data);
};

exports.buildForecast = (data) => {
    return new Forecast(data.code, data.date, data.day, data.high, data.low, data.text);
};
