package backend.Ticketing.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*")
public class ResourceController {

    private final JdbcTemplate jdbcTemplate;

    public ResourceController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/ticket-options")
    public List<TicketResourceOption> getTicketResourceOptions() {
        String sql = """
                SELECT
                    CAST(resources_id AS CHAR) AS resource_id,
                    name,
                    COALESCE(category, '') AS category,
                    CASE
                        WHEN TRIM(COALESCE(area_name, '')) <> '' THEN TRIM(area_name)
                        WHEN TRIM(COALESCE(building, '')) <> '' AND TRIM(COALESCE(room_number, '')) <> ''
                            THEN CONCAT(TRIM(building), ' - ', TRIM(room_number))
                        WHEN TRIM(COALESCE(building, '')) <> '' THEN TRIM(building)
                        ELSE ''
                    END AS location
                FROM resources
                WHERE COALESCE(status, '') <> 'OUT_OF_SERVICE'
                ORDER BY name ASC
                """;

        return jdbcTemplate.query(
                sql,
                (row, rowNum) -> new TicketResourceOption(
                        row.getString("resource_id"),
                        row.getString("name"),
                        row.getString("category"),
                        row.getString("location")
                )
        );
    }

    @GetMapping("/resolve-room")
    public QrRoomLookupResponse resolveRoom(@RequestParam("roomId") String roomId) {
        String normalizedRoomId = normalizeRoomId(roomId);
        if (normalizedRoomId.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "roomId is required");
        }

        String compactRoomId = compactIdentifier(normalizedRoomId);
        String buildingHint = "";
        String roomNumberHint = "";
        String[] parts = normalizedRoomId.split("[-_\\s]+");
        if (parts.length >= 2) {
            buildingHint = parts[0].trim().toUpperCase();
            roomNumberHint = parts[parts.length - 1].trim().toUpperCase();
        }

        String sql = """
                SELECT
                    CAST(resources_id AS CHAR) AS resource_id,
                    name,
                    COALESCE(category, '') AS category,
                    COALESCE(type, '') AS resource_type,
                    COALESCE(building, '') AS building,
                    floor,
                    COALESCE(room_number, '') AS room_number,
                    COALESCE(area_name, '') AS area_name,
                    CASE
                        WHEN TRIM(COALESCE(area_name, '')) <> '' THEN TRIM(area_name)
                        WHEN TRIM(COALESCE(building, '')) <> '' AND TRIM(COALESCE(room_number, '')) <> ''
                            THEN CONCAT(TRIM(building), ' - ', TRIM(room_number))
                        WHEN TRIM(COALESCE(building, '')) <> '' THEN TRIM(building)
                        ELSE ''
                    END AS location,
                    CASE
                        WHEN UPPER(TRIM(COALESCE(room_number, ''))) = ? THEN 1
                        WHEN UPPER(CONCAT(TRIM(COALESCE(building, '')), '-', TRIM(COALESCE(room_number, '')))) = ? THEN 2
                                                WHEN CONCAT(
                                                                REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(building, ''))), '-', ''), '_', ''), ' ', ''),
                                                                REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(room_number, ''))), '-', ''), '_', ''), ' ', '')
                                                         ) = ? THEN 3
                                                WHEN REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(room_number, ''))), '-', ''), '_', ''), ' ', '') = ? THEN 4
                                                WHEN UPPER(TRIM(COALESCE(area_name, ''))) = ? THEN 5
                                                WHEN UPPER(TRIM(COALESCE(name, ''))) = ? THEN 6
                                                WHEN (? <> '' AND ? <> '' AND UPPER(TRIM(COALESCE(building, ''))) = ? AND UPPER(TRIM(COALESCE(room_number, ''))) = ?) THEN 7
                                                ELSE 10
                    END AS match_rank
                FROM resources
                WHERE COALESCE(status, '') <> 'OUT_OF_SERVICE'
                  AND (
                    UPPER(TRIM(COALESCE(room_number, ''))) = ?
                    OR UPPER(CONCAT(TRIM(COALESCE(building, '')), '-', TRIM(COALESCE(room_number, '')))) = ?
                                        OR CONCAT(
                                                REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(building, ''))), '-', ''), '_', ''), ' ', ''),
                                                REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(room_number, ''))), '-', ''), '_', ''), ' ', '')
                                        ) = ?
                                        OR REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(room_number, ''))), '-', ''), '_', ''), ' ', '') = ?
                    OR UPPER(TRIM(COALESCE(area_name, ''))) = ?
                    OR UPPER(TRIM(COALESCE(name, ''))) = ?
                                        OR (? <> '' AND ? <> '' AND UPPER(TRIM(COALESCE(building, ''))) = ? AND UPPER(TRIM(COALESCE(room_number, ''))) = ?)
                  )
                ORDER BY match_rank ASC, name ASC
                LIMIT 1
                """;

        List<QrRoomLookupResponse> results = jdbcTemplate.query(
                sql,
                (row, rowNum) -> new QrRoomLookupResponse(
                        normalizedRoomId,
                        row.getString("resource_id"),
                        row.getString("name"),
                        row.getString("category"),
                        row.getString("resource_type"),
                        row.getString("building"),
                        row.getObject("floor") == null ? null : row.getInt("floor"),
                        row.getString("room_number"),
                        row.getString("area_name"),
                        row.getString("location")
                ),
                normalizedRoomId,
                normalizedRoomId,
                compactRoomId,
                compactRoomId,
                normalizedRoomId,
                normalizedRoomId,
                buildingHint,
                roomNumberHint,
                buildingHint,
                roomNumberHint,
                normalizedRoomId,
                normalizedRoomId,
                compactRoomId,
                compactRoomId,
                normalizedRoomId,
                normalizedRoomId,
                buildingHint,
                roomNumberHint,
                buildingHint,
                roomNumberHint
        );

        if (results.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "No active room/resource found for roomId: " + normalizedRoomId);
        }

        return results.get(0);
    }

    private String normalizeRoomId(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase();
    }

    private String compactIdentifier(String value) {
        return String.valueOf(value == null ? "" : value)
                .replace("-", "")
                .replace("_", "")
                .replace(" ", "")
                .trim()
                .toUpperCase();
    }

    public record TicketResourceOption(String resourceId, String name, String category, String location) {
    }

    public record QrRoomLookupResponse(
            String roomId,
            String resourceId,
            String resourceName,
            String category,
            String resourceType,
            String building,
            Integer floor,
            String roomNumber,
            String areaName,
            String location
    ) {
    }
}
