package com.northstar.order;

import static com.northstar.order.CheckoutModels.*;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/paypal")
@CrossOrigin(origins = "${FRONTEND_URL:http://localhost:5173}")
public class PaymentController {
  private final PayPalService service;

  public PaymentController(PayPalService service) {
    this.service = service;
  }

  @GetMapping("/status")
  public Map<String, Object> status() {
    return Map.of(
        "gateway", "PayPal",
        "liveConfigured", service.isLiveConfigured(),
        "mode", service.isLiveConfigured() ? "live-sandbox" : "simulated-sandbox"
    );
  }

  @PostMapping("/orders")
  public Created create(@Valid @RequestBody Request request) {
    return service.create(request);
  }

  @PostMapping("/orders/{id}/capture")
  public Captured capture(@PathVariable String id) {
    return service.capture(id);
  }

  @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
  ResponseEntity<?> badRequest(RuntimeException error) {
    return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
  }
}
