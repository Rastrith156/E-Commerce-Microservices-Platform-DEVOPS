# Catalog Service

Catalog microservice for the E-Commerce Microservices Platform. Provides product listing and product detail APIs.

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
| GET | `/api/catalog/products` | List products (paginated) |
| GET | `/api/catalog/products/{id}` | Get product by ID |
| POST | `/api/catalog/products` | Create a new product |

## Configuration

| Environment variable | Description | Default |
|----------------------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `ecommerce` |
| `DB_USERNAME` | Database username | `ecommerce` |
| `DB_PASSWORD` | Database password | `ecommerce` |
| `SERVER_PORT` | Server port | `8081` |

## Build and run

```bash
# Build
mvn clean package

# Run
java -jar target/catalog-service-1.0.0.jar
```

## Docker

```bash
docker build -t catalog-service:1.0.0 .
docker run -p 8081:8081 -e DB_HOST=postgres catalog-service:1.0.0
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
