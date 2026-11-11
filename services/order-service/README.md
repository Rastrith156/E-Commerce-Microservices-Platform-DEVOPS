# Order Service

Order microservice for the E-Commerce Microservices Platform. Provides checkout and order creation APIs with idempotency support.

## Technology stack

- Java 21
- Spring Boot 3.3.4
- Spring Data JPA
- PostgreSQL
- Flyway database migrations
- Spring Actuator (health checks)
- PayPal sandbox integration (configuration ready)

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create a new order (idempotent) |
| GET | `/api/orders/{orderId}` | Get order by ID |
| POST | `/api/orders/{orderId}/status` | Update order status |

## Idempotency

Order creation supports idempotency via the `idempotencyKey` field in the request body. If an order with the same idempotency key already exists, the existing order is returned instead of creating a duplicate.

## Configuration

| Environment variable | Description | Default |
|----------------------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `ecommerce` |
| `DB_USERNAME` | Database username | `ecommerce` |
| `DB_PASSWORD` | Database password | `ecommerce` |
| `SERVER_PORT` | Server port | `8083` |
| `PAYPAL_CLIENT_ID` | PayPal sandbox client ID | `sandbox` |
| `PAYPAL_CLIENT_SECRET` | PayPal sandbox client secret | `sandbox` |
| `PAYPAL_API_BASE_URL` | PayPal API base URL | `https://api-m.sandbox.paypal.com` |

## Build and run

```bash
# Build
mvn clean package

# Run
java -jar target/order-service-1.0.0.jar
```

## Docker

```bash
docker build -t order-service:1.0.0 .
docker run -p 8083:8083 -e DB_HOST=postgres order-service:1.0.0
```

## Testing

```bash
mvn test
```

## Notes

- Java 21 is required.
- PostgreSQL database must be running and accessible.
- Flyway migrations run automatically on startup.
- Hibernate DDL is set to `validate` to prevent accidental schema changes.
- PayPal is configured for sandbox mode only.
- Idempotency prevents duplicate order creation from retried requests.
