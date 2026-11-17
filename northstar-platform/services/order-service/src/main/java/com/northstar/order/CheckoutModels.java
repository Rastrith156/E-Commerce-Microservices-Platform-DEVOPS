package com.northstar.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class CheckoutModels {
  private CheckoutModels() {}

  public record Item(
      @NotBlank @Size(max = 128) String productId,
      @Min(1) @Max(99) int quantity) {}

  public record Delivery(
      @NotBlank @Size(max = 120) String recipient,
      @NotBlank @Size(max = 200) String addressLine1,
      @Size(max = 200) String addressLine2,
      @NotBlank @Size(max = 100) String city,
      @Size(max = 100) String region,
      @NotBlank @Size(max = 24) String postalCode,
      @NotBlank @Pattern(regexp = "[A-Z]{2}") String countryCode) {}

  public record Request(
      @NotEmpty @Size(max = 50) List<@Valid Item> items,
      @Size(max = 128) String customerReference,
      @Valid Delivery delivery) {
    public Request(List<Item> items) {
      this(items, null, null);
    }
  }

  public record Product(String id, String name, BigDecimal price) {}

  public record Created(String orderId, String status, UUID recordId) {}

  public record Captured(String orderId, String status, String payerEmail) {}

  public record OrderLine(
      String productId, String productName, BigDecimal unitPrice, int quantity, BigDecimal lineTotal) {}

  public record OrderDetails(
      UUID recordId,
      String orderId,
      String customerReference,
      String orderStatus,
      String paymentStatus,
      String currency,
      BigDecimal totalAmount,
      List<OrderLine> items,
      Delivery delivery,
      Instant createdAt,
      Instant updatedAt) {}
}
