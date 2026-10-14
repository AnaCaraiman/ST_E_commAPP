package com.example.ecommerce.data;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

/**
 * One shopping cart per user, holding the products and their quantities.
 */
@Document(collection = "carts")
public class CartEntity {

    @Id
    private String id;

    private String userId;

    private List<CartItem> items = new ArrayList<>();

    private Date updatedAt;

    public CartEntity() {}

    public CartEntity(String userId) {
        this.userId = userId;
        this.updatedAt = new Date();
    }

    public Optional<CartItem> findItem(String productId) {
        return items.stream().filter(item -> item.getProductId().equals(productId)).findFirst();
    }

    public void removeItem(String productId) {
        items.removeIf(item -> item.getProductId().equals(productId));
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

    public List<CartItem> getItems() {
        return items;
    }

    public void setItems(List<CartItem> items) {
        this.items = items;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return String.format("CartEntity[id=%s, userId=%s, items=%s]", id, userId, items.size());
    }
}
