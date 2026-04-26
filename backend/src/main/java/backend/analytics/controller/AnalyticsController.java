package backend.analytics.controller;

import backend.analytics.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    // ✅ 1. Peak Booking Hours (ALL approved bookings)
    @GetMapping("/peak-hours")
    public ResponseEntity<?> getPeakBookingHours() {
        try {
            Map<String, Object> data = analyticsService.getPeakBookingHours();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch peak hours: " + e.getMessage()));
        }
    }

    // ✅ 2. Peak Booking Days (ALL approved bookings)
    @GetMapping("/peak-days")
    public ResponseEntity<?> getPeakBookingDays() {
        try {
            Map<String, Object> data = analyticsService.getPeakBookingDays();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch peak days: " + e.getMessage()));
        }
    }

    // ✅ 3. Booking Trends
    @GetMapping("/trends")
    public ResponseEntity<?> getBookingTrends(
            @RequestParam(defaultValue = "monthly") String period) {
        try {
            Map<String, Object> data = analyticsService.getBookingTrends(period);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch trends: " + e.getMessage()));
        }
    }

    // ✅ 4. Resource Utilization
    @GetMapping("/utilization")
    public ResponseEntity<?> getResourceUtilization() {
        try {
            Map<String, Object> data = analyticsService.getResourceUtilization();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch utilization: " + e.getMessage()));
        }
    }

    // ✅ 5. Summary Statistics (All-in-one)
    @GetMapping("/summary")
    public ResponseEntity<?> getAnalyticsSummary() {
        try {
            Map<String, Object> summary = analyticsService.getSummaryStats();
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch summary: " + e.getMessage()));
        }
    }
}