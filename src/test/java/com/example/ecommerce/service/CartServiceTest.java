package com.example.ecommerce.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import com.example.ecommerce.data.CartEntity;
import com.example.ecommerce.data.CartItem;
import com.example.ecommerce.data.CartRepository;
import com.example.ecommerce.data.ProductEntity;
import com.example.ecommerce.data.ProductRepository;
import com.example.ecommerce.data.UserEntity;
import com.example.ecommerce.data.UserRepository;
import com.example.ecommerce.dto.CartDTO;
import com.example.ecommerce.exception.EntityNotFoundException;
import com.example.ecommerce.exception.InsufficientStockException;
import com.example.ecommerce.exception.ValidationException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CartServiceTest {

    private static final String USER_ID = "u1";
    private static final String PRODUCT_ID = "p1";

    @Mock
    private CartRepository cartRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private CartService cartService;

    private ProductEntity product;

    @BeforeEach
    void setUp() {
        product = new ProductEntity("Laptop", PRODUCT_ID, "A laptop", 3000L, 5L, null);
        when(userRepository.existsById(USER_ID)).thenReturn(true);
        when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
        when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
        when(cartRepository.save(any(CartEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void addItem_inStock_addsProductWithTotals() {
        CartDTO cart = cartService.addItem(USER_ID, PRODUCT_ID, 2L);

        assertEquals(1, cart.getItems().size());
        assertEquals("Laptop", cart.getItems().get(0).getName());
        assertEquals(2, cart.getItems().get(0).getQuantity());
        assertEquals(6000, cart.getTotalPrice());
        assertEquals(2, cart.getTotalItems());
    }

    @Test
    void addItem_defaultQuantityIsOne() {
        assertEquals(1, cartService.addItem(USER_ID, PRODUCT_ID, null).getTotalItems());
    }

    @Test
    void addItem_moreThanStock_throwsInsufficientStock() {
        InsufficientStockException ex = assertThrows(InsufficientStockException.class,
                () -> cartService.addItem(USER_ID, PRODUCT_ID, 6L));

        assertEquals(5, ex.getAvailable());
        verify(cartRepository, never()).save(any());
    }

    @Test
    void addItem_outOfStock_throwsInsufficientStock() {
        product.setStock(0L);

        assertThrows(InsufficientStockException.class, () -> cartService.addItem(USER_ID, PRODUCT_ID, 1L));
    }

    @Test
    void addItem_alreadyInCart_countsExistingQuantityAgainstStock() {
        CartEntity existing = new CartEntity(USER_ID);
        existing.getItems().add(new CartItem(PRODUCT_ID, 4));
        when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(existing));

        assertThrows(InsufficientStockException.class, () -> cartService.addItem(USER_ID, PRODUCT_ID, 2L));

        CartDTO cart = cartService.addItem(USER_ID, PRODUCT_ID, 1L);
        assertEquals(5, cart.getItems().get(0).getQuantity());
    }

    @Test
    void addItem_invalidQuantity_throwsValidation() {
        assertThrows(ValidationException.class, () -> cartService.addItem(USER_ID, PRODUCT_ID, 0L));
    }

    @Test
    void addItem_unknownProduct_throwsNotFound() {
        assertThrows(EntityNotFoundException.class, () -> cartService.addItem(USER_ID, "missing", 1L));
    }

    @Test
    void addItem_unknownUser_throwsNotFound() {
        assertThrows(EntityNotFoundException.class, () -> cartService.addItem("ghost", PRODUCT_ID, 1L));
    }

    @Test
    void updateItemQuantity_zeroRemovesItem() {
        CartEntity existing = new CartEntity(USER_ID);
        existing.getItems().add(new CartItem(PRODUCT_ID, 2));
        when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(existing));

        assertTrue(cartService.updateItemQuantity(USER_ID, PRODUCT_ID, 0L).getItems().isEmpty());
    }

    @Test
    void updateItemQuantity_aboveStock_throwsInsufficientStock() {
        CartEntity existing = new CartEntity(USER_ID);
        existing.getItems().add(new CartItem(PRODUCT_ID, 2));
        when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(existing));

        assertThrows(InsufficientStockException.class, () -> cartService.updateItemQuantity(USER_ID, PRODUCT_ID, 10L));
    }

    @Test
    void checkout_createsOrderAndEmptiesCart() {
        CartEntity existing = new CartEntity(USER_ID);
        existing.getItems().add(new CartItem(PRODUCT_ID, 2));
        when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(existing));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(new UserEntity("ana", "Parola1", "a@b.com")));

        cartService.checkout(USER_ID);

        verify(orderService).createOrder(any(UserEntity.class), anyList(), eq("PENDING"));
        assertTrue(existing.getItems().isEmpty());
    }

    @Test
    void checkout_emptyCart_throwsValidation() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(new UserEntity("ana", "Parola1", "a@b.com")));

        assertThrows(ValidationException.class, () -> cartService.checkout(USER_ID));
        verifyNoInteractions(orderService);
    }
}
