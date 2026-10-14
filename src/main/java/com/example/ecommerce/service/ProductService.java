package com.example.ecommerce.service;

import com.example.ecommerce.data.ProductEntity;
import com.example.ecommerce.data.ProductRepository;
import com.example.ecommerce.data.CategoryEntity;
import com.example.ecommerce.data.CategoryRepository;
import com.example.ecommerce.data.OrderRepository;
import com.example.ecommerce.dto.ProductDTO;
import com.example.ecommerce.exception.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.ecommerce.exception.ValidationException;
import com.example.ecommerce.dto.StockDTO;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    public ProductDTO getProductById(String id) throws EntityNotFoundException {
        Optional<ProductEntity> optionalProduct = productRepository.findById(id);
        ProductEntity product = optionalProduct.orElseThrow(() -> new EntityNotFoundException(id));
        return toDTO(product);
    }

    public List<ProductDTO> getProductsByCategory(String categoryId) {
        List<ProductEntity> products = productRepository.findByCategoryId(categoryId);
        return products.stream()
        .map(product -> toDTO(product))
                .collect(Collectors.toList());
    }

    public List<ProductDTO> getAllProducts() {
        List<ProductEntity> products = productRepository.findAll();
        return products.stream()
                .map(product -> toDTO(product))
                .collect(Collectors.toList());
    }

    public List<ProductDTO> getTopMostOrderedProducts(int limit) {
        Map<ProductDTO, Long> productOrderCounts = orderRepository.findAll().stream()
            .flatMap(order -> order.getProductOrders().stream()) // Assuming OrderEntity has a getProductOrders() method
            .map(productOrder -> {
                ProductEntity product = productOrder.getProduct();
                return toDTO(product);
            })
            .collect(Collectors.groupingBy(product -> product, Collectors.counting()));
    
        return productOrderCounts.entrySet().stream()
            .sorted((entry1, entry2) -> Long.compare(entry2.getValue(), entry1.getValue()))
            .limit(limit)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }

    public ProductDTO saveProduct(ProductDTO productDTO) throws EntityNotFoundException {
        if (productDTO.getDescription() == null || productDTO.getDescription().isEmpty()) {
            throw new ValidationException("Product description is mandatory.");
        }
        if (productDTO.getPrice() == null || productDTO.getPrice() <= 0) {
            throw new ValidationException("Product price must be greater than zero.");
        }
        if (productDTO.getStock() == null || productDTO.getStock() < 0) {
            throw new ValidationException("Product stock cannot be negative.");
        }
    
        CategoryEntity category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + productDTO.getCategoryId()));
    
        ProductEntity product = new ProductEntity(
                productDTO.getName(),
                productDTO.getDescription(),
                productDTO.getPrice(),
                productDTO.getStock(),
                category
        );
        productRepository.save(product);
        return toDTO(product);
    }

    public List<ProductDTO> saveAll(List<ProductDTO> productDTOs) {
        List<ProductEntity> products = productDTOs.stream()
                .map(dto -> {
                    if (dto.getDescription() == null || dto.getDescription().isEmpty()) {
                        throw new ValidationException("Product description is mandatory.");
                    }
                    if (dto.getPrice() == null || dto.getPrice() <= 0) {
                        throw new ValidationException("Product price must be greater than zero.");
                    }
                    if (dto.getStock() == null || dto.getStock() < 0) {
                        throw new ValidationException("Product stock cannot be negative.");
                    }
    
                    CategoryEntity category = categoryRepository.findById(dto.getCategoryId())
                            .orElseThrow(() -> new RuntimeException("Category not found: " + dto.getCategoryId()));
    
                    return new ProductEntity(
                            dto.getName(),
                            dto.getDescription(),
                            dto.getPrice(),
                            dto.getStock(),
                            category
                    );
                })
                .collect(Collectors.toList());
    
        List<ProductEntity> savedProducts = productRepository.saveAll(products);
    
        return savedProducts.stream()
                .map(product -> toDTO(product))
                .collect(Collectors.toList());
    }

    public ProductDTO updateProduct(String id, ProductDTO productDTO) throws EntityNotFoundException {
        ProductEntity product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(id));

        CategoryEntity category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + productDTO.getCategoryId()));

        if (productDTO.getName() != null) {
            product.setName(productDTO.getName());
        }
        product.setDescription(productDTO.getDescription());
        product.setPrice(productDTO.getPrice());
        product.setStock(productDTO.getStock());
        product.setCategory(category);
        productRepository.save(product);

        return toDTO(product);
    }

    public void deleteProduct(String id) throws EntityNotFoundException {
        ProductEntity product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));
    
        productRepository.delete(product);
    }
    

    /**
     * Stock check for the front-end: is the product in stock, and can the given quantity be bought?
     */
    public StockDTO checkStock(String id, long quantity) throws EntityNotFoundException {
        if (quantity < 1) {
            throw new ValidationException("Quantity must be at least 1.");
        }
        ProductEntity product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(id));
        long stock = product.getStock() == null ? 0 : product.getStock();
        return new StockDTO(product.getId(), stock, stock > 0, quantity, stock >= quantity);
    }

    private static ProductDTO toDTO(ProductEntity product) {
        return new ProductDTO(product.getId(), product.getName(), product.getDescription(), product.getPrice(),
                product.getStock(), product.getCategory() != null ? product.getCategory().getId() : null);
    }
}
