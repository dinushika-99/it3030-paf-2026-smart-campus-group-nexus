package backend.modulea.service;

import backend.modulea.model.ResourceCategory;
import backend.modulea.model.Resource;
import backend.modulea.repository.ResourceRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.*;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    // 🔹 Static Mapping: Category → Allowed Types (enforces business rule)
    private static final Map<ResourceCategory, Set<String>> ALLOWED_TYPES = Map.of(
        ResourceCategory.ACADEMIC,       Set.of("LECTURE_HALL", "LABORATORY", "COMPUTER_LAB", "DESIGN_STUDIO", "STUDY_ROOM"),
        ResourceCategory.SPORTS,         Set.of("SWIMMING_POOL", "TENNIS_COURT", "FOOTBALL_FIELD", "BASKETBALL_COURT", "GYM"),
        ResourceCategory.COMMON,         Set.of("AUDITORIUM", "LIBRARY", "CANTEEN", "OPEN_GROUND", "PARKING_LOT"),
        ResourceCategory.ADMINISTRATIVE, Set.of("OFFICE", "MEETING_ROOM", "CONFERENCE_ROOM", "RECEPTION"),
        ResourceCategory.EQUIPMENT,      Set.of("PROJECTOR", "VIDEO_CAMERA", "LAPTOP_SET", "AUDIO_SYSTEM", "MICROPHONE")
    );

    // 🔹 Constructor Injection (matches TicketService style)
    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    // 🔹 CREATE Resource
    public Resource createResource(Resource resource, Authentication authentication) {
        // ✅ Validate Category → Type hierarchy
        validateTypeCategoryMatch(resource.getCategory(), resource.getType());

        // ✅ Normalize and validate status
        normalizeAndValidateResource(resource);

        // ✅ Set defaults if not provided
        if (resource.getDailyOpenTime() == null) {
            resource.setDailyOpenTime(LocalTime.of(8, 0));
        }
        if (resource.getDailyCloseTime() == null) {
            resource.setDailyCloseTime(LocalTime.of(18, 0));
        }
        if (resource.getStatus() == null || resource.getStatus().isBlank()) {
            resource.setStatus("ACTIVE");
        }
        if (resource.getIsBookable() == null) {
            resource.setIsBookable(true);
        }

        try {
            return resourceRepository.save(resource);
        } catch (DataIntegrityViolationException ex) {
            if (ex.getRootCause() != null && ex.getRootCause().getMessage().contains("Duplicate entry")) {
                throw new ResponseStatusException(CONFLICT, "Resource with name '" + resource.getName() + "' already exists", ex);
            }
            throw new ResponseStatusException(BAD_REQUEST, "Resource data violates database constraints", ex);
        }
    }

    // 🔹 READ: Get all resources (with optional filters)
    public List<Resource> getAllResources(String type, String category, Integer minCapacity, String status) {
        // Simple in-memory filtering (replace with JPA Specifications for production)
        List<Resource> resources = resourceRepository.findAll();
        
        return resources.stream()
            .filter(r -> type == null || r.getType().equalsIgnoreCase(type))
            .filter(r -> category == null || r.getCategory().name().equalsIgnoreCase(category))
            .filter(r -> minCapacity == null || r.getCapacity() >= minCapacity)
            .filter(r -> status == null || r.getStatus().equalsIgnoreCase(status))
            .toList();
    }

    // 🔹 READ: Get resource by ID
    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Resource not found with id: " + id));
    }

    // 🔹 UPDATE Resource
    public Resource updateResource(Long id, Resource updatedResource, Authentication authentication) {
        Resource existingResource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Resource not found with id: " + id));

        validateTypeCategoryMatch(updatedResource.getCategory(), updatedResource.getType());

        normalizeAndValidateResource(updatedResource);

        if (updatedResource.getName() != null && !updatedResource.getName().isBlank()) {
            if (resourceRepository.existsByNameAndResourcesIdNot(
                    updatedResource.getName(), id)) {  
                throw new ResponseStatusException(CONFLICT, 
                    "Resource with name '" + updatedResource.getName() + "' already exists");
            }
            existingResource.setName(updatedResource.getName());
        }
        if (updatedResource.getType() != null) 
            existingResource.setType(updatedResource.getType().toUpperCase());

        if (updatedResource.getCategory() != null) 
            existingResource.setCategory(updatedResource.getCategory());

        if (updatedResource.getCapacity() != null) 
            existingResource.setCapacity(updatedResource.getCapacity());

        if (updatedResource.getStatus() != null) 
            existingResource.setStatus(updatedResource.getStatus().toUpperCase());

        if (updatedResource.getDailyOpenTime() != null) 
            existingResource.setDailyOpenTime(updatedResource.getDailyOpenTime());

        if (updatedResource.getDailyCloseTime() != null) 
            existingResource.setDailyCloseTime(updatedResource.getDailyCloseTime());

        if (updatedResource.getDescription() != null) 
            existingResource.setDescription(updatedResource.getDescription());

        if (updatedResource.getImageUrl() != null) 
            existingResource.setImageUrl(updatedResource.getImageUrl());

        if (updatedResource.getIsBookable() != null) 
            existingResource.setIsBookable(updatedResource.getIsBookable());

        if (updatedResource.getBuilding() != null) 
            existingResource.setBuilding(updatedResource.getBuilding());

        if (updatedResource.getFloor() != null) 
            existingResource.setFloor(updatedResource.getFloor());

        if (updatedResource.getRoomNumber() != null) 
            existingResource.setRoomNumber(updatedResource.getRoomNumber());

        if (updatedResource.getAreaName() != null) 
            existingResource.setAreaName(updatedResource.getAreaName());

        try {
            return resourceRepository.save(existingResource);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Resource update violates database constraints", ex);
        }
    }

    // 🔹 DELETE Resource
    public void deleteResource(Long id, Authentication authentication) {
        Resource existingResource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Resource not found with id: " + id));

        // Optional: Add admin-only check here if needed
        // if (!isAdmin(authentication)) {
        //     throw new ResponseStatusException(FORBIDDEN, "Only admins can delete resources");
        // }

        resourceRepository.delete(existingResource);
    }

    // 🔹 SEARCH: Find bookable resources
    public List<Resource> getBookableResources(String type, String category) {
        return resourceRepository.findAll().stream()
            .filter(Resource::getIsBookable)
            .filter(r -> r.getStatus().equalsIgnoreCase("ACTIVE"))
            .filter(r -> type == null || r.getType().equalsIgnoreCase(type))
            .filter(r -> category == null || r.getCategory().name().equalsIgnoreCase(category))
            .toList();
    }

    // 🔹 Helper: Validate Category → Type mapping
    private void validateTypeCategoryMatch(ResourceCategory category, String type) {
        if (category == null || type == null || type.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Category and Type cannot be null or empty");
        }

        Set<String> allowedTypes = ALLOWED_TYPES.get(category);
        String normalizedType = type.trim().toUpperCase();

        if (allowedTypes == null || !allowedTypes.contains(normalizedType)) {
            throw new ResponseStatusException(BAD_REQUEST, 
                "Type '" + type + "' is not allowed for category '" + category + "'. " +
                "Allowed types: " + ALLOWED_TYPES.getOrDefault(category, Collections.emptySet()));
        }
    }

    // 🔹 Helper: Normalize and validate resource fields
    private void normalizeAndValidateResource(Resource resource) {
        // Normalize strings
        if (resource.getType() != null) resource.setType(resource.getType().trim().toUpperCase());
        if (resource.getStatus() != null) resource.setStatus(resource.getStatus().trim().toUpperCase());

        // Validate status values
        if (resource.getStatus() != null && 
            !resource.getStatus().equals("ACTIVE") && 
            !resource.getStatus().equals("OUT_OF_SERVICE")) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid status. Must be ACTIVE or OUT_OF_SERVICE");
        }

        // Validate time logic
        if (resource.getDailyOpenTime() != null && resource.getDailyCloseTime() != null) {
            if (resource.getDailyOpenTime().isAfter(resource.getDailyCloseTime())) {
                throw new ResponseStatusException(BAD_REQUEST, "Daily open time cannot be after daily close time");
            }
        }

        // Validate capacity
        if (resource.getCapacity() != null && resource.getCapacity() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Capacity must be greater than 0");
        }

        if (resource.getMaxBookingDurationHours() != null && resource.getMaxBookingDurationHours() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Max booking duration must be > 0");
        }

        if (resource.getMaxQuantity() != null && resource.getMaxQuantity() < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "Max quantity must be >= 1");
        }

        // Validate indoor/outdoor location rules
        if (resource.getBuilding() != null && !resource.getBuilding().isBlank()) {
            // Indoor resource: must have floor and room number
            if (resource.getFloor() == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Indoor resources must have a floor number");
            }
            if (resource.getRoomNumber() == null || resource.getRoomNumber().isBlank()) {
                throw new ResponseStatusException(BAD_REQUEST, "Indoor resources must have a room number");
            }
        } else {
            // Outdoor resource: must have area name or location
            if (resource.getAreaName() == null || resource.getAreaName().isBlank()) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "Outdoor resource needs area name");
            }
        }
    }

    
}