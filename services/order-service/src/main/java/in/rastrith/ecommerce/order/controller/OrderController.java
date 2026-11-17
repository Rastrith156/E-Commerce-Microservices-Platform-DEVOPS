package in.rastrith.ecommerce.order.controller;

import in.rastrith.ecommerce.order.dto.CreateOrderRequest;
import in.rastrith.ecommerce.order.dto.OrderResponse;
import in.rastrith.ecommerce.order.model.OrderStatus;
import in.rastrith.ecommerce.order.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@Validated
public class OrderController {

  private final OrderService orderService;

  public OrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  @PostMapping
  public ResponseEntity<OrderResponse> createOrder(@RequestBody @Validated CreateOrderRequest request) {
    OrderResponse created = orderService.createOrder(request);
    return ResponseEntity.ok(created);
  }

  @GetMapping("/{orderId}")
  public ResponseEntity<OrderResponse> getOrder(@PathVariable Long orderId) {
    return orderService.getOrder(orderId)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping("/{orderId}/status")
  public ResponseEntity<OrderResponse> updateStatus(
      @PathVariable Long orderId,
      @RequestParam OrderStatus status,
      @RequestParam(required = false) String paymentId) {
    return orderService.updateStatus(orderId, status, paymentId)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }
}
