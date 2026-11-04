# Order Service

Spring Boot 3 service for checkout and PayPal sandbox capture. Orders and their
product/price snapshots are stored in PostgreSQL with Flyway-managed schema
migrations. Compose gives PostgreSQL a durable named volume and does not publish
its port to the host.

## Endpoints

- `GET /api/payments/paypal/status` — reports whether the sandbox simulator is
  active.
- `POST /api/payments/paypal/orders` — validates items against the catalog,
  creates a sandbox payment reference, and persists the order.
- `POST /api/payments/paypal/orders/{orderId}/capture` — captures or simulates
  payment and persists the payment/order statuses.
- `GET /api/orders/{recordId}` — retrieves the durable order record and saved
  item/price snapshots.

The create response keeps the existing `orderId` and `status` fields and adds
`recordId` for database retrieval. Example request:

```json
{
  "customerReference": "demo-customer-42",
  "items": [{ "productId": "chair-form", "quantity": 2 }],
  "delivery": {
    "recipient": "Demo Customer",
    "addressLine1": "10 Example Road",
    "city": "Mumbai",
    "region": "MH",
    "postalCode": "400001",
    "countryCode": "IN"
  }
}
```

Set `ORDER_DB_PASSWORD` in the environment before running Compose. `ORDER_DB_USER`
and `ORDER_DB_NAME` default to `ecommerce_app` and `ecommerce_orders`. Flyway
applies files from `src/main/resources/db/migration` on service startup;
Hibernate runs in schema-validation mode.

Use the root README for startup, backup, restore, and restart verification
commands. Order reads are not authenticated yet; keep the API private until
customer authentication and per-customer authorization are implemented.
