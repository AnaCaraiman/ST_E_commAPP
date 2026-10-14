# Fake Emag

Java Spring Boot API which mimics the functionalities of the romanian site [Emag](https://www.emag.ro/).

## Features

- *User Authentication* – registration and login.
- *Product Catalog* – browse products, organized by category.
- *Shopping Cart & Checkout* – add products to a cart and place orders.
- *Order Management* – track order history and status.
- *Support Tickets* – submit tickets about the buying experience or products.

## Tech stack

- Java 21+, Spring Boot 3.5, Maven
- MongoDB (Spring Data MongoDB)
- Swagger UI (springdoc-openapi)
- Tests: JUnit 5, Mockito, MockMvc, embedded MongoDB (flapdoodle), Cucumber, JaCoCo

## Prerequisites

- JDK 21 or newer
- Maven 3.9+
- MongoDB, **only** if you want to run against a real database
  ([MongoDB Community Server](https://www.mongodb.com/try/download/community), listening on `localhost:27017`).
  You don't need it for the tests or for the `embedded-mongo` run mode.

## Running the application

With a local MongoDB server running on `localhost:27017`:

```bash
mvn spring-boot:run
```

Without installing MongoDB (starts an embedded MongoDB; data is lost on stop):

```bash
mvn spring-boot:run -Pembedded-mongo
```

You can change the connection with the `MONGODB_HOST`, `MONGODB_PORT` and `MONGODB_DATABASE` environment variables.

Once the app is running:

- API: http://localhost:8080/hello-world
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- Health: http://localhost:8080/actuator/health
- [requests.http](requests.http) has sample requests (VS Code REST Client / IntelliJ HTTP client).

## API for the front-end

CORS is enabled for `http://localhost:3000`, `http://localhost:5173` and `http://localhost:4200`
(change with the `CORS_ALLOWED_ORIGINS` env var, comma separated).
Errors are always JSON: `{"status": 409, "error": "message"}`.

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/signup` | `{username, email, password}` | 201 user `{id, username, email}` · 400 invalid data · 409 username/email taken |
| POST | `/auth/login` | `{username, password}` (username or email) | 200 user · 401 invalid credentials |
| GET | `/products`, `/products/{id}` | | products |
| GET | `/products/{id}/stock?quantity=N` | | `{productId, stock, inStock, requestedQuantity, available}` |
| GET | `/carts/user/{userId}` | | cart `{items[{productId, name, price, quantity, subtotal, stock, available}], totalItems, totalPrice}` |
| POST | `/carts/user/{userId}/items` | `{productId, quantity}` | cart · 409 not enough stock (`available` in body) |
| PUT | `/carts/user/{userId}/items/{productId}` | `{quantity}` (0 removes) | cart · 409 not enough stock |
| DELETE | `/carts/user/{userId}/items/{productId}` | | cart |
| DELETE | `/carts/user/{userId}` | | empty cart |
| POST | `/carts/user/{userId}/checkout` | | 201 order · 409 not enough stock · 400 empty cart |

Password rules: at least 6 characters, one lowercase letter, one uppercase letter and one digit.
Adding to the cart only checks the stock; the stock is decremented at checkout.

Full, interactive documentation: Swagger UI at http://localhost:8080/swagger-ui/index.html

## Tests

| Type | Location / naming | Command |
|------|-------------------|---------|
| Unit | `*Test.java` (Mockito, MockMvc standalone) | `mvn test` |
| Integration | `*IntegrationTest.java`, `@Tag("IntegrationTest")` | `mvn verify` |
| E2E | Cucumber features in `src/test/resources/features`, runner `HelloWorldE2E` | `mvn verify` |

`mvn verify` runs all three. Integration and E2E tests start an embedded MongoDB automatically,
so they need neither Docker nor a local MongoDB (the first run downloads the MongoDB binary once).

Useful options:

```bash
mvn verify -DskipE2E
```

```bash
mvn verify -DskipIT
```

Reports:

- Coverage (JaCoCo): `target/site/jacoco/index.html`
- Cucumber: `target/cucumber-report.html`
- Unit / integration: `target/surefire-reports`, `target/failsafe-reports`

Performance tests: [jmeter-example.jmx](jmeter-example.jmx) can be opened in Apache JMeter and points to `http://localhost:8080`.

## Building a jar

```bash
mvn clean package
```

```bash
java -jar target/ecommerce-0.0.1-SNAPSHOT.jar
```

## Pull Requests

PRs should be approved by at least one other member before merging and should pass the tests.
