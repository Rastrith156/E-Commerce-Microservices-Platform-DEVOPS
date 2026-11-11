package in.rastrith.ecommerce.cart.dto;

import java.time.Instant;
import java.util.List;

public record CartResponse(
  String userId,
  List<CartItemResponse> items,
  Instant updatedAt
) {
}
