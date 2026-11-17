# Cart Service

Cart microservice for the E-Commerce Microservices Platform. Provides shopping cart management APIs.

## Technology stack

- Java 21
- Spring Boot 3.3.4
- Spring Data JPA
- PostgreSQL
- Flyway database migrations
- Spring Actuator (health checks)

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart/{userId}` | Get user's cart |
| POST | `/api/cart/{userId}/items` | Add item to cart |
| PUT | `/api/cart/{userId}/items/{productId}` | Update item quantity |
| DELETE | `/api/cart/{userId}/items/{productId}` | Remove item from cart |
| DELETE | `/api/cart/{userId}` | Clear cart |

## Configuration

| Environment variable | Description | Default |
|----------------------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `ecommerce` |
| `DB_USERNAME` | Database username | `ecommerce` |
| `DB_PASSWORD` | Database password | `ecommerce` |
| `SERVER_PORT` | Server port | `8082` |

## Build and run

```bash
# Build
mvn clean package

# Run
java -jar target/cart-service-1.0.0.jar
```

## Docker

```bash
docker build -t cart-service:1.0.0 .
docker run -p 8082:8082 -e DB_HOST=postgres cart-service:1.0.0
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
