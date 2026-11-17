package com.northstar.order;

public class OrderNotFoundException extends RuntimeException {
  public OrderNotFoundException(String reference) { super("Order not found: " + reference); }
}
