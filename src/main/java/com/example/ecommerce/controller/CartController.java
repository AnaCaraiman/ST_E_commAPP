package com.example.ecommerce.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.ecommerce.dto.CartDTO;
import com.example.ecommerce.dto.CartItemRequest;
import com.example.ecommerce.dto.OrderDTO;
import com.example.ecommerce.service.CartService;

@RestController
@RequestMapping("/carts/user/{userId}")
@Tag(name = "Cart", description = "Shopping cart of a user. Adding products checks the stock (409 if not enough).")
public class CartController {

    @Autowired
    private CartService cartService;

    @Operation(summary = "Get the user's cart (empty cart if nothing was added yet)")
    @GetMapping
    public CartDTO getCart(@PathVariable String userId) {
        return cartService.getCart(userId);
    }

    @Operation(summary = "Add a product to the cart: body {productId, quantity}. 409 if not enough stock")
    @PostMapping("/items")
    public CartDTO addItem(@PathVariable String userId, @RequestBody CartItemRequest request) {
        return cartService.addItem(userId, request.getProductId(), request.getQuantity());
    }

    @Operation(summary = "Change a product's quantity: body {quantity}. 0 removes it, 409 if not enough stock")
    @PutMapping("/items/{productId}")
    public CartDTO updateItem(@PathVariable String userId, @PathVariable String productId,
                              @RequestBody CartItemRequest request) {
        return cartService.updateItemQuantity(userId, productId, request.getQuantity());
    }

    @Operation(summary = "Remove a product from the cart")
    @DeleteMapping("/items/{productId}")
    public CartDTO removeItem(@PathVariable String userId, @PathVariable String productId) {
        return cartService.removeItem(userId, productId);
    }

    @Operation(summary = "Empty the cart")
    @DeleteMapping
    public CartDTO clearCart(@PathVariable String userId) {
        return cartService.clearCart(userId);
    }

    @Operation(summary = "Place an order with the cart's content, decrement stock and empty the cart")
    @PostMapping("/checkout")
    public ResponseEntity<OrderDTO> checkout(@PathVariable String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cartService.checkout(userId));
    }
}
