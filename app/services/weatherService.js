const weatherRepository = require('../repositories/weatherRepository');
const R = require('ramda');

exports.getForecastsForLocation = async (location) => {
    const forecasts = await weatherRepository.getForecastsForLocation(location);

    return R.slice(0, 6, forecasts);
};
