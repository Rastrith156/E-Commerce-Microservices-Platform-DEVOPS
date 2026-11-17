package in.rastrith.ecommerce.cart.service;

import in.rastrith.ecommerce.cart.dto.AddToCartRequest;
import in.rastrith.ecommerce.cart.dto.CartResponse;
import in.rastrith.ecommerce.cart.dto.CartItemResponse;
import in.rastrith.ecommerce.cart.dto.UpdateCartItemRequest;
import in.rastrith.ecommerce.cart.model.Cart;
import in.rastrith.ecommerce.cart.model.CartItem;
import in.rastrith.ecommerce.cart.repository.CartRepository;
import in.rastrith.ecommerce.cart.repository.CartItemRepository;
import java.time.Instant;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CartService {

  private final CartRepository cartRepository;
  private final CartItemRepository cartItemRepository;

  public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository) {
    this.cartRepository = cartRepository;
    this.cartItemRepository = cartItemRepository;
  }

  public Optional<CartResponse> getCart(String userId) {
    return cartRepository.findByUserId(userId).map(this::toResponse);
  }

  @Transactional
  public CartResponse addItem(String userId, AddToCartRequest request) {
    Cart cart = cartRepository.findByUserId(userId)
        .orElseGet(() -> {
          Cart newCart = new Cart();
          newCart.setUserId(userId);
          return cartRepository.save(newCart);
        });

    Optional<CartItem> existing = cart.getItems().stream()
        .filter(item -> item.getProductId().equals(request.productId()))
        .findFirst();

    if (existing.isPresent()) {
      CartItem item = existing.get();
      item.setQuantity(item.getQuantity() + request.quantity());
    } else {
      CartItem newItem = new CartItem();
      newItem.setCart(cart);
      newItem.setProductId(request.productId());
      newItem.setQuantity(request.quantity());
      cart.getItems().add(newItem);
    }

    cart.setUpdatedAt(Instant.now());
    Cart saved = cartRepository.save(cart);
    return toResponse(saved);
  }

  @Transactional
  public Optional<CartResponse> updateItem(String userId, String productId, Integer quantity) {
    return cartRepository.findByUserId(userId)
        .flatMap(cart -> cart.getItems().stream()
            .filter(item -> item.getProductId().equals(productId))
            .findFirst())
        .map(item -> {
          if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
          } else {
            item.setQuantity(quantity);
          }
          cart.setUpdatedAt(Instant.now());
          cartRepository.save(cart);
          return toResponse(cart);
        });
  }

  @Transactional
  public Optional<CartResponse> removeItem(String userId, String productId) {
    return cartRepository.findByUserId(userId)
        .map(cart -> {
          cart.getItems().removeIf(item -> item.getProductId().equals(productId));
          cart.setUpdatedAt(Instant.now());
          return cartRepository.save(cart);
        })
        .map(this::toResponse);
  }

  @Transactional
  public void clearCart(String userId) {
    cartRepository.findByUserId(userId).ifPresent(cart -> {
      cart.getItems().clear();
      cart.setUpdatedAt(Instant.now());
      cartRepository.save(cart);
    });
  }

  private CartResponse toResponse(Cart cart) {
    List<CartItemResponse> itemResponses = cart.getItems().stream()
        .map(item -> new CartItemResponse(item.getProductId(), item.getQuantity()))
        .toList();
    return new CartResponse(cart.getUserId(), itemResponses, cart.getUpdatedAt());
  }
}
