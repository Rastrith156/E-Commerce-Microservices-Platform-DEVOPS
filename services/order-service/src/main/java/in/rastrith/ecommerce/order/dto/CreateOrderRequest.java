package in.rastrith.ecommerce.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateOrderRequest(
  @NotBlank String userId,
  @NotBlank String idempotencyKey,
  @NotEmpty List<OrderItemRequest> items
) {
}
