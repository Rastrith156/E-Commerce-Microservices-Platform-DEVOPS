package in.rastrith.ecommerce.order.service;

import in.rastrith.ecommerce.order.dto.CreateOrderRequest;
import in.rastrith.ecommerce.order.dto.OrderResponse;
import in.rastrith.ecommerce.order.dto.OrderItemResponse;
import in.rastrith.ecommerce.order.model.Order;
import in.rastrith.ecommerce.order.model.OrderItem;
import in.rastrith.ecommerce.order.model.OrderStatus;
import in.rastrith.ecommerce.order.repository.OrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class OrderService {

  private final OrderRepository orderRepository;

  public OrderService(OrderRepository orderRepository) {
    this.orderRepository = orderRepository;
  }

  public Optional<OrderResponse> getOrder(Long orderId) {
    return orderRepository.findById(orderId).map(this::toResponse);
  }

  @Transactional
  public OrderResponse createOrder(CreateOrderRequest request) {
    // Idempotency: check if order already exists for this idempotency key
    Optional<Order> existing = orderRepository.findByIdempotencyKey(request.idempotencyKey());
    if (existing.isPresent()) {
      return toResponse(existing.get());
    }

    Order order = new Order();
    order.setUserId(request.userId());
    order.setIdempotencyKey(request.idempotencyKey());

    List<OrderItem> orderItems = request.items().stream().map(itemRequest -> {
      OrderItem item = new OrderItem();
      item.setOrder(order);
      item.setProductId(itemRequest.productId());
      item.setQuantity(itemRequest.quantity());
      item.setUnitPrice(itemRequest.unitPrice());
      return item;
    }).toList();

    BigDecimal total = orderItems.stream()
        .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    order.setItems(orderItems);
    order.setTotal(total);
    order.setStatus(OrderStatus.PENDING);
    order.setUpdatedAt(Instant.now());

    Order saved = orderRepository.save(order);
    return toResponse(saved);
  }

  @Transactional
  public Optional<OrderResponse> updateStatus(Long orderId, OrderStatus status, String paymentId) {
    return orderRepository.findById(orderId)
        .map(order -> {
          order.setStatus(status);
          if (paymentId != null) {
            order.setPaymentId(paymentId);
          }
          order.setUpdatedAt(Instant.now());
          return orderRepository.save(order);
        })
        .map(this::toResponse);
  }

  private OrderResponse toResponse(Order order) {
    List<OrderItemResponse> itemResponses = order.getItems().stream()
        .map(item -> new OrderItemResponse(
            item.getProductId(),
            item.getQuantity(),
            item.getUnitPrice()
        ))
        .toList();
    return new OrderResponse(
        order.getId(),
        order.getOrderNumber(),
        order.getUserId(),
        itemResponses,
        order.getTotal(),
        order.getCurrency(),
        order.getStatus(),
        order.getPaymentId(),
        order.getCreatedAt(),
        order.getUpdatedAt()
    );
  }
}
