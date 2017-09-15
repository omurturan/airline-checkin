
/**
 * Initialize DB with a handful of records
 */
const models = require('../models');

const passengers = [
    {
        _id: models.types.ObjectId('59bb97652ca3df9b0e0d2af1'),
        name: 'Ömür Turan',
        balance: 500
    },
    {
        _id: models.types.ObjectId('59bb97672ca3df9b0e0d2af2'),
        name: 'John Wick',
        balance: 1000
    },
    {
        _id: models.types.ObjectId('59bb97672ca3df9b0e0d2af3'),
        name: 'John Wick\'s Dog',
        balance: 10 // poor dog
    }
];

const flights = [
    {
        _id: models.types.ObjectId('59bb97672ca3df9b0e0d2af4'),
        planeModel: 'Boeing 727'
    },
    {
        _id: models.types.ObjectId('59bb97672ca3df9b0e0d2af5'),
        planeModel: 'Boeing 737'
    }
];

const seats = [];
const seatLocations = ['1A', '1B', '1C', '1D', '1E', '1F',
                       '2A', '2B', '2C', '2D', '2E', '2F',
                       '3A', '3B', '3C', '3D', '3E', '3F'];

flights.forEach(function(flight) {
    seatLocations.forEach(function(seat, index) {
        let seatType = models.seatTypes.REGULAR
        let cost = 300;
        const seatIndex = index % 6;
        if (seatIndex === 2 || seatIndex === 3) {
            seatType = models.seatTypes.AISLE;
            cost = 500;
        } else if (seatIndex === 0 || seatIndex === 5) {
            seatType = models.seatTypes.WINDOW
            cost = 600;
        }
        const seatObject = {
            location: seat,
            type: seatType,
            flightId: flight._id,
            cost: cost
        }
        seats.push(seatObject);
    });
});


models.Passenger.find({}).remove(() => {
    models.Passenger.create(passengers, () => {
        console.log('finished populating passengers');
    });
});
models.Flight.find({}).remove(() => {
    models.Flight.create(flights, () => {
        console.log('finished populating flights');
        // wait for flights because seats have reference to them
        models.Seat.find({}).remove(() => {
            models.Seat.create(seats, () => {
                console.log('finished populating seats');
                process.exit(0);
            });
        });
    });
});
