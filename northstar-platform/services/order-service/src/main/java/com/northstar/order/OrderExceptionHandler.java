package com.northstar.order;

import java.util.Map;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class OrderExceptionHandler {
  @ExceptionHandler({InvalidOrderException.class, IllegalArgumentException.class})
  ResponseEntity<Map<String, String>> invalidOrder(RuntimeException error) {
    return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
  }

  @ExceptionHandler(OrderNotFoundException.class)
  ResponseEntity<Map<String, String>> notFound(OrderNotFoundException error) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", error.getMessage()));
  }

  @ExceptionHandler({DataAccessException.class, CatalogUnavailableException.class})
  ResponseEntity<Map<String, String>> dependencyUnavailable(RuntimeException error) {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(Map.of("message", "Order storage or catalog service is temporarily unavailable"));
  }
}
