package in.rastrith.ecommerce.order.repository;

import in.rastrith.ecommerce.order.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

  Optional<Order> findByIdempotencyKey(String idempotencyKey);

  Optional<Order> findByOrderNumber(String orderNumber);
}
