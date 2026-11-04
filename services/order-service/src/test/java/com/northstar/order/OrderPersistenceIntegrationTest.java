package com.northstar.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderPersistenceIntegrationTest {
  @LocalServerPort private int port;
  @Autowired private TestRestTemplate client;
  @Autowired private OrderRepository orders;
  @MockitoBean private CatalogClient catalog;

  @Test
  void createsAndRetrievesDurableOrderSnapshots() {
    when(catalog.getProduct("chair-form"))
        .thenReturn(new CheckoutModels.Product("chair-form", "Form Lounge Chair", new BigDecimal("289.00")));

    var created = client.postForEntity(
        url("/api/payments/paypal/orders"), Map.of(
            "customerReference", "customer-demo-42",
            "items", List.of(Map.of("productId", "chair-form", "quantity", 2)),
            "delivery", Map.of(
                "recipient", "Demo Customer",
                "addressLine1", "10 Example Road",
                "city", "Mumbai",
                "region", "MH",
                "postalCode", "400001",
                "countryCode", "IN")),
        CheckoutModels.Created.class);

    assertThat(created.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(created.getBody()).isNotNull();
    assertThat(created.getBody().orderId()).startsWith("SANDBOX-");
    UUID recordId = created.getBody().recordId();

    orders.flush();
    var retrieved = client.getForEntity(url("/api/orders/" + recordId), CheckoutModels.OrderDetails.class);
    assertThat(retrieved.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(retrieved.getBody()).isNotNull();
    assertThat(retrieved.getBody().totalAmount()).isEqualByComparingTo("578.00");
    assertThat(retrieved.getBody().customerReference()).isEqualTo("customer-demo-42");
    assertThat(retrieved.getBody().items()).hasSize(1);
    assertThat(retrieved.getBody().items().getFirst().productName()).isEqualTo("Form Lounge Chair");
    assertThat(retrieved.getBody().delivery().postalCode()).isEqualTo("400001");
    assertThat(retrieved.getBody().createdAt()).isNotNull();
    assertThat(retrieved.getBody().updatedAt()).isNotNull();
  }

  @Test
  void capturesAndPersistsPaymentStatus() {
    when(catalog.getProduct("lamp-arc"))
        .thenReturn(new CheckoutModels.Product("lamp-arc", "Arc Table Lamp", new BigDecimal("119.00")));
    var created = client.postForEntity(
        url("/api/payments/paypal/orders"), Map.of(
            "items", List.of(Map.of("productId", "lamp-arc", "quantity", 1))),
        CheckoutModels.Created.class);
    assertThat(created.getBody()).isNotNull();

    var captured = client.postForEntity(
        url("/api/payments/paypal/orders/" + created.getBody().orderId() + "/capture"),
        HttpEntity.EMPTY,
        CheckoutModels.Captured.class);
    assertThat(captured.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(captured.getBody()).isNotNull();
    assertThat(captured.getBody().status()).isEqualTo("COMPLETED");

    var retrieved = client.getForEntity(
        url("/api/orders/" + created.getBody().recordId()), CheckoutModels.OrderDetails.class);
    assertThat(retrieved.getBody()).isNotNull();
    assertThat(retrieved.getBody().paymentStatus()).isEqualTo("COMPLETED");
    assertThat(retrieved.getBody().orderStatus()).isEqualTo("PAID");
  }

  @Test
  void returnsNotFoundForUnknownOrder() {
    var response = client.getForEntity(url("/api/orders/" + UUID.randomUUID()), String.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
  }

  @Test
  void rejectsInvalidOrderRequests() {
    var response = client.postForEntity(
        url("/api/payments/paypal/orders"),
        Map.of("items", List.of(Map.of("productId", "chair-form", "quantity", 0))),
        String.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
  }

  private String url(String path) { return "http://localhost:" + port + path; }
}
