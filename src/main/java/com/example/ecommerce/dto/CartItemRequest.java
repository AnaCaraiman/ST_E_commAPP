package com.example.ecommerce.dto;

/**
 * Body of POST /carts/user/{userId}/items and PUT /carts/user/{userId}/items/{productId}.
 */
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
