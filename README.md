Airline Check-in Application

# About
This app tries to simulate an airline check-in application in a (very) simplified way. It consists of two directories and one README file (this file)
`diagrams` directory has 3 design documents for this project: Class Diagram, Component Diagram, and a Sequence Diagram.
`source` directory contains the source code.

## Installation
This application assumes that you have `MongoDB` running on your computer.
- `npm install` in *source* directory.
- `node seed/populateDb.js` to have an initial data.
- start the microservices
  - `node services/allocation-service.js`
  - `node services/flight-service.js`
  - `node services/passenger-service.js`
  - `node services/check-in-service.js`
- start the app: `node app.js`
OR
- `npm start` which triggers all microservices and `app.js`
  
## Public EndPoints
- `GET /flights`: list all flights
- `GET /flights/:flightId/list-available-seats`: fetches all available seat for a given flight
- `POST /reserve-seat`: reserves a seat for check-in
- `POST /check-in`: creates a check-in record for the given passenger and flight. It charges the passenger if she chose a seat.

## How to run test
- `npm install mocha -g` if you don't already have it
- `npm test`

## How to test check-in process manually
- run `node seed/populateDb.js` to have a fresh database.

Any tool that can make HTTP requests can be used. For now, I'll include a few `curl` requests for a sample check-in process.
- `GET /flights`
```
curl 'http://localhost:8080/flights'
```
This will list all the flights. This application is quite dummy at the moment but ideally, you should be able to filter destination, date etc and choose the desired flight. Get a flight ID from the result set, which we will use in the next examples. Example: `59bb97672ca3df9b0e0d2af4`
- `GET /flights/:flightId/list-available-seats`
```
curl 'http://localhost:8080/flights/59bb97672ca3df9b0e0d2af4/list-available-seats'
```
This fetches all the available seats for this specific flight. You can either choose a seat to reserve it for now or you can do the check-in without doing so. Pick a seat id.
- `POST /reserve-seat`
```
curl 'http://localhost:8080/reserve-seat' \
     -H 'Content-Type: application/json;charset=UTF-8' \
     --data-binary '{"passengerId":"59bb97652ca3df9b0e0d2af1", "flightId":"59bb97672ca3df9b0e0d2af4", "seatId": "59bc52e611f14759fa23438b" }'
 ```
This query creates a reservation for this flight with the prefered seat. Note `passengerId` and `flightId` is okay if you've used seed data but still you should update the `seatId` part accordingly. On success, it will return a `Reservation` record which will also include the total cost of that seat. The cost is not deducted from the user's balance yet.
 - `POST /check-in`
 ```
curl 'http://localhost:8080/check-in' \
     -H 'Content-Type: application/json;charset=UTF-8' \
     --data-binary '{"passengerId":"59bb97652ca3df9b0e0d2af1", "flightId":"59bb97672ca3df9b0e0d2af4", "seatId": "59bc52e611f14759fa23438b" }'
```
This query makes the real check-in process. There are some cases that it might return error
  - The seat might not be available any more.
  - The passenger might not have enough funds.
  - The passenger might already have another check-in for this flight.
On success, it will return the `CheckIn` object. 

## Further Improvements
- I did not know about [async](https://github.com/caolan/async) when I started implementing. It should definitely be included in this project. The part that it is most needed is `CheckInService`. It has a flow which consists of many steps, chained one after another.
- A reservation should be valid only for 3 minutes. For now, this is only ensured by checking the creation dates of reservations. It might be a good idea to have a background job to expire the reservations after 3 minutes.
- Almost no rollback mechanism is implemented.
- In most places, the errors are returned directly to the client as response. A logging mechanism should be introduced.
