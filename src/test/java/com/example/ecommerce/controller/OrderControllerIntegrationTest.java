package com.example.ecommerce.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.example.ecommerce.data.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Tag("IntegrationTest")
public class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductOrderRepository productOrderRepository;

    @BeforeEach
    public void cleanDatabase() {
        orderRepository.deleteAll();
        userRepository.deleteAll();
        productRepository.deleteAll();
        productOrderRepository.deleteAll();
    }

    @Test
    public void testGetAllOrders_Empty() throws Exception {
        mockMvc.perform(get("/orders"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    public void testCreateOrderAndGetOrders() throws Exception {
        UserEntity user = userRepository.save(new UserEntity("john", "pass", "john@example.com"));
        ProductEntity product = productRepository.save(new ProductEntity("Book", "A good book", 30L, 50L, null));

        String orderJson = "{" +
                "\"userId\": \"" + user.getId() + "\"," +
                "\"status\": \"PENDING\"," +
                "\"productOrders\": [{\"productId\": \"" + product.getId() + "\", \"quantity\": 2}]" +
                "}";

        mockMvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.userId").value(user.getId()));

        mockMvc.perform(get("/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
