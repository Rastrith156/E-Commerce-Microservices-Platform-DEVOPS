CREATE TABLE orders (
    id UUID PRIMARY KEY,
    payment_reference VARCHAR(128) UNIQUE,
    payment_provider VARCHAR(32) NOT NULL,
    customer_reference VARCHAR(128),
    order_status VARCHAR(32) NOT NULL CHECK (order_status IN ('PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED')),
    payment_status VARCHAR(32) NOT NULL CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED')),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    delivery_recipient VARCHAR(120),
    delivery_address_line_1 VARCHAR(200),
    delivery_address_line_2 VARCHAR(200),
    delivery_city VARCHAR(100),
    delivery_region VARCHAR(100),
    delivery_postal_code VARCHAR(24),
    delivery_country_code VARCHAR(2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_orders_customer_reference ON orders (customer_reference);
CREATE INDEX idx_orders_created_at ON orders (created_at);

CREATE TABLE order_items (
    order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id VARCHAR(128) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    PRIMARY KEY (order_id, line_number)
);
