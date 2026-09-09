# PayPal Sandbox Integration

The React client uses only the public sandbox client ID. The Order Service keeps the PayPal secret server-side, recalculates totals from authoritative Catalog Service prices, creates orders, and captures buyer-approved payments.

## Configuration

```bash
cp frontend/.env.example frontend/.env
export PAYPAL_CLIENT_ID=your_sandbox_client_id
export PAYPAL_CLIENT_SECRET=your_sandbox_secret
```

Never commit `.env` or credentials. This sandbox implementation requires persistent orders, authentication, webhook signature verification, inventory reservation, fraud controls, and observability before production use.
