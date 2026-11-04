package com.northstar.order;

import static com.northstar.order.CheckoutModels.Product;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class CatalogClient {
  private final RestClient catalog;

  public CatalogClient(@Value("${services.catalog-url}") String url) {
    this.catalog = RestClient.builder().baseUrl(url).build();
  }

  public Product getProduct(String productId) {
    try {
      Product product = catalog.get()
          .uri("/api/products/{id}", productId)
          .retrieve()
          .body(Product.class);
      if (product == null || product.price() == null || product.name() == null) {
        throw new InvalidOrderException("Catalog returned incomplete product data");
      }
      return product;
    } catch (HttpClientErrorException error) {
      if (error.getStatusCode() == HttpStatus.NOT_FOUND) {
        throw new InvalidOrderException("Unknown product: " + productId);
      }
      throw new CatalogUnavailableException("Catalog could not validate the requested product", error);
    } catch (RestClientException error) {
      throw new CatalogUnavailableException("Catalog service is unavailable", error);
    }
  }
}
