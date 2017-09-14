#### Design Files
This folder includes a Class Diagram, a Sequence Diagram, and a Component Diagram. Both `.uml` and `.png` files are included. They are all created using [PlantUML](http://plantuml.com). (I really like the simplicity of this tool. Check out their website.)

#### Assumptions
- This is a backend-only application. In the diagrams, it is assumed that there is a client somewhere which makes some RESTful requests to our application.
- Especially for the sequence diagram, I put small notes like `Break on error.`. This means that the application will return an error to the client and will not resume execution. This is to avoid meaninglessly-long sequence diagrams (and also to save a little time for now).

#### Notes
- All requests coming from clients should be routed through a router mechanism.
- There will be 5 microservices:
  - `CheckInService` will interact with `CheckIns` and `Flights` collections
  - `PassengerService` will interact with `Passengers` collection. It will be responsible for 
  - `AllocationService` will interact with `Reservations` collection.
  - `GatewayService` will be responsible for receiving the requests and route them to internal services which I've just mentioned.
- I tried to plan these microservices isolated from each other, meaning that each one accesses only a portion of the collections. Theoretically, each microservice can be deployed on a different machine and all it needs would be the relevant collections and a TCP connection to communicate with the other microservices.
- I keep saying TCP connection because this Node.js library is advised to be used for microservice communication: [Cote](https://github.com/dashersw/cote). However, it is always possible to use regular HTTP requests for microservices to communicate.
- Although it is possible for each microservice to use a different database, for now they will all use a single MongoDB database.
- Mongoose will be used as ODM.
- There will be 3 endpoints:
  - `/list-available-seats`: this end-point would take a flight ID as a parameter and will list the available seats for check-in
  - `/reserve-seat`: this will reserve the seat for 3 minutes for a user. When a seat is reserved, nobody (except the passenger who reserves it) would be able to book it.
  - `/check-in`: this end-point is the problematic one because it interacts with almost all of the documents. If there is an error in a step between, all the changes should be rolled-back. Let me go into detail about which errors can occur.
    - After fetching the passenger first, we have two options: did he select a seat or not?
      - If the passenger selected a seat, reserve the seat first and check if he has money for that seat. The seat may have already been taken or the passenger may not have money.
      - If no prefered seat, we try to give him one of the cheapest seats.
    - Create a `checkIn` with the `STARTED` status. It means we did not charge the user yet. This can fail if the passenger has another check-in for this flight. One passenger can have one check-in. This uniqueness should be guaranteed on database level.
    - Charge the passenger
    - Update the `checkIn` status to `COMPLETED`
    - Clear the reservation for this seat.
- Some validations should be enforced also in the database:
  - A passenger can not have negative balance.
  - A passenger can not have ongoing `checkIn`s for the same flight. (i.e. with statuses `STARTED` and `COMPLETED`)
  - There can not be two `checkIn` records for the same `Seat` record.
