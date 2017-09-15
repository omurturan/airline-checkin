const cote = require('cote'),
      models = require('../models');

const allocationResponder = new cote.Responder({
    name: 'allocation responder',
    namespace: 'allocation',
    respondsTo: ['reserve', 'reserveRandom']
});

const flightRequester = new cote.Requester({
      name: 'flight requester',
      namespace: 'flight'
});

allocationResponder.on('*', console.log);

allocationResponder.on('reserve', (req, callback) => {
    if (!req.flightId) {
        return callback('Please provide flightId');
    }
    if (!req.passengerId) {
        return callback('Please provide passengerId');
    }
    if (!req.seatId) {
        return callback('Please provide seatId');
    }

    models.Seat.findOne({
        _id: models.types.ObjectId(req.seatId)
    }, (err, seat) => {
        if (err) {
            return callback(err);
        }

        if (!seat) {
            return callback('No seat is found');
        }

        if (!seat.available) {
            return callback('The seat is not available');
        }

        models.Reservation.create({
            flightId: models.types.ObjectId(req.flightId),
            passengerId: models.types.ObjectId(req.passengerId),
            seatId: models.types.ObjectId(req.seatId),
            cost: seat.cost
        }, (err, reservation) => {
            if (err) {
                return callback(err);
            }
            models.Seat.update({
                _id: models.types.ObjectId(req.seatId)
            }, {
                available: false
            }, (err, data) => {
                if (err) {
                    return callback(err);
                }
                callback(null, reservation);
            });
        });
    });
});

allocationResponder.on('reserveRandom', (req, callback) => {
    if (!req.flightId) {
        return callback('Please provide flightId');
    }
    if (!req.passengerId) {
        return callback('Please provide passengerId');
    }

    let data = {
        type: 'listAvailableSeats',
        flightId: req.flightId
    }
    flightRequester.send(data, (err, seats) => {
        if (err) {
            return callback(err);
        }
        if (seats.length === 0) {
            return callback('No seats are available');
        }
        const seat = seats[0];
        models.Reservation.create({
            flightId: models.types.ObjectId(req.flightId),
            passengerId: models.types.ObjectId(req.passengerId),
            seatId: seat._id,
            cost: 0
        }, (err, reservation) => {
            if (err) {
                return callback(err);
            }
            models.Seat.update({
                _id: seat.id
            }, {
                available: false
            }, (err, data) => {
                if (err) {
                    return callback(err);
                }
                callback(null, reservation);
            });
        });
    });
});
