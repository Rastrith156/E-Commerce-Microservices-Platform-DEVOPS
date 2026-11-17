package com.northstar.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Embeddable
public class OrderItemSnapshot {
  @Column(name = "product_id", nullable = false, length = 128)
  private String productId;

  @Column(name = "product_name", nullable = false, length = 255)
  private String productName;

  @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
  private BigDecimal unitPrice;

  @Column(name = "quantity", nullable = false)
  private int quantity;

  @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
  private BigDecimal lineTotal;

  protected OrderItemSnapshot() {}

  public OrderItemSnapshot(String productId, String productName, BigDecimal unitPrice, int quantity) {
    this.productId = productId;
    this.productName = productName;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
    this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
  }

  public String getProductId() { return productId; }
  public String getProductName() { return productName; }
  public BigDecimal getUnitPrice() { return unitPrice; }
  public int getQuantity() { return quantity; }
  public BigDecimal getLineTotal() { return lineTotal; }
}
