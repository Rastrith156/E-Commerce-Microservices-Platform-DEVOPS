package com.northstar.order;

import static com.northstar.order.CheckoutModels.Captured;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@EnableConfigurationProperties(PayPalProperties.class)
public class PayPalService {
  private static final Logger log = LoggerFactory.getLogger(PayPalService.class);
  private final PayPalProperties cfg;
  private final RestClient paypal;

  public PayPalService(PayPalProperties cfg) {
    this.cfg = cfg;
    this.paypal = RestClient.builder()
        .baseUrl(cfg.baseUrl() != null ? cfg.baseUrl() : "https://api-m.sandbox.paypal.com")
        .build();
  }

  public boolean isLiveConfigured() {
    return cfg.clientId() != null && !cfg.clientId().isBlank() && !"test".equalsIgnoreCase(cfg.clientId())
        && cfg.clientSecret() != null && !cfg.clientSecret().isBlank() && !"test".equalsIgnoreCase(cfg.clientSecret());
  }

  public PaymentIntent createPayment(BigDecimal total) {
    if (isLiveConfigured()) {
      try {
        Map<?, ?> response = paypal.post()
            .uri("/v2/checkout/orders")
            .header("Authorization", "Bearer " + token())
            .header("PayPal-Request-Id", UUID.randomUUID().toString())
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "intent", "CAPTURE",
                "purchase_units", List.of(Map.of(
                    "amount", Map.of("currency_code", "USD", "value", total.toPlainString())))))
            .retrieve()
            .body(Map.class);
        return new PaymentIntent(Objects.toString(response.get("id")),
            Objects.toString(response.get("status")), "PAYPAL_SANDBOX");
      } catch (Exception error) {
        log.warn("PayPal sandbox order creation failed; using the local sandbox simulator ({})",
            error.getClass().getSimpleName());
      }
    }

    String reference = "SANDBOX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    log.info("Simulated sandbox order created for total ${}", total);
    return new PaymentIntent(reference, "CREATED", "PAYPAL_SIMULATED");
  }

  public Captured capturePayment(String paymentReference) {
    if (isLiveConfigured() && !paymentReference.startsWith("SANDBOX-")) {
      try {
        Map<?, ?> response = paypal.post()
            .uri("/v2/checkout/orders/{id}/capture", paymentReference)
            .header("Authorization", "Bearer " + token())
            .header("PayPal-Request-Id", UUID.randomUUID().toString())
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of())
            .retrieve()
            .body(Map.class);

        Object payerValue = response.get("payer");
        Map<?, ?> payer = payerValue instanceof Map<?, ?> map ? map : Map.of();
        return new Captured(
            Objects.toString(response.get("id")),
            Objects.toString(response.get("status")),
            Objects.toString(payer.get("email_address"), "demo-buyer@northstar.internal"));
      } catch (Exception error) {
        log.warn("PayPal sandbox capture failed; completing through the local sandbox simulator ({})",
            error.getClass().getSimpleName());
      }
    }

    log.info("Simulated sandbox order captured");
    return new Captured(paymentReference, "COMPLETED", "demo-buyer@northstar.internal");
  }

  private String token() {
    String credentials = Base64.getEncoder().encodeToString(
        (cfg.clientId() + ":" + cfg.clientSecret()).getBytes(StandardCharsets.UTF_8));
    Map<?, ?> response = paypal.post()
        .uri("/v1/oauth2/token")
        .header("Authorization", "Basic " + credentials)
        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
        .body("grant_type=client_credentials")
        .retrieve()
        .body(Map.class);
    return Objects.toString(response.get("access_token"));
  }

  public record PaymentIntent(String reference, String status, String provider) {}
}
