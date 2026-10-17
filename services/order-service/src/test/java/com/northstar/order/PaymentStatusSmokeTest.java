package com.northstar.order;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;
import org.springframework.http.HttpStatus;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "management.prometheus.metrics.export.enabled=true")
@TestPropertySource(properties = {"paypal.client-id=", "paypal.client-secret="})
class PaymentStatusSmokeTest {
  @LocalServerPort private int port;

  @Autowired private TestRestTemplate client;

  @Test
  void paymentStatusReportsSimulationWithoutCredentials() {
    var response = client.getForEntity(
        "http://localhost:" + port + "/api/payments/paypal/status", String.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).contains("\"mode\":\"simulated-sandbox\"");
  }

  @Test
  void prometheusMetricsAreExposed() {
    client.getForEntity("http://localhost:" + port + "/api/payments/paypal/status", String.class);
    var response = client.getForEntity("http://localhost:" + port + "/actuator/prometheus", String.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).contains("http_server_requests_seconds");
  }
}
