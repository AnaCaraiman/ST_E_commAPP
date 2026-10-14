package com.example.ecommerce.dto;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * The cart as the front-end sees it: lines with product details, plus the total.
 */
public class CartDTO {

    private String id;
    private String userId;
    private List<CartItemDTO> items = new ArrayList<>();
    private long totalItems;
    private long totalPrice;
    private Date updatedAt;

    public CartDTO() {}

    public CartDTO(String id, String userId, List<CartItemDTO> items, Date updatedAt) {
        this.id = id;
        this.userId = userId;
        this.items = items;
        this.updatedAt = updatedAt;
        this.totalItems = items.stream().mapToLong(CartItemDTO::getQuantity).sum();
        this.totalPrice = items.stream().mapToLong(CartItemDTO::getSubtotal).sum();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public List<CartItemDTO> getItems() {
        return items;
    }

    public void setItems(List<CartItemDTO> items) {
        this.items = items;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public long getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(long totalPrice) {
        this.totalPrice = totalPrice;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}
