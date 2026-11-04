package com.northstar.order;

public class CatalogUnavailableException extends RuntimeException {
  public CatalogUnavailableException(String message, Throwable cause) { super(message, cause); }
}
