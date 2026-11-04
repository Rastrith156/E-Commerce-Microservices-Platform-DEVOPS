package com.northstar.order;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "orders",
    indexes = {@Index(name = "idx_orders_customer_reference", columnList = "customer_reference"),
        @Index(name = "idx_orders_created_at", columnList = "created_at")})
public class OrderEntity {
  @Id
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "payment_reference", length = 128)
  private String paymentReference;

  @Column(name = "payment_provider", nullable = false, length = 32)
  private String paymentProvider;

  @Column(name = "customer_reference", length = 128)
  private String customerReference;

  @Enumerated(EnumType.STRING)
  @Column(name = "order_status", nullable = false, length = 32)
  private OrderStatus orderStatus;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_status", nullable = false, length = 32)
  private PaymentStatus paymentStatus;

  @Column(name = "currency", nullable = false, length = 3)
  private String currency = "USD";

  @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal totalAmount;

  @ElementCollection
  @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
  @OrderColumn(name = "line_number", nullable = false)
  private List<OrderItemSnapshot> items = new ArrayList<>();

  @Embedded
  private DeliverySnapshot delivery;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected OrderEntity() {}

  public OrderEntity(
      UUID id,
      String customerReference,
      List<OrderItemSnapshot> items,
      DeliverySnapshot delivery,
      BigDecimal totalAmount) {
    this.id = id;
    this.customerReference = customerReference;
    this.items = new ArrayList<>(items);
    this.delivery = delivery;
    this.totalAmount = totalAmount;
    this.paymentProvider = "PAYPAL_SANDBOX";
    this.orderStatus = OrderStatus.PENDING_PAYMENT;
    this.paymentStatus = PaymentStatus.PENDING;
  }

  @jakarta.persistence.PrePersist
  void beforeInsert() {
    Instant now = Instant.now();
    if (createdAt == null) createdAt = now;
    updatedAt = now;
  }

  @jakarta.persistence.PreUpdate
  void beforeUpdate() { updatedAt = Instant.now(); }

  public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

  public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }

  public void recordPayment(String providerStatus) {
    String status = providerStatus == null ? "PENDING" : providerStatus.toUpperCase();
    if ("COMPLETED".equals(status) || "CAPTURED".equals(status)) {
      paymentStatus = PaymentStatus.COMPLETED;
      orderStatus = OrderStatus.PAID;
    } else if ("DENIED".equals(status) || "FAILED".equals(status) || "VOIDED".equals(status)) {
      paymentStatus = PaymentStatus.FAILED;
      orderStatus = OrderStatus.PAYMENT_FAILED;
    } else {
      paymentStatus = PaymentStatus.PENDING;
      orderStatus = OrderStatus.PENDING_PAYMENT;
    }
  }

  public CheckoutModels.OrderDetails toDetails() {
    List<CheckoutModels.OrderLine> lines = items.stream()
        .map(item -> new CheckoutModels.OrderLine(
            item.getProductId(), item.getProductName(), item.getUnitPrice(), item.getQuantity(), item.getLineTotal()))
        .toList();
    return new CheckoutModels.OrderDetails(
        id, paymentReference, customerReference, orderStatus.name(), paymentStatus.name(), currency,
        totalAmount, lines, delivery == null ? null : delivery.toModel(), createdAt, updatedAt);
  }

  public UUID getId() { return id; }
  public String getPaymentReference() { return paymentReference; }
  public String getPaymentProvider() { return paymentProvider; }
  public BigDecimal getTotalAmount() { return totalAmount; }
}
