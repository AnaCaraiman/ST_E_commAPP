package com.example.ecommerce.data;

/**
 * A product line inside a {@link CartEntity} (embedded document).
 */
public class CartItem {

    private String productId;
    private long quantity;

    public CartItem() {}

    public CartItem(String productId, long quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public long getQuantity() {
        return quantity;
    }

    public void setQuantity(long quantity) {
        this.quantity = quantity;
    }
}
