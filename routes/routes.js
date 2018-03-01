const R = require('ramda');
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', {title: 'Weather App'});
});

router.post('/', (req, res) => {
    req.session.location = R.toLower(req.body.search);
    res.redirect('/weather');
});

router.get('/weather', (req, res) => {
    if (req.session.location) {
        const location = R.toUpper(req.session.location);
        res.render('weather', {title: `Weather in ${location}`, location: location});
    } else {
        res.redirect('/');
    }
});

module.exports = router;
