package backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    public record TicketResourceOption(String resourceId, String name, String category, String location) {
    }
}
