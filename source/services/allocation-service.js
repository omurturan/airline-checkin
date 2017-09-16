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

const reservationSubscriber = new cote.Subscriber({
    name: 'reservation subscriber',
    // namespace: 'rnd',
    // key: 'a certain key',
    subscribesTo: ['expired']
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
            let threeMinAgo = new Date();
            threeMinAgo.setMinutes(threeMinAgo.getMinutes() - 3);
            models.Reservation.findOne({
                passengerId: models.types.ObjectId(req.passengerId),
                seatId: seat._id,
                createdAt: { $gte: threeMinAgo }
            }, (err, reservation) => {
                if (err) {
                    return callback(err);
                }
                if (reservation) {
                    return callback(null, reservation);
                } else {
                    return callback('The seat is not available');
                }

            });
        } else {

            models.Reservation.create({
                flightId: models.types.ObjectId(req.flightId),
                passengerId: models.types.ObjectId(req.passengerId),
                seatId: models.types.ObjectId(req.seatId),
                cost: seat.cost
            }, (err, reservation) => {
                if (err) {
                    return callback(err);
                }
                models.Seat.findOneAndUpdate({
                    _id: models.types.ObjectId(req.seatId)
                }, {
                     available: false
                }, {
                    "new" : true
                }, (err, seat) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, reservation);
                });
            });
        }
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


reservationSubscriber.on('expired', (req) => {
    ({ reservationId, seatId } = req);
    models.Reservation.remove({
        _id: models.types.ObjectId(reservationId)
    }, (err) => {
        if (err) {
            return console.log('could not delete reservation');
        }
        models.CheckIn.findOne({
            seatId: models.types.ObjectId(seatId)
        }, (err, checkIn) => {
            if (!checkIn) {
                models.Seat.update({
                    _id: models.types.ObjectId(seatId)
                }, { available: true
                }, () => {
                    console.log('The seat is again available');
                });
            }
        });
    });
});
