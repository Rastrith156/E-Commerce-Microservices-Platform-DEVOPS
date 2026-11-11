package in.rastrith.ecommerce.catalog.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
  Long id,
  String name,
  String description,
  BigDecimal price,
  String currency,
  Integer stock,
  String imageUrl,
  Instant createdAt,
  Instant updatedAt
) {
}
