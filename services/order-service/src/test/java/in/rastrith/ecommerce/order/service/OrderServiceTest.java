package in.rastrith.ecommerce.order.service;

import in.rastrith.ecommerce.order.dto.CreateOrderRequest;
import in.rastrith.ecommerce.order.dto.OrderItemRequest;
import in.rastrith.ecommerce.order.dto.OrderResponse;
import in.rastrith.ecommerce.order.model.Order;
import in.rastrith.ecommerce.order.model.OrderStatus;
import in.rastrith.ecommerce.order.repository.OrderRepository;
import in.rastrith.ecommerce.order.repository.OrderItemRepository;
import java.math.BigDecimal;
import java.util.List;
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
class OrderServiceTest {

  @Mock
  private OrderRepository orderRepository;

  @Mock
  private OrderItemRepository orderItemRepository;

  @InjectMocks
  private OrderService orderService;

  @Test
  void createOrderShouldSaveAndReturnResponse() {
    CreateOrderRequest request = new CreateOrderRequest(
        "user-1",
        "idempotency-key-1",
        List.of(new OrderItemRequest("product-1", 2, new BigDecimal("99.99")))
    );

    Order saved = new Order();
    saved.setId(1L);
    saved.setOrderNumber("ORD-ABCD1234");
    saved.setUserId("user-1");
    saved.setIdempotencyKey("idempotency-key-1");
    saved.setTotal(new BigDecimal("199.98"));
    saved.setStatus(OrderStatus.PENDING);

    when(orderRepository.findByIdempotencyKey("idempotency-key-1")).thenReturn(Optional.empty());
    when(orderRepository.save(org.mockito.ArgumentMatchers.any(Order.class))).thenReturn(saved);

    OrderResponse response = orderService.createOrder(request);

    assertThat(response.id()).isEqualTo(1L);
    assertThat(response.userId()).isEqualTo("user-1");
    assertThat(response.total()).isEqualByComparingTo("199.98");
    assertThat(response.status()).isEqualTo(OrderStatus.PENDING);
    assertThat(response.items()).hasSize(1);
    verify(orderRepository).findByIdempotencyKey("idempotency-key-1");
    verify(orderRepository).save(org.mockito.ArgumentMatchers.any(Order.class));
  }

  @Test
  void createOrderShouldReturnExistingWhenIdempotencyKeyExists() {
    CreateOrderRequest request = new CreateOrderRequest(
        "user-1",
        "idempotency-key-1",
        List.of(new OrderItemRequest("product-1", 2, new BigDecimal("99.99")))
    );

    Order existing = new Order();
    existing.setId(1L);
    existing.setOrderNumber("ORD-ABCD1234");
    existing.setUserId("user-1");
    existing.setIdempotencyKey("idempotency-key-1");
    existing.setTotal(new BigDecimal("199.98"));
    existing.setStatus(OrderStatus.CONFIRMED);

    when(orderRepository.findByIdempotencyKey("idempotency-key-1")).thenReturn(Optional.of(existing));

    OrderResponse response = orderService.createOrder(request);

    assertThat(response.id()).isEqualTo(1L);
    assertThat(response.status()).isEqualTo(OrderStatus.CONFIRMED);
    verify(orderRepository).findByIdempotencyKey("idempotency-key-1");
    // Should NOT save again
    verify(orderRepository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any(Order.class));
  }

  @Test
  void getOrderShouldReturnOrderWhenExists() {
    Order order = new Order();
    order.setId(1L);
    order.setOrderNumber("ORD-ABCD1234");
    order.setUserId("user-1");

    when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

    Optional<OrderResponse> response = orderService.getOrder(1L);

    assertThat(response).isPresent();
    assertThat(response.get().orderNumber()).isEqualTo("ORD-ABCD1234");
  }
}
