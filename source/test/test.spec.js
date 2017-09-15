const should = require('should');
const models = require('../models');
const cote = require('cote');

const passengerIdString = '59bc38cfbf656646df050b1a';
const passengerId = models.types.ObjectId(passengerIdString);

const flightIdString = '59bc3918bf656646df050b1b';
const flightId = models.types.ObjectId(flightIdString);

const seatIdString = '59bc39eabf656646df050b1c';
const seatId = models.types.ObjectId(seatIdString);

const seatIdString2 = '59bc3a99bf656646df050b1d';
const seatId2 = models.types.ObjectId(seatIdString2);

const checkInRequester = new cote.Requester({
      name: 'checkin requester',
      namespace: 'checkin'
});

describe("CheckIn Service", function() {
    before(function(done) {
        models.Passenger.find({}).remove(() => {
            models.Passenger.create({
                _id: passengerId,
                name: 'Test User',
                balance: 500
            }, () => {
                models.Flight.find({}).remove(() => {
                    models.Flight.create({
                        _id: flightId,
                        name: 'Paper Plane'
                    }, () => {
                        models.Seat.find({}).remove(() => {
                            const seatArray = [{
                                _id: seatId,
                                location: '1A',
                                type: models.seatTypes.WINDOW,
                                flightId: flightId,
                                cost: 600,
                            },
                            {
                                _id: seatId2,
                                location: '1B',
                                type: models.seatTypes.REGULAR,
                                flightId: flightId,
                                cost: 300,
                            }];
                            models.Seat.create(seatArray, () => {
                                models.CheckIn.find({}).remove(done);
                            });
                        });
                    });
                });
            });
        });
    });

    it('Should successfully check in if user has enough funds', function(done) {
        let data = {
            type: 'checkIn',
            passengerId: passengerId,
            flightId: flightId,
            seatId: seatId2
        };
        checkInRequester.send(data, (err, checkIn) => {
            should.equal(err, null);
            checkIn.passengerId.should.equal(passengerIdString);
            checkIn.flightId.should.equal(flightIdString);
            checkIn.seatId.should.equal(seatIdString2);
            checkIn.cost.should.equal(300);
            done();
        });
    });

    it('Should fail if double checkin on the same flight', function(done) {
        let data = {
            type: 'checkIn',
            passengerId: passengerId,
            flightId: flightId,
            seatId: seatId
        };
        checkInRequester.send(data, (err, checkIn) => {
            // E11000 duplicate key error collection: ...
            should.equal(err.code, 11000);
            done();
        });
    });

    it('Should fail if the seat is already taken', function(done) {
        let data = {
            type: 'checkIn',
            passengerId: passengerId,
            flightId: flightId,
            seatId: seatId2 // we reserved this in the above test
        };
        checkInRequester.send(data, (err, checkIn) => {
            should.equal(err, 'The seat is not available');
            done();
        });
    });
});
