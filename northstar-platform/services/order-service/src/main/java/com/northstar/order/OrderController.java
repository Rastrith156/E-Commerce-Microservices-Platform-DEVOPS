package com.northstar.order;

import static com.northstar.order.CheckoutModels.OrderDetails;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "${FRONTEND_URL:http://localhost:5173}")
public class OrderController {
  private final OrderService orders;

  public OrderController(OrderService orders) {
    this.orders = orders;
  }

  @GetMapping("/{recordId}")
  public OrderDetails get(@PathVariable String recordId) {
    return orders.get(recordId);
  }
}
