package com.northstar.order;

import static com.northstar.order.CheckoutModels.*;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/paypal")
@CrossOrigin(origins = "${FRONTEND_URL:http://localhost:5173}")
public class PaymentController {
  private final PayPalService payments;
  private final OrderService orders;

  public PaymentController(PayPalService payments, OrderService orders) {
    this.payments = payments;
    this.orders = orders;
  }

  @GetMapping("/status")
  public Map<String, Object> status() {
    return Map.of(
        "gateway", "PayPal",
        "liveConfigured", payments.isLiveConfigured(),
        "mode", payments.isLiveConfigured() ? "live-sandbox" : "simulated-sandbox"
    );
  }

  @PostMapping("/orders")
  public Created create(@Valid @RequestBody Request request) {
    return orders.create(request);
  }

  @PostMapping("/orders/{id}/capture")
  public Captured capture(@PathVariable String id) {
    return orders.capture(id);
  }
}
