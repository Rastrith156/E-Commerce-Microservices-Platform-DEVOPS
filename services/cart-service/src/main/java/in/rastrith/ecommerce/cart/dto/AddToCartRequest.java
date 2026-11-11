package in.rastrith.ecommerce.cart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddToCartRequest(
  @NotBlank String productId,
  @NotNull @Positive Integer quantity
) {
}
