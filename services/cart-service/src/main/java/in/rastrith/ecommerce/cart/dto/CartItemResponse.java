package in.rastrith.ecommerce.cart.dto;

public record CartItemResponse(
  String productId,
  Integer quantity
) {
}
