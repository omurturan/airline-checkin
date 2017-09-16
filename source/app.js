
const app = require('express')(),
      bodyParser = require('body-parser'),
      server = require('http').Server(app),
      cote = require('cote'),
      cors = require('cors'),
      env = (process.env.NODE_ENV || 'development'),
      config = require('./config/' + env + '.json');

// allow everybody
app.use(cors());
app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.all('*', function(req, res, next) {
    console.log(req.method, req.url);
    next();
});

app.get('/', (req, res) => {
    res.end('Hi, there');
});

app.get('/flights', (req, res) => {
    let data = {
        type: 'list'
    }
    flightRequester.send(data, (err, flights) => {
        if (err) {
            console.log('error ', err);
            res.status(400).end('error ', err);
        }
        res.send(flights);
    });
});

app.get('/flights/:flightId/list-available-seats', (req, res) => {
    let data = {
        type: 'listAvailableSeats',
        flightId: req.params.flightId
    }
    flightRequester.send(data, (err, seats) => {
        if (err) {
            console.log('error ', err);
            res.status(400).end('error ', err);
        }
        res.send(seats);
    });
});

app.post('/reserve-seat', (req, res) => {
    let data = {
        type: 'reserve',
        passengerId: req.body.passengerId,
        flightId: req.body.flightId,
        seatId: req.body.seatId
    };
    allocationRequester.send(data, (err, reservation) => {
        if (err) {
            console.log('error ', err);
            res.status(400).end('error ', err);
            return;
        }
        // expire the reservation after 3 minutes
        let data = {
            reservationId: reservation._id,
            seatId: reservation.seatId
        }
        setTimeout(() => {
            reservationPublisher.publish('expired', data);
        }, 3 * 60 * 1000);
        res.send(reservation);
    });
});

app.post('/check-in', (req, res) => {
    let data = {
        type: 'checkIn',
        passengerId: req.body.passengerId,
        flightId: req.body.flightId,
        seatId: req.body.seatId
    };
    checkInRequester.send(data, (err, checkIn) => {
        if (err) {
            console.log('error ', err);
            res.status(400).end('error ', err);
        }
        res.send(checkIn);
    });
});

const flightRequester = new cote.Requester({
      name: 'flight requester',
      namespace: 'flight'
});

const checkInRequester = new cote.Requester({
      name: 'checkin requester',
      namespace: 'checkin'
});

const allocationRequester = new cote.Requester({
      name: 'allocation requester',
      namespace: 'allocation'
});

const reservationPublisher = new cote.Publisher({
    name: 'reservation publisher',
    // namespace: 'rnd',
    // key: 'a certain key',
    broadcasts: ['expired']
});

server.listen(config.port || 8080);
