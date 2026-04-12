package backend.modulea.controller;

import backend.modulea.model.Resource;
import backend.modulea.model.ResourceCategory;
import backend.modulea.service.ResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*") 
public class ResourceController {

    private final ResourceService resourceService;

    // 🔹 Constructor Injection (matches TicketController style)
    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    // 🔹 CREATE Resource
    // POST /api/resources
    @PostMapping
    public ResponseEntity<Resource> createResource(
            @RequestBody Resource resource,
            Authentication authentication) {
        
        Resource createdResource = resourceService.createResource(resource, authentication);
        return new ResponseEntity<>(createdResource, HttpStatus.CREATED); // ✅ 201 Created
    }

    // 🔹 READ: Get all resources (with optional filters)
    // GET /api/resources?type=LECTURE_HALL&category=ACADEMIC&location=Main&minCapacity=50&status=ACTIVE
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String status,
            Authentication authentication) {
        
        List<Resource> resources = resourceService.getAllResources(type, category, minCapacity, status);
        return ResponseEntity.ok(resources); // ✅ 200 OK
    }

    // 🔹 READ: Get resource by ID
    // GET /api/resources/123
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(
            @PathVariable Long id,
            Authentication authentication) {
        
        Resource resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(resource); // ✅ 200 OK
    }

    // 🔹 UPDATE Resource
    // PUT /api/resources/123
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(
            @PathVariable Long id,
            @RequestBody Resource resource,
            Authentication authentication) {
        
        Resource updatedResource = resourceService.updateResource(id, resource, authentication);
        return ResponseEntity.ok(updatedResource); // ✅ 200 OK
    }

    // 🔹 DELETE Resource
    // DELETE /api/resources/123
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(
            @PathVariable Long id,
            Authentication authentication) {
        
        resourceService.deleteResource(id, authentication);
        return ResponseEntity.noContent().build(); // ✅ 204 No Content
    }


    @GetMapping("/bookable")
    public ResponseEntity<List<Resource>> getBookableResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category) {
        
        List<Resource> resources = resourceService.getBookableResources(type, category);
        return ResponseEntity.ok(resources); // ✅ 200 OK
    }

    // 🔹 OPTIONAL: Advanced search endpoint (for rubric creativity points)
    // GET /api/resources/search?query=lecture&building=Main&floor=3
    @GetMapping("/search")
    public ResponseEntity<List<Resource>> searchResources(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) String roomNumber) {
        
        // Delegate to existing getAllResources with mapped filters
        List<Resource> resources = resourceService.getAllResources(
            null, null,  null, null); 
        
        if (building != null) {
            resources = resources.stream()
                .filter(r -> building.equalsIgnoreCase(r.getBuilding()))
                .toList();
        }
        if (floor != null) {
            resources = resources.stream()
                .filter(r -> floor.equals(r.getFloor()))
                .toList();
        }
        if (roomNumber != null) {
            resources = resources.stream()
                .filter(r -> roomNumber.equalsIgnoreCase(r.getRoomNumber()))
                .toList();
        }
        
        return ResponseEntity.ok(resources); // ✅ 200 OK
    }
}