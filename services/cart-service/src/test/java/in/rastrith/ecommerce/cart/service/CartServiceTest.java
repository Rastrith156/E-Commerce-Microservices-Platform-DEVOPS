package in.rastrith.ecommerce.cart.service;

import in.rastrith.ecommerce.cart.dto.AddToCartRequest;
import in.rastrith.ecommerce.cart.dto.CartResponse;
import in.rastrith.ecommerce.cart.model.Cart;
import in.rastrith.ecommerce.cart.model.CartItem;
import in.rastrith.ecommerce.cart.repository.CartRepository;
import in.rastrith.ecommerce.cart.repository.CartItemRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

  @Mock
  private CartRepository cartRepository;

  @Mock
  private CartItemRepository cartItemRepository;

  @InjectMocks
  private CartService cartService;

  @Test
  void addItemShouldCreateNewCartWhenNoneExists() {
    AddToCartRequest request = new AddToCartRequest("product-1", 2);

    when(cartRepository.findByUserId("user-1")).thenReturn(Optional.empty());

    Cart newCart = new Cart();
    newCart.setId(1L);
    newCart.setUserId("user-1");
    when(cartRepository.save(org.mockito.ArgumentMatchers.any(Cart.class)))
        .thenReturn(newCart);

    CartResponse response = cartService.addItem("user-1", request);

    assertThat(response.userId()).isEqualTo("user-1");
    assertThat(response.items()).hasSize(1);
    assertThat(response.items().get(0).productId()).isEqualTo("product-1");
    assertThat(response.items().get(0).quantity()).isEqualTo(2);
    verify(cartRepository).save(org.mockito.ArgumentMatchers.any(Cart.class));
  }

  @Test
  void getCartShouldReturnEmptyWhenNoCartExists() {
    when(cartRepository.findByUserId("user-1")).thenReturn(Optional.empty());

    Optional<CartResponse> response = cartService.getCart("user-1");

    assertThat(response).isEmpty();
  }
}
