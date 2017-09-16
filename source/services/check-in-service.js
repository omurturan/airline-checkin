const cote = require('cote'),
      models = require('../models');

const checkInResponder = new cote.Responder({
      name: 'checkin responder',
      namespace: 'checkin',
      respondsTo: ['checkIn']
});


const allocationRequester = new cote.Requester({
      name: 'allocation requester',
      namespace: 'allocation'
});


const passengerRequester = new cote.Requester({
      name: 'passenger requester',
      namespace: 'passenger'
});

const reservationPublisher = new cote.Publisher({
    name: 'reservation publisher',
    // namespace: 'rnd',
    // key: 'a certain key',
    broadcasts: ['expired']
});


checkInResponder.on('*', console.log);

checkInResponder.on('checkIn', (req, callback) => {
    if (!req.flightId) {
        return callback('Please provide flightId');
    }
    if (!req.passengerId) {
        return callback('Please provide passengerId');
    }

    const isSeatChosen = !!req.seatId ? true : false;

    models.Passenger.findOne({
        _id: req.passengerId
    }, (err, passenger) => {
        if (err) {
            return callback(err);
        }
        let eventType = 'reserve'
        // if there is no seat chosen, get a random one
        if (!isSeatChosen) {
            eventType = 'reserveRandom'
        }
        let data = {
            type: eventType,
            passengerId: req.passengerId,
            flightId: req.flightId,
            seatId: req.seatId
        }
        allocationRequester.send(data, (err, reservation) => {
            if (err) {
                return callback(err);
            }
            // reservation cost will be zero if no seat chosen
            if (reservation.cost > passenger.balance) {
                reservationPublisher.publish('expired', {
                    reservatiodId: reservation._id,
                    seatId: reservation.seatId
                });
                return callback('Not enough money');
            }

            models.CheckIn.create({
                flightId: reservation.flightId,
                passengerId: reservation.passengerId,
                seatId: reservation.seatId,
                cost: reservation.cost,
                state: models.checkInStates.STARTED
            }, (err, checkIn) => {
                if (err) {
                    return callback(err);
                }

                let data = {
                    type: 'processCheckIn',
                    checkIn: checkIn
                }
                passengerRequester.send(data, (err, passenger) => {
                    if (err) {
                        return callback(err);
                    }
                    models.CheckIn.findOneAndUpdate({
                        _id: checkIn._id
                    }, {
                        state: models.checkInStates.COMPLETED
                    }, {
                        "new" : true
                    }, (err, checkIn) => {
                        if (err) {
                            return callback(err);
                        }

                        // I was expecting reservation.remove()
                        models.Reservation.remove({
                            _id: reservation._id
                        }, (err) => {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, checkIn);
                        });
                    });
                });
            });
        })
    });
});
