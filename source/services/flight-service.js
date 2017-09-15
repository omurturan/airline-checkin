const cote = require('cote'),
      models = require('../models');

const flightResponder = new cote.Responder({
    name: 'flight responder',
    namespace: 'flight',
    respondsTo: ['list', 'listAvailableSeats']
});

flightResponder.on('*', console.log);

flightResponder.on('list', (req, callback) => {
    models.Flight.find({}, callback);
});

flightResponder.on('listAvailableSeats', (req, callback) => {
    if (!req.flightId) {
        return callback('Please provide flightId');
    }
    models.Seat.find({
        flightId: models.types.ObjectId(req.flightId),
        available: true
    }, callback);
});
