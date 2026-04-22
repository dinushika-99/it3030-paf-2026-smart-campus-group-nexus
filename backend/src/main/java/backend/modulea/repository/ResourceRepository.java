package backend.modulea.repository;

import backend.modulea.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    // Find resources by type
    List<Resource> findByType(String type);

    // Find available resources
    List<Resource> findByIsAvailableTrue();

    // Find resources by type and availability
    List<Resource> findByTypeAndIsAvailableTrue(String type);

    // Find resource by name
    Optional<Resource> findByName(String name);

    // Check if resource exists by name
    boolean existsByName(String name);
}
