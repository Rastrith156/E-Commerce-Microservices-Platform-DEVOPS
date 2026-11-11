package in.rastrith.ecommerce.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record CreateProductRequest(
  @NotBlank String name,
  @NotBlank String description,
  @NotNull @DecimalMin("0.01") BigDecimal price,
  String currency,
  @NotNull @PositiveOrZero Integer stock,
  String imageUrl
) {
}
