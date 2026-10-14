package com.example.ecommerce.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.example.ecommerce.data.CartRepository;
import com.example.ecommerce.data.OrderRepository;
import com.example.ecommerce.data.ProductEntity;
import com.example.ecommerce.data.ProductOrderRepository;
import com.example.ecommerce.data.ProductRepository;
import com.example.ecommerce.data.UserRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Tag("IntegrationTest")
public class AuthAndCartIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductOrderRepository productOrderRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void cleanDatabase() {
        cartRepository.deleteAll();
        orderRepository.deleteAll();
        productOrderRepository.deleteAll();
        productRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String signup(String username, String email, String password) throws Exception {
        String body = mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson(username, email, password)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asText();
    }

    private static String signupJson(String username, String email, String password) {
        return "{\"username\":\"" + username + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    private static String loginJson(String username, String password) {
        return "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
    }

    @Test
    public void signupThenLogin() throws Exception {
        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("ana", "ana@example.com", "Parola1")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.username").value("ana"))
                .andExpect(jsonPath("$.email").value("ana@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("ana", "Parola1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("ana"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("ana@example.com", "Parola1")))
                .andExpect(status().isOk());
    }

    @Test
    public void signupErrors() throws Exception {
        signup("ana", "ana@example.com", "Parola1");

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("ana", "other@example.com", "Parola1")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").isNotEmpty());

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("maria", "ana@example.com", "Parola1")))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("maria", "maria@example.com", "weak")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("maria", "not-an-email", "Parola1")))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void loginWithWrongPassword_returns401() throws Exception {
        signup("ana", "ana@example.com", "Parola1");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("ana", "Gresit1")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid credentials"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("nobody", "Parola1")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void stockCheck() throws Exception {
        ProductEntity product = productRepository.save(new ProductEntity("Phone", "A phone", 1000L, 3L, null));

        mockMvc.perform(get("/products/" + product.getId() + "/stock").param("quantity", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inStock").value(true))
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.stock").value(3));

        mockMvc.perform(get("/products/" + product.getId() + "/stock").param("quantity", "4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    public void addToCartChecksStock_andCheckoutDecrementsIt() throws Exception {
        String userId = signup("ana", "ana@example.com", "Parola1");
        ProductEntity product = productRepository.save(new ProductEntity("Phone", "A phone", 1000L, 3L, null));
        String cartUrl = "/carts/user/" + userId;

        mockMvc.perform(get(cartUrl))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));

        mockMvc.perform(post(cartUrl + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + product.getId() + "\",\"quantity\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].name").value("Phone"))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.totalPrice").value(2000));

        // 2 already in cart + 2 more > 3 in stock
        mockMvc.perform(post(cartUrl + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + product.getId() + "\",\"quantity\":2}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.available").value(3));

        mockMvc.perform(put(cartUrl + "/items/" + product.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(3));

        mockMvc.perform(post(cartUrl + "/checkout"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));

        mockMvc.perform(get(cartUrl))
                .andExpect(jsonPath("$.items.length()").value(0));

        assertEquals(0L, productRepository.findById(product.getId()).orElseThrow().getStock());

        mockMvc.perform(post(cartUrl + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + product.getId() + "\",\"quantity\":1}"))
                .andExpect(status().isConflict());
    }

    @Test
    public void cartForUnknownUser_returns404() throws Exception {
        mockMvc.perform(get("/carts/user/does-not-exist"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void corsAllowsFrontendOrigin() throws Exception {
        mockMvc.perform(options("/auth/login")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }
}
