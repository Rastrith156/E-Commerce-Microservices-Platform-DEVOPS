package in.rastrith.ecommerce.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
  String productId,
  Integer quantity,
  BigDecimal unitPrice
) {
}
