package backend.modulea.controller;

import backend.modulea.dto.ResourceRequestDTO;
import backend.modulea.dto.ResourceResponseDTO;
import backend.modulea.service.ResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController("moduleaResourceController")
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    // ================= CREATE =================
    @PostMapping
    public ResponseEntity<ResourceResponseDTO> createResource(
            @RequestBody ResourceRequestDTO dto,
            Authentication authentication) {

        ResourceResponseDTO created = resourceService.createResource(dto, authentication);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // ================= GET ALL =================
    @GetMapping
    public ResponseEntity<List<ResourceResponseDTO>> getAllResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String status,
            Authentication authentication) {

        List<ResourceResponseDTO> resources =
                resourceService.getAllResources(type, category, minCapacity, status);

        return ResponseEntity.ok(resources);
    }

    // ================= GET BY ID =================
    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getResourceById(
            @PathVariable Long id,
            Authentication authentication) {

        ResourceResponseDTO resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(resource);
    }

    // ================= UPDATE =================
    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> updateResource(
            @PathVariable Long id,
            @RequestBody ResourceRequestDTO dto,
            Authentication authentication) {

        ResourceResponseDTO updated =
                resourceService.updateResource(id, dto, authentication);

        return ResponseEntity.ok(updated);
    }

    // ================= DELETE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(
            @PathVariable Long id,
            Authentication authentication) {

        resourceService.deleteResource(id, authentication);
        return ResponseEntity.noContent().build();
    }

    // ================= BOOKABLE =================
    @GetMapping("/bookable")
    public ResponseEntity<List<ResourceResponseDTO>> getBookableResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category) {

        List<ResourceResponseDTO> resources =
                resourceService.getBookableResources(type, category);

        return ResponseEntity.ok(resources);
    }

    // ================= SEARCH =================
    @GetMapping("/search")
    public ResponseEntity<List<ResourceResponseDTO>> searchResources(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) String roomNumber) {

        List<ResourceResponseDTO> resources =
                resourceService.getAllResources(null, null, null, null);

        if (building != null) {
            resources = resources.stream()
                    .filter(r -> r.getBuilding() != null &&
                            building.equalsIgnoreCase(r.getBuilding()))
                    .toList();
        }

        if (floor != null) {
            resources = resources.stream()
                    .filter(r -> r.getFloor() != null &&
                            floor.equals(r.getFloor()))
                    .toList();
        }

        if (roomNumber != null) {
            resources = resources.stream()
                    .filter(r -> r.getRoomNumber() != null &&
                            roomNumber.equalsIgnoreCase(r.getRoomNumber()))
                    .toList();
        }

        return ResponseEntity.ok(resources);
    }
}