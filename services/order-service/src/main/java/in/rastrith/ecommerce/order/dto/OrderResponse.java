package in.rastrith.ecommerce.order.dto;

import in.rastrith.ecommerce.order.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
  Long id,
  String orderNumber,
  String userId,
  List<OrderItemResponse> items,
  BigDecimal total,
  String currency,
  OrderStatus status,
  String paymentId,
  Instant createdAt,
  Instant updatedAt
) {
}
