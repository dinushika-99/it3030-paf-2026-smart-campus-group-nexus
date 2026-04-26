package backend.modulea.mapper;

import backend.modulea.dto.ResourceRequestDTO;
import backend.modulea.dto.ResourceResponseDTO;
import backend.modulea.model.Resource;

public class ResourceMapper {

    // ================= DTO → ENTITY =================
    public static Resource toEntity(ResourceRequestDTO dto) {
        Resource resource = new Resource();

        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCategory(dto.getCategory());
        resource.setCapacity(dto.getCapacity());

        resource.setStatus(dto.getStatus());
        resource.setDailyOpenTime(dto.getDailyOpenTime());
        resource.setDailyCloseTime(dto.getDailyCloseTime());

        resource.setDescription(dto.getDescription());
        resource.setImageUrl(dto.getImageUrl());

        resource.setIsBookable(dto.getIsBookable());

        resource.setBuilding(dto.getBuilding());
        resource.setFloor(dto.getFloor());
        resource.setRoomNumber(dto.getRoomNumber());
        resource.setAreaName(dto.getAreaName());

        resource.setMaxBookingDurationHours(dto.getMaxBookingDurationHours());
        resource.setMaxQuantity(dto.getMaxQuantity());

        return resource;
    }

    // ================= ENTITY → DTO =================
    public static ResourceResponseDTO toDTO(Resource resource) {
        ResourceResponseDTO dto = new ResourceResponseDTO();

        dto.setResourcesId(resource.getResourcesId());
        dto.setName(resource.getName());
        dto.setType(resource.getType());
        dto.setCategory(resource.getCategory());
        dto.setCapacity(resource.getCapacity());

        dto.setStatus(resource.getStatus());
        dto.setDailyOpenTime(resource.getDailyOpenTime());
        dto.setDailyCloseTime(resource.getDailyCloseTime());

        dto.setDescription(resource.getDescription());
        dto.setImageUrl(resource.getImageUrl());

        dto.setIsBookable(resource.getIsBookable());

        dto.setBuilding(resource.getBuilding());
        dto.setFloor(resource.getFloor());
        dto.setRoomNumber(resource.getRoomNumber());
        dto.setAreaName(resource.getAreaName());

        dto.setMaxBookingDurationHours(resource.getMaxBookingDurationHours());
        dto.setMaxQuantity(resource.getMaxQuantity());

        return dto;
    }
}