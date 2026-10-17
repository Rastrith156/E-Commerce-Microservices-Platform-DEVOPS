package com.northstar.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CatalogSmokeTest {
  @LocalServerPort private int port;

  @Autowired private TestRestTemplate client;

  @Test
  void productListIsAvailable() {
    var response = client.getForEntity("http://localhost:" + port + "/api/products", String.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).contains("chair-form");
  }

  @Test
  void prometheusMetricsAreExposed() {
    client.getForEntity("http://localhost:" + port + "/api/products", String.class);
    var response = client.getForEntity("http://localhost:" + port + "/actuator/prometheus", String.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).contains("http_server_requests_seconds");
  }
}
