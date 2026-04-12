package backend.modulea.dto;

import backend.modulea.model.ResourceCategory;
import java.time.LocalTime;

public class ResourceResponseDTO {

    private Long resourcesId;

    private String name;
    private String type;
    private ResourceCategory category;
    private Integer capacity;

    private String status;

    private LocalTime dailyOpenTime;
    private LocalTime dailyCloseTime;

    private String description;
    private String imageUrl;

    private Boolean isBookable;

    private String building;
    private Integer floor;
    private String roomNumber;
    private String areaName;

    private Integer maxBookingDurationHours;
    private Integer maxQuantity;

    // ================= GETTERS =================

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

    public Integer getMaxBookingDurationHours() {
        return maxBookingDurationHours;
    }

    public Integer getMaxQuantity() {
        return maxQuantity;
    }

    // ================= SETTERS =================

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

    public void setMaxBookingDurationHours(Integer maxBookingDurationHours) {
        this.maxBookingDurationHours = maxBookingDurationHours;
    }

    public void setMaxQuantity(Integer maxQuantity) {
        this.maxQuantity = maxQuantity;
    }
}