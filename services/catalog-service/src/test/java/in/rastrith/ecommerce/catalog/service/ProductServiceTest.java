package in.rastrith.ecommerce.catalog.service;

import in.rastrith.ecommerce.catalog.dto.CreateProductRequest;
import in.rastrith.ecommerce.catalog.dto.ProductResponse;
import in.rastrith.ecommerce.catalog.model.Product;
import in.rastrith.ecommerce.catalog.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

  @Mock
  private ProductRepository productRepository;

  @InjectMocks
  private ProductService productService;

  @Test
  void createProductShouldSaveAndReturnResponse() {
    CreateProductRequest request = new CreateProductRequest(
        "Test Product",
        "A test product",
        new BigDecimal("99.99"),
        "INR",
        10,
        "http://example.com/image.jpg"
    );

    Product saved = new Product();
    saved.setId(1L);
    saved.setName(request.name());
    saved.setDescription(request.description());
    saved.setPrice(request.price());
    saved.setCurrency(request.currency());
    saved.setStock(request.stock());
    saved.setImageUrl(request.imageUrl());

    when(productRepository.save(org.mockito.ArgumentMatchers.any(Product.class)))
        .thenReturn(saved);

    ProductResponse response = productService.create(request);

    assertThat(response.id()).isEqualTo(1L);
    assertThat(response.name()).isEqualTo("Test Product");
    assertThat(response.price()).isEqualByComparingTo("99.99");
    assertThat(response.stock()).isEqualTo(10);
    verify(productRepository).save(org.mockito.ArgumentMatchers.any(Product.class));
  }

  @Test
  void findByIdShouldReturnProductWhenExists() {
    Product product = new Product();
    product.setId(1L);
    product.setName("Test Product");

    when(productRepository.findById(1L)).thenReturn(Optional.of(product));

    Optional<ProductResponse> response = productService.findById(1L);

    assertThat(response).isPresent();
    assertThat(response.get().name()).isEqualTo("Test Product");
  }

  @Test
  void findByIdShouldReturnEmptyWhenNotExists() {
    when(productRepository.findById(999L)).thenReturn(Optional.empty());

    Optional<ProductResponse> response = productService.findById(999L);

    assertThat(response).isEmpty();
  }
}
