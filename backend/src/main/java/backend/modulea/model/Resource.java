package backend.modulea.model;

import backend.modulea.model.ResourceCategory;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "resources")
public class Resource {

    // ==================== PRIMARY KEY ====================
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resources_id")
    private Long resourcesId;

    // ==================== CORE METADATA ====================
    @NotBlank(message = "Resource name is required")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    @Column(name = "name", unique = true, nullable = false, length = 255)
    private String name;

    @NotBlank(message = "Resource type is required")
    @Size(max = 50, message = "Type cannot exceed 50 characters")
    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 100)
    private ResourceCategory category;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @NotBlank(message = "Location is required")
    @Size(max = 255, message = "Location cannot exceed 255 characters")
    @Column(name = "location", nullable = false, length = 255)
    private String location;

    // ==================== AVAILABILITY & STATUS ====================
    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "daily_open_time", nullable = false)
    private LocalTime dailyOpenTime = LocalTime.of(8, 0);

    @Column(name = "daily_close_time", nullable = false)
    private LocalTime dailyCloseTime = LocalTime.of(18, 0);

    // ==================== DESCRIPTION & MEDIA ====================
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Size(max = 500, message = "Image URL cannot exceed 500 characters")
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "is_bookable")
    private Boolean isBookable = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ==================== PHYSICAL LOCATION DETAILS ====================
    @Size(max = 100, message = "Building name cannot exceed 100 characters")
    @Column(name = "building", length = 100)
    private String building;

    @Column(name = "floor")
    private Integer floor;

    @Size(max = 50, message = "Room number cannot exceed 50 characters")
    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Size(max = 150, message = "Area name cannot exceed 150 characters")
    @Column(name = "area_name", length = 150)
    private String areaName;

    // ==================== CONSTRUCTORS ====================
    public Resource() {
        // Required by JPA for proxy instantiation
    }

    public Resource(Long resourcesId, String name, String type, ResourceCategory category, Integer capacity,
                    String location, String status, LocalTime dailyOpenTime, LocalTime dailyCloseTime,
                    String description, String imageUrl, Boolean isBookable, LocalDateTime createdAt,
                    LocalDateTime updatedAt, String building, Integer floor, String roomNumber, String areaName) {
        this.resourcesId = resourcesId;
        this.name = name;
        this.type = type;
        this.category = category;
        this.capacity = capacity;
        this.location = location;
        this.status = status;
        this.dailyOpenTime = dailyOpenTime;
        this.dailyCloseTime = dailyCloseTime;
        this.description = description;
        this.imageUrl = imageUrl;
        this.isBookable = isBookable;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.building = building;
        this.floor = floor;
        this.roomNumber = roomNumber;
        this.areaName = areaName;
    }

    // ==================== GETTERS ====================
    public Long getResourcesId() {
         return resourcesId; 
    }

    public String getName() {
        return name; 
    }

    public String getType() {
        return type; 
    }

    public ResourceCategory getCategory() {
        return category; 
    }

    public Integer getCapacity() { 
        return capacity; 
    }

    public String getLocation() { 
        return location; 
    }

    public String getStatus() { 
        return status; 
    }

    public LocalTime getDailyOpenTime() { 
        return dailyOpenTime; 
    }

    public LocalTime getDailyCloseTime() { 
        return dailyCloseTime; 
    }

    public String getDescription() { 
        return description; 
    }

    public String getImageUrl() { 
        return imageUrl; 
    }

    public Boolean getIsBookable() { 
        return isBookable; 
    }

    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }

    public LocalDateTime getUpdatedAt() { 
        return updatedAt; 
    }

    public String getBuilding() { 
        return building; 
    }

    public Integer getFloor() { 
        return floor; 
    }

    public String getRoomNumber() { 
        return roomNumber; 
    }

    public String getAreaName() { 
        return areaName; 
    }

    // ==================== SETTERS ====================
    public void setResourcesId(Long resourcesId) { 
        this.resourcesId = resourcesId; 
    }

    public void setName(String name) { 
        this.name = name; 
    }

    public void setType(String type) { 
        this.type = type; 
    }

    public void setCategory(ResourceCategory category) { 
        this.category = category; 
    }

    public void setCapacity(Integer capacity) { 
        this.capacity = capacity; 
    }

    public void setLocation(String location) { 
        this.location = location; 
    }

    public void setStatus(String status) { 
        this.status = status; 
    }

    public void setDailyOpenTime(LocalTime dailyOpenTime) { 
        this.dailyOpenTime = dailyOpenTime; 
    }

    public void setDailyCloseTime(LocalTime dailyCloseTime) { 
        this.dailyCloseTime = dailyCloseTime; 
    }

    public void setDescription(String description) { 
        this.description = description; 
    }

    public void setImageUrl(String imageUrl) { 
        this.imageUrl = imageUrl; 
    }

    public void setIsBookable(Boolean isBookable) { 
        this.isBookable = isBookable; 
    }

    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }

    public void setUpdatedAt(LocalDateTime updatedAt) { 
        this.updatedAt = updatedAt; 
    }

    public void setBuilding(String building) { 
        this.building = building; 
    }

    public void setFloor(Integer floor) { 
        this.floor = floor; 
    }

    public void setRoomNumber(String roomNumber) { 
        this.roomNumber = roomNumber; 
    }

    public void setAreaName(String areaName) { 
        this.areaName = areaName; 
    }

    @PrePersist
    @PreUpdate
    private void normalizeAndValidate() {
        // Normalize status and type to uppercase for consistency
        if (status != null) this.status = status.trim().toUpperCase();
        if (type != null) this.type = type.trim().toUpperCase();

        // Validate status values
        if (status != null && !status.equals("ACTIVE") && !status.equals("OUT_OF_SERVICE")) {
            throw new IllegalArgumentException("Invalid status. Must be ACTIVE or OUT_OF_SERVICE");
        }

        // Validate time logic
        if (dailyOpenTime != null && dailyCloseTime != null && dailyOpenTime.isAfter(dailyCloseTime)) {
            throw new IllegalArgumentException("Daily open time cannot be after daily close time");
        }
    }

    // ==================== UTILITY METHODS ====================
    @Override
    public String toString() {
        return "Resource{" +
                "resourcesId=" + resourcesId +
                ", name='" + name + '\'' +
                ", type='" + type + '\'' +
                ", category=" + category +
                ", capacity=" + capacity +
                ", location='" + location + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}