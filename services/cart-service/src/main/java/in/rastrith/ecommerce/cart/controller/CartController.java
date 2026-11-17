package in.rastrith.ecommerce.cart.controller;

import in.rastrith.ecommerce.cart.dto.AddToCartRequest;
import in.rastrith.ecommerce.cart.dto.CartResponse;
import in.rastrith.ecommerce.cart.dto.UpdateCartItemRequest;
import in.rastrith.ecommerce.cart.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@Validated
public class CartController {

  private final CartService cartService;

  public CartController(CartService cartService) {
    this.cartService = cartService;
  }

  @GetMapping("/{userId}")
  public ResponseEntity<CartResponse> getCart(@PathVariable String userId) {
    return cartService.getCart(userId)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping("/{userId}/items")
  public ResponseEntity<CartResponse> addItem(
      @PathVariable String userId,
      @RequestBody @Validated AddToCartRequest request) {
    CartResponse updated = cartService.addItem(userId, request);
    return ResponseEntity.ok(updated);
  }

  @PutMapping("/{userId}/items/{productId}")
  public ResponseEntity<CartResponse> updateItem(
      @PathVariable String userId,
      @PathVariable String productId,
      @RequestBody @Validated UpdateCartItemRequest request) {
    return cartService.updateItem(userId, productId, request.quantity())
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{userId}/items/{productId}")
  public ResponseEntity<CartResponse> removeItem(
      @PathVariable String userId,
      @PathVariable String productId) {
    return cartService.removeItem(userId, productId)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{userId}")
  public ResponseEntity<Void> clearCart(@PathVariable String userId) {
    cartService.clearCart(userId);
    return ResponseEntity.noContent().build();
  }
}
