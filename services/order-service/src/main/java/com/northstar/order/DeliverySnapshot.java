package com.northstar.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class DeliverySnapshot {
  @Column(name = "delivery_recipient", length = 120)
  private String recipient;

  @Column(name = "delivery_address_line_1", length = 200)
  private String addressLine1;

  @Column(name = "delivery_address_line_2", length = 200)
  private String addressLine2;

  @Column(name = "delivery_city", length = 100)
  private String city;

  @Column(name = "delivery_region", length = 100)
  private String region;

  @Column(name = "delivery_postal_code", length = 24)
  private String postalCode;

  @Column(name = "delivery_country_code", length = 2)
  private String countryCode;

  protected DeliverySnapshot() {}

  public DeliverySnapshot(CheckoutModels.Delivery delivery) {
    if (delivery == null) return;
    recipient = delivery.recipient();
    addressLine1 = delivery.addressLine1();
    addressLine2 = delivery.addressLine2();
    city = delivery.city();
    region = delivery.region();
    postalCode = delivery.postalCode();
    countryCode = delivery.countryCode();
  }

  public boolean isEmpty() { return recipient == null; }

  public CheckoutModels.Delivery toModel() {
    return isEmpty() ? null : new CheckoutModels.Delivery(
        recipient, addressLine1, addressLine2, city, region, postalCode, countryCode);
  }
}
