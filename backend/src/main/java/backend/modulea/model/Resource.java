package backend.modulea.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "resources", 
       indexes = {
           @Index(name = "idx_resource_type_status", columnList = "type, status"),
           @Index(name = "idx_resource_location", columnList = "location")
       })
@EntityListeners(AuditingEntityListener.class)
public class Resource {
    @Id
    @Column(name = "resources_id", length = 255)
    private String id;

    @Column(nullable = false, unique = true, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ResourceType type;

    @Column(length = 100)
    private String category;

    private Integer capacity;

    // === LOCATION FIELDS ===
    @Column(nullable = false, length = 255)
    private String location;  // Full address: "Building A, Floor 2, Room 204"

    @Column(length = 100)
    private String building;  // "Building A"

    private Integer floor;    // 2

    @Column(name = "room_number", length = 50)
    private String roomNumber;  // "204"

    @Column(name = "area_name", length = 150)
    private String areaName;  // "Main Campus"
    // =====================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ResourceStatus status = ResourceStatus.ACTIVE;

    @Column(name = "daily_open_time", nullable = false)
    private LocalTime dailyOpenTime = LocalTime.of(8, 0);

    @Column(name = "daily_close_time", nullable = false)
    private LocalTime dailyCloseTime = LocalTime.of(18, 0);

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "is_bookable")
    private Boolean isBookable = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // === HELPER METHOD: Auto-generate location from granular fields ===
    @PrePersist
    @PreUpdate
    private void updateLocationField() {
        if (building != null || floor != null || roomNumber != null) {
            StringBuilder fullLocation = new StringBuilder();
            if (building != null && !building.isEmpty()) {
                fullLocation.append(building);
            }
            if (floor != null) {
                if (fullLocation.length() > 0) fullLocation.append(", ");
                fullLocation.append("Floor ").append(floor);
            }
            if (roomNumber != null && !roomNumber.isEmpty()) {
                if (fullLocation.length() > 0) fullLocation.append(", ");
                fullLocation.append("Room ").append(roomNumber);
            }
            if (areaName != null && !areaName.isEmpty()) {
                if (fullLocation.length() > 0) fullLocation.append(" - ");
                fullLocation.append(areaName);
            }
            this.location = fullLocation.toString();
        }
    }

    public class Resource{

    }

}