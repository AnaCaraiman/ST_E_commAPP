package com.example.ecommerce.exception;

public class InsufficientStockException extends RuntimeException {

    private final String productId;
    private final long available;

    public InsufficientStockException(String productId, String productName, long available, long requested) {
        super(String.format("Not enough stock for product '%s': requested %d, available %d",
                productName != null ? productName : productId, requested, available));
        this.productId = productId;
        this.available = available;
    }

    public String getProductId() {
        return productId;
    }

    public long getAvailable() {
        return available;
    }
}
