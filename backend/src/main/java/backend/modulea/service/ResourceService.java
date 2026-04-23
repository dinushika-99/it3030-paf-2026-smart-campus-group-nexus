package backend.modulea.service;

import backend.modulea.model.ResourceCategory;
import backend.modulea.model.Resource;
import backend.modulea.repository.ResourceRepository;
import backend.auth.repository.UserRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import backend.modulea.dto.ResourceRequestDTO;
import backend.modulea.dto.ResourceResponseDTO;
import backend.modulea.mapper.ResourceMapper;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.*;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    // 🔹 Static Mapping: Category → Allowed Types (enforces business rule)
    private static final Map<ResourceCategory, Set<String>> ALLOWED_TYPES = Map.of(
        ResourceCategory.ACADEMIC,       Set.of("LECTURE_HALL", "LABORATORY", "COMPUTER_LAB", "DESIGN_STUDIO", "STUDY_ROOM"),
        ResourceCategory.SPORTS,         Set.of("SWIMMING_POOL", "TENNIS_COURT", "FOOTBALL_FIELD", "BASKETBALL_COURT", "GYM"),
        ResourceCategory.COMMON,         Set.of("AUDITORIUM", "LIBRARY", "FOOD_AREA", "OPEN_SPACE", "PARKING_LOT"),
        ResourceCategory.ADMINISTRATIVE, Set.of("MEETING_ROOM", "CONFERENCE_ROOM"),
        ResourceCategory.EQUIPMENT,      Set.of("PROJECTOR", "VIDEO_CAMERA", "LAPTOP_SET", "AUDIO_SYSTEM", "MICROPHONE", "SPEAKER")
    );

    // 🔹 Constructor Injection (matches TicketService style)
    public ResourceService(ResourceRepository resourceRepository, UserRepository userRepository) {
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
    }

    // 🔹 CREATE Resource
    public ResourceResponseDTO createResource(ResourceRequestDTO dto, Authentication authentication) {

        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can create resources");
        }

        Resource resource = ResourceMapper.toEntity(dto);

        validateTypeCategoryMatch(resource.getCategory(), resource.getType());
        normalizeAndValidateResource(resource);

        if (resource.getDailyOpenTime() == null)
            resource.setDailyOpenTime(LocalTime.of(8, 0));

        if (resource.getDailyCloseTime() == null)
            resource.setDailyCloseTime(LocalTime.of(18, 0));

        if (resource.getStatus() == null || resource.getStatus().isBlank())
            resource.setStatus("ACTIVE");

        if (resource.getIsBookable() == null)
            resource.setIsBookable(true);

        try {
            Resource saved = resourceRepository.save(resource);
            return ResourceMapper.toDTO(saved);

        } catch (DataIntegrityViolationException ex) {
            if (ex.getRootCause() != null &&
                    ex.getRootCause().getMessage().contains("Duplicate entry")) {

                throw new ResponseStatusException(CONFLICT,
                        "Resource with name '" + resource.getName() + "' already exists", ex);
            }
            throw new ResponseStatusException(BAD_REQUEST,
                    "Database constraint violation", ex);
        }
    }

    // 🔹 READ: Get all resources (with optional filters)
    public List<ResourceResponseDTO> getAllResources(
            String type,
            String category,
            Integer minCapacity,
            String status
    ) {
        return resourceRepository.findAll().stream()
                .filter(r -> type == null || r.getType().equalsIgnoreCase(type))
                .filter(r -> category == null || r.getCategory().name().equalsIgnoreCase(category))
                .filter(r -> minCapacity == null || r.getCapacity() >= minCapacity)
                .filter(r -> status == null || r.getStatus().equalsIgnoreCase(status))
                .map(ResourceMapper::toDTO)
                .toList();
    }

    // 🔹 READ: Get resource by ID
    public ResourceResponseDTO getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND,
                        "Resource not found with id: " + id));

        return ResourceMapper.toDTO(resource);
    }

    // 🔹 UPDATE Resource
    public ResourceResponseDTO updateResource(
            Long id,
            ResourceRequestDTO dto,
            Authentication authentication
    ) {

        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can update resources");
        }

        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND,
                        "Resource not found with id: " + id));

        Resource updated = ResourceMapper.toEntity(dto);

        validateTypeCategoryMatch(updated.getCategory(), updated.getType());
        normalizeAndValidateResource(updated);

        updated.setResourcesId(existing.getResourcesId());

        Resource saved = resourceRepository.save(updated);

        return ResourceMapper.toDTO(saved);
    }

    // 🔹 DELETE Resource
    public void deleteResource(Long id, Authentication authentication) {
        Resource existing = resourceRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND,
                        "Resource not found with id: " + id));

        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can delete resources");
        }

        resourceRepository.delete(existing);
    }

    // 🔹 SEARCH: Find bookable resources
    public List<ResourceResponseDTO> getBookableResources(String type, String category) {
        return resourceRepository.findAll().stream()
                .filter(Resource::getIsBookable)
                .filter(r -> r.getStatus().equalsIgnoreCase("ACTIVE"))
                .filter(r -> type == null || r.getType().equalsIgnoreCase(type))
                .filter(r -> category == null || r.getCategory().name().equalsIgnoreCase(category))
                .map(ResourceMapper::toDTO)
                .toList();
    }

    // 🔹 Helper: Validate Category → Type mapping
    private void validateTypeCategoryMatch(ResourceCategory category, String type) {
        if (category == null || type == null || type.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Category and Type cannot be null or empty");
        }

        Set<String> allowed = ALLOWED_TYPES.get(category);
        String normalized = type.trim().toUpperCase();

        if (allowed == null || !allowed.contains(normalized)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Type '" + type + "' is not allowed for category '" + category + "'");
        }
    }

    // 🔹 Helper: Normalize and validate resource fields
    private void normalizeAndValidateResource(Resource resource) {

        if (resource.getType() != null)
            resource.setType(resource.getType().trim().toUpperCase());

        if (resource.getStatus() != null)
            resource.setStatus(resource.getStatus().trim().toUpperCase());

        // status validation
        if (resource.getStatus() != null &&
                !resource.getStatus().equals("ACTIVE") &&
                !resource.getStatus().equals("OUT_OF_SERVICE")) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Status must be ACTIVE or OUT_OF_SERVICE");
        }

        // time validation
        if (resource.getDailyOpenTime() != null && resource.getDailyCloseTime() != null &&
                resource.getDailyOpenTime().isAfter(resource.getDailyCloseTime())) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Open time cannot be after close time");
        }

        // capacity validation
        if (resource.getCapacity() != null && resource.getCapacity() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Capacity must be > 0");
        }

        // booking duration
        if (resource.getMaxBookingDurationHours() != null &&
                resource.getMaxBookingDurationHours() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Max booking duration must be > 0");
        }

        // quantity
        if (resource.getMaxQuantity() != null &&
                resource.getMaxQuantity() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Max quantity must be >= 1");
        }

        // indoor validation
        if (resource.getBuilding() != null && !resource.getBuilding().isBlank()) {
            if (resource.getFloor() == null) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "Indoor resource must have floor");
            }
            if (resource.getRoomNumber() == null || resource.getRoomNumber().isBlank()) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "Indoor resource must have room number");
            }
        } else {
            if (resource.getAreaName() == null || resource.getAreaName().isBlank()) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "Outdoor resource must have area name");
            }
        }
    }

    private boolean isAdmin(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
        return false;
    }

    Object principal = authentication.getPrincipal();
    String email = null;

    if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User oauth2User) {
        email = oauth2User.getAttribute("email");
    } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
        email = userDetails.getUsername();
    } else if (principal instanceof String str && !"anonymousUser".equals(str)) {
        email = str;
    }

    if (email == null) return false;

    return userRepository.findByEmail(email)
            .map(user -> user.getRole().name().equals("ADMIN"))
            .orElse(false);
}

    
}
