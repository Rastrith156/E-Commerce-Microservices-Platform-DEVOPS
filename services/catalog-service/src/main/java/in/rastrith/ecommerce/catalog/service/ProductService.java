package in.rastrith.ecommerce.catalog.service;

import in.rastrith.ecommerce.catalog.dto.CreateProductRequest;
import in.rastrith.ecommerce.catalog.dto.ProductResponse;
import in.rastrith.ecommerce.catalog.model.Product;
import in.rastrith.ecommerce.catalog.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {

  private final ProductRepository productRepository;

  public ProductService(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  public Page<ProductResponse> findAll(Pageable pageable) {
    return productRepository.findAll(pageable)
        .map(this::toResponse);
  }

  public Optional<ProductResponse> findById(Long id) {
    return productRepository.findById(id).map(this::toResponse);
  }

  @Transactional
  public ProductResponse create(CreateProductRequest request) {
    Product product = new Product();
    product.setName(request.name());
    product.setDescription(request.description());
    product.setPrice(request.price());
    product.setCurrency(request.currency() != null ? request.currency() : "INR");
    product.setStock(request.stock() != null ? request.stock() : 0);
    product.setImageUrl(request.imageUrl());
    Product saved = productRepository.save(product);
    return toResponse(saved);
  }

  @Transactional
  public Optional<ProductResponse> updateStock(Long id, Integer stock) {
    return productRepository.findById(id)
        .map(product -> {
          product.setStock(stock);
          product.setUpdatedAt(java.time.Instant.now());
          return productRepository.save(product);
        })
        .map(this::toResponse);
  }

  private ProductResponse toResponse(Product product) {
    return new ProductResponse(
        product.getId(),
        product.getName(),
        product.getDescription(),
        product.getPrice(),
        product.getCurrency(),
        product.getStock(),
        product.getImageUrl(),
        product.getCreatedAt(),
        product.getUpdatedAt()
    );
  }
}
