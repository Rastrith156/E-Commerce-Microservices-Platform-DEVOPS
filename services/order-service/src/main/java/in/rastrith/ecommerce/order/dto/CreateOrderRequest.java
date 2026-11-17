package in.rastrith.ecommerce.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateOrderRequest(
  @NotBlank String userId,
  @NotBlank String idempotencyKey,
  @NotEmpty List<OrderItemRequest> items
) {
}
