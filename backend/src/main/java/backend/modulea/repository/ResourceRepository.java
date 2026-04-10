package backend.modulea.repository;

import backend.modulea.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Integer> {
    
    // ✅ Check if a resource name exists (excluding the current resource)
    boolean existsByNameAndResourcesIdNot(String name, Integer excludeId);
    
    // Optional: Other useful query methods
    Optional<Resource> findByName(String name);
    List<Resource> findByStatus(String status);
    List<Resource> findByType(String type);
    List<Resource> findByCategory(backend.modulea.model.ResourceCategory category);
    List<Resource> findByIsBookableTrue();
}
