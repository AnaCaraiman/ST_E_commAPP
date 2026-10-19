package com.example.ecommerce.dto;

public class CartItemRequest {

    private String productId;
    private Long quantity;

    public CartItemRequest() {}

    public CartItemRequest(String productId, Long quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Long getQuantity() {
        return quantity;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }
}
