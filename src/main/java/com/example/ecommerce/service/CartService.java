package com.example.ecommerce.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.ecommerce.data.CartEntity;
import com.example.ecommerce.data.CartItem;
import com.example.ecommerce.data.CartRepository;
import com.example.ecommerce.data.ProductEntity;
import com.example.ecommerce.data.ProductOrderEntity;
import com.example.ecommerce.data.ProductRepository;
import com.example.ecommerce.data.UserEntity;
import com.example.ecommerce.data.UserRepository;
import com.example.ecommerce.dto.CartDTO;
import com.example.ecommerce.dto.CartItemDTO;
import com.example.ecommerce.dto.OrderDTO;
import com.example.ecommerce.exception.EntityNotFoundException;
import com.example.ecommerce.exception.InsufficientStockException;
import com.example.ecommerce.exception.ValidationException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Shopping cart: every add/update checks the product stock. Stock is only decremented at checkout (order creation).
 */
@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderService orderService;

    public CartDTO getCart(String userId) {
        ensureUserExists(userId);
        return toDTO(findOrCreateCart(userId));
    }

    /**
     * Adds `quantity` pieces of a product to the user's cart (or increases the quantity if it's already there).
     */
    public CartDTO addItem(String userId, String productId, Long quantity) {
        ensureUserExists(userId);
        if (productId == null || productId.isBlank()) {
            throw new ValidationException("productId is required");
        }
        long toAdd = quantity == null ? 1 : quantity;
        if (toAdd < 1) {
            throw new ValidationException("Quantity must be at least 1");
        }
        ProductEntity product = findProduct(productId);
        CartEntity cart = findOrCreateCart(userId);

        long alreadyInCart = cart.findItem(productId).map(CartItem::getQuantity).orElse(0L);
        long newQuantity = alreadyInCart + toAdd;
        checkStock(product, newQuantity);

        cart.findItem(productId).ifPresentOrElse(
                item -> item.setQuantity(newQuantity),
                () -> cart.getItems().add(new CartItem(productId, newQuantity)));
        return save(cart);
    }

    /**
     * Sets the quantity of a product already in the cart. Quantity 0 removes it.
     */
    public CartDTO updateItemQuantity(String userId, String productId, Long quantity) {
        ensureUserExists(userId);
        if (quantity == null || quantity < 0) {
            throw new ValidationException("Quantity must be 0 or more");
        }
        CartEntity cart = findOrCreateCart(userId);
        CartItem item = cart.findItem(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product " + productId + " in cart"));

        if (quantity == 0) {
            cart.removeItem(productId);
        } else {
            checkStock(findProduct(productId), quantity);
            item.setQuantity(quantity);
        }
        return save(cart);
    }

    public CartDTO removeItem(String userId, String productId) {
        ensureUserExists(userId);
        CartEntity cart = findOrCreateCart(userId);
        if (cart.findItem(productId).isEmpty()) {
            throw new EntityNotFoundException("Product " + productId + " in cart");
        }
        cart.removeItem(productId);
        return save(cart);
    }

    public CartDTO clearCart(String userId) {
        ensureUserExists(userId);
        CartEntity cart = findOrCreateCart(userId);
        cart.getItems().clear();
        return save(cart);
    }

    /**
     * Turns the cart into an order (stock is re-checked and decremented by OrderService), then empties the cart.
     */
    public OrderDTO checkout(String userId) {
        UserEntity user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException(userId));
        CartEntity cart = findOrCreateCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new ValidationException("Cart is empty");
        }

        List<ProductOrderEntity> productOrders = new ArrayList<>();
        for (CartItem item : cart.getItems()) {
            ProductEntity product = findProduct(item.getProductId());
            productOrders.add(new ProductOrderEntity(null, product, Math.toIntExact(item.getQuantity()), LocalDateTime.now()));
        }

        OrderDTO order = orderService.createOrder(user, productOrders, "PENDING");
        cart.getItems().clear();
        save(cart);
        return order;
    }

    private void checkStock(ProductEntity product, long requested) {
        long stock = product.getStock() == null ? 0 : product.getStock();
        if (requested > stock) {
            throw new InsufficientStockException(product.getId(), product.getName(), stock, requested);
        }
    }

    private void ensureUserExists(String userId) {
        if (userId == null || !userRepository.existsById(userId)) {
            throw new EntityNotFoundException(userId);
        }
    }

    private ProductEntity findProduct(String productId) {
        return productRepository.findById(productId).orElseThrow(() -> new EntityNotFoundException(productId));
    }

    private CartEntity findOrCreateCart(String userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> new CartEntity(userId));
    }

    private CartDTO save(CartEntity cart) {
        cart.setUpdatedAt(new Date());
        return toDTO(cartRepository.save(cart));
    }

    private CartDTO toDTO(CartEntity cart) {
        List<CartItemDTO> items = new ArrayList<>();
        for (CartItem item : cart.getItems()) {
            // A product deleted from the catalog after being added to the cart is shown as unavailable.
            ProductEntity product = productRepository.findById(item.getProductId()).orElse(null);
            if (product == null) {
                items.add(new CartItemDTO(item.getProductId(), null, 0, item.getQuantity(), 0));
            } else {
                items.add(new CartItemDTO(product.getId(), product.getName(),
                        product.getPrice() == null ? 0 : product.getPrice(),
                        item.getQuantity(),
                        product.getStock() == null ? 0 : product.getStock()));
            }
        }
        return new CartDTO(cart.getId(), cart.getUserId(), items, cart.getUpdatedAt());
    }
}
