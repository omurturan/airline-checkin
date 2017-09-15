
/**
 * Mongoose schemas models indexes and validations
 */
const assert = require('assert');
const mongoose = require('mongoose');
const env = process.env.NODE_ENV || 'development';
const config = require('./config/' + env + '.json');

assert(config.mongodb.host, 'Host name is missing in the config');
assert(config.mongodb.database, 'Database name is missing in the config');

mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.database);

mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});
mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open.');
});

if (env === 'development') {
    mongoose.set('debug', true);
}

const ObjectId = mongoose.Schema.Types.ObjectId;


/*
* Passenger Model
*/
let passengerSchema = new mongoose.Schema({
    name: String,
    balance: {
        type: Number,
        min: [0, 'Balance cannot be negative'],
        required: true
    }
});

let Passenger = mongoose.model('Passenger', passengerSchema);

/*
* Flight Model
*/
let flightSchema = new mongoose.Schema({
    planeModel: String
});
let Flight = mongoose.model('Flight', flightSchema);

/*
* Seat Model
*/
let seatSchema = new mongoose.Schema({
    location: String,
    available: {
        type: Boolean,
        default: true
    },
    cost: {
        type: Number,
        min: [0, 'Cost cannot be negative'],
        required: true,
        default: 300
    },
    flightId: { type: ObjectId, ref: 'Flight', required: true },
    'type': {
        type: Number,
        min: [0, 'Type should be between 0 and 5'],
        max: [5, 'Type should be between 0 and 5'],
        required: true
    }
});
seatSchema.index({ flightId: 1 });
let Seat = mongoose.model('Seat', seatSchema);
const seatTypes = {
    'REGULAR': 0,
    'WINDOW': 1,
    'AISLE': 2,
    'FIRE_EXIT': 3,
    'BUSINESS': 4,
    'EXTRA_ROOM': 5
};


/*
* CheckIn Model
*/
let checkInSchema = new mongoose.Schema({
    passengerId: { type: ObjectId, ref: 'Passenger', required: true },
    flightId: { type: ObjectId, ref: 'Flight', required: true },
    seatId: { type: ObjectId, ref: 'Seat', required: true },
    cost: {
        type: Number,
        min: [0, 'Cost cannot be negative'],
        required: true
    },
    createdAt: { type: Date, default: Date.now, required: true },
    lastModifiedAt: { type: Date, default: Date.now, required: true },
    state: {
        type: Number,
        min: [0, 'State should be between 0 and 4'],
        max: [4, 'State should be between 0 and 4'],
        required: true
    }
});
checkInSchema.index({ flightId: 1 });
// checkInSchema.index({ passengerId: 1 });
checkInSchema.index({ state: 1 });
let CheckIn = mongoose.model('CheckIn', checkInSchema);

// I tried $in but it is not supported with partial indexes
CheckIn.collection.createIndex({ passengerId: 1 }, { unique: true, partialFilterExpression: { state: { $lt: 2 } } });

const checkInStates = {
    'STARTED': 0,
    'COMPLETED': 1,
    'CANCELLED': 2,
    'TIMEDOUT': 3
};

/*
* Reservation Model
*/
let reservationSchema = new mongoose.Schema({
    passengerId: { type: ObjectId, ref: 'Passenger', required: true },
    flightId: { type: ObjectId, ref: 'Flight', required: true },
    seatId: { type: ObjectId, ref: 'Seat', required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    cost: {
        type: Number,
        min: [0, 'Cost cannot be negative'],
        required: true,
        default: 0
    }
});
reservationSchema.index({ flightId: 1 });
reservationSchema.index({ passengerId: 1 });
reservationSchema.index({ seatId: 1 });
let Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = {
    Passenger: Passenger,
    Flight: Flight,
    Seat: Seat,
    Reservation: Reservation,
    CheckIn: CheckIn,
    checkInStates: checkInStates,
    seatTypes: seatTypes,
    types: mongoose.Types,
    config: config
};
