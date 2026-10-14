package com.example.ecommerce.dto;

/**
 * Answer of GET /products/{id}/stock?quantity=N
 */
public class StockDTO {

    private String productId;
    private long stock;
    private boolean inStock;
    private long requestedQuantity;
    private boolean available;

    public StockDTO() {}

    public StockDTO(String productId, long stock, boolean inStock, long requestedQuantity, boolean available) {
        this.productId = productId;
        this.stock = stock;
        this.inStock = inStock;
        this.requestedQuantity = requestedQuantity;
        this.available = available;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public long getStock() {
        return stock;
    }

    public void setStock(long stock) {
        this.stock = stock;
    }

    public boolean isInStock() {
        return inStock;
    }

    public void setInStock(boolean inStock) {
        this.inStock = inStock;
    }

    public long getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(long requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}
