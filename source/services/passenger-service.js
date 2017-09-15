const cote = require('cote'),
      models = require('../models');

const passengerResponder = new cote.Responder({
    name: 'passenger responder',
    namespace: 'passenger',
    respondsTo: ['processCheckIn']
});

passengerResponder.on('*', console.log);

passengerResponder.on('processCheckIn', (req, callback) => {
    if (!req.checkIn) {
        return callback('CheckIn object is required');
    }

    models.Passenger.update({
        _id: req.checkIn.passengerId
    }, {
        $inc: { balance: -req.checkIn.cost }
    }, callback);
});
