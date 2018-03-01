const axios = require('axios');
const forecastBuilder = require('../builders/forecastBuilder');

exports.getForecastsForLocation = async (location) => {
    const query = `select * from weather.forecast where woeid in (select woeid from geo.places(1) where text='${location}') and u='c'`;

    const response = await performQuery(query);

    return forecastBuilder.buildForecasts(response.data.query.results.channel.item.forecast);
};

function performQuery(query) {
    const endpoint = `https://query.yahooapis.com/v1/public/yql?q=${query}&format=json`;

    return axios.get(endpoint);
}
