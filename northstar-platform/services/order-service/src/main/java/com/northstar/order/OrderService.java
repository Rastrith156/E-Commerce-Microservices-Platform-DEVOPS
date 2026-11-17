package com.northstar.order;

import static com.northstar.order.CheckoutModels.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
  private final OrderRepository orders;
  private final CatalogClient catalog;
  private final PayPalService paypal;

  public OrderService(OrderRepository orders, CatalogClient catalog, PayPalService paypal) {
    this.orders = orders;
    this.catalog = catalog;
    this.paypal = paypal;
  }

  @Transactional
  public Created create(Request request) {
    if (request == null || request.items() == null || request.items().isEmpty()) {
      throw new InvalidOrderException("At least one order item is required");
    }

    List<OrderItemSnapshot> snapshots = new ArrayList<>();
    for (Item item : request.items()) {
      CheckoutModels.Product product = catalog.getProduct(item.productId());
      if (product.price().signum() < 0) {
        throw new InvalidOrderException("Catalog returned an invalid price for product " + item.productId());
      }
      snapshots.add(new OrderItemSnapshot(
          product.id(), product.name(), product.price().setScale(2, RoundingMode.HALF_UP), item.quantity()));
    }

    BigDecimal total = snapshots.stream()
        .map(OrderItemSnapshot::getLineTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add)
        .setScale(2, RoundingMode.HALF_UP);
    OrderEntity order = new OrderEntity(
        UUID.randomUUID(), request.customerReference(), snapshots,
        request.delivery() == null ? null : new DeliverySnapshot(request.delivery()), total);
    orders.saveAndFlush(order);

    PayPalService.PaymentIntent payment = paypal.createPayment(total);
    order.setPaymentReference(payment.reference());
    order.setPaymentProvider(payment.provider());
    order.recordPayment(payment.status());
    orders.save(order);
    return new Created(payment.reference(), payment.status(), order.getId());
  }

  @Transactional
  public Captured capture(String reference) {
    OrderEntity order = findByReference(reference);
    if (order.getPaymentReference() == null) {
      throw new OrderNotFoundException(reference);
    }
    if (order.toDetails().paymentStatus().equals(PaymentStatus.COMPLETED.name())) {
      return new Captured(reference, "COMPLETED", "demo-buyer@northstar.internal");
    }

    Captured captured = paypal.capturePayment(order.getPaymentReference());
    order.recordPayment(captured.status());
    orders.save(order);
    return captured;
  }

  @Transactional(readOnly = true)
  public OrderDetails get(UUID recordId) {
    return orders.findById(recordId)
        .map(OrderEntity::toDetails)
        .orElseThrow(() -> new OrderNotFoundException(recordId.toString()));
  }

  @Transactional(readOnly = true)
  public OrderDetails get(String recordId) {
    try {
      return get(UUID.fromString(recordId));
    } catch (IllegalArgumentException error) {
      throw new OrderNotFoundException(recordId);
    }
  }

  private OrderEntity findByReference(String reference) {
    if (reference == null || reference.isBlank()) throw new OrderNotFoundException(reference);
    return orders.findByPaymentReference(reference)
        .orElseThrow(() -> new OrderNotFoundException(reference));
  }
}
