package backend.analytics.service;

import backend.booking.model.Booking;
import backend.booking.repository.BookingRepository;
import backend.modulea.repository.ResourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
public class AnalyticsService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    public AnalyticsService(BookingRepository bookingRepository, 
                           ResourceRepository resourceRepository) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
    }

    // ✅ 1. Get Peak Booking Hours (Count ALL occupied hours, not just start time)
    public Map<String, Object> getPeakBookingHours() {
        // Get ALL approved bookings
        List<Booking> bookings = bookingRepository.findAll().stream()
            .filter(b -> b.getStatus() == Booking.BookingStatus.APPROVED)
            .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Long> data = new ArrayList<>();
        
        String[] hourLabels = {"12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", 
                               "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
                               "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", 
                               "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"};
        
        // Initialize all hours with 0
        long[] hourData = new long[24];
        
        // For each booking, count ALL hours it occupies
        for (Booking booking : bookings) {
            LocalDateTime startTime = booking.getStartTime();
            LocalDateTime endTime = booking.getEndTime();
            
            // Get all hours between start and end
            List<Integer> occupiedHours = getOccupiedHours(startTime, endTime);
            
            // Increment count for each occupied hour
            for (int hour : occupiedHours) {
                hourData[hour]++;
            }
        }
        
        // Build response
        for (int i = 0; i < 24; i++) {
            labels.add(hourLabels[i]);
            data.add(hourData[i]);
        }
        
        response.put("labels", labels);
        response.put("data", data);
        
        // Find peak hour
        int peakHour = 0;
        long maxCount = 0;
        for (int i = 0; i < hourData.length; i++) {
            if (hourData[i] > maxCount) {
                maxCount = hourData[i];
                peakHour = i;
            }
        }
        
        response.put("peakHour", hourLabels[peakHour]);
        response.put("peakCount", maxCount);
        
        return response;
    }

    // ✅ Helper method to get all hours occupied by a booking
    private List<Integer> getOccupiedHours(LocalDateTime startTime, LocalDateTime endTime) {
        List<Integer> hours = new ArrayList<>();
        LocalDateTime current = startTime;
        
        while (current.isBefore(endTime)) {
            int hour = current.getHour();
            if (!hours.contains(hour)) {
                hours.add(hour);
            }
            current = current.plusHours(1);
        }
        
        return hours;
    }

    // ✅ 2. Get Peak Booking Days (ALL approved bookings - no date filter)
    public Map<String, Object> getPeakBookingDays() {
        List<Object[]> results = bookingRepository.findPeakBookingDays();
        
        Map<String, Object> response = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Long> data = new ArrayList<>();
        
        String[] dayLabels = {"Sunday", "Monday", "Tuesday", "Wednesday", 
                              "Thursday", "Friday", "Saturday"};
        
        long[] dayData = new long[7];
        
        for (Object[] result : results) {
            int dayOfWeek = ((Number) result[0]).intValue();
            long count = ((Number) result[1]).longValue();
            dayData[dayOfWeek - 1] = count;
        }
        
        for (int i = 0; i < 7; i++) {
            labels.add(dayLabels[i]);
            data.add(dayData[i]);
        }
        
        response.put("labels", labels);
        response.put("data", data);
        
        int peakDay = 0;
        long maxCount = 0;
        for (int i = 0; i < dayData.length; i++) {
            if (dayData[i] > maxCount) {
                maxCount = dayData[i];
                peakDay = i;
            }
        }
        
        response.put("peakDay", dayLabels[peakDay]);
        response.put("peakCount", maxCount);
        
        return response;
    }

    // ✅ 3. Get Booking Trends
    public Map<String, Object> getBookingTrends(String period) {
        LocalDateTime startDate;
        List<Object[]> results;
        
        switch (period.toLowerCase()) {
            case "daily":
                startDate = LocalDateTime.now().minusDays(30);
                results = bookingRepository.findDailyBookingTrends(startDate);
                return formatDailyTrends(results);
                
            case "weekly":
                startDate = LocalDateTime.now().minusWeeks(12);
                results = bookingRepository.findWeeklyBookingTrends(startDate);
                return formatWeeklyTrends(results);
                
            case "monthly":
            default:
                startDate = LocalDateTime.now().minusMonths(12);
                results = bookingRepository.findMonthlyBookingTrends(startDate);
                return formatMonthlyTrends(results);
        }
    }

    private Map<String, Object> formatDailyTrends(List<Object[]> results) {
        Map<String, Object> response = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Long> data = new ArrayList<>();
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        
        for (Object[] result : results) {
            java.sql.Date date = (java.sql.Date) result[0];
            long count = ((Number) result[1]).longValue();
            
            labels.add(date.toLocalDate().format(formatter));
            data.add(count);
        }
        
        response.put("labels", labels);
        response.put("data", data);
        response.put("period", "daily");
        
        return response;
    }

    private Map<String, Object> formatWeeklyTrends(List<Object[]> results) {
        Map<String, Object> response = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Long> data = new ArrayList<>();
        
        for (Object[] result : results) {
            int yearWeek = ((Number) result[0]).intValue();
            long count = ((Number) result[1]).longValue();
            
            int year = yearWeek / 100;
            int week = yearWeek % 100;
            labels.add("Week " + week + " " + year);
            data.add(count);
        }
        
        response.put("labels", labels);
        response.put("data", data);
        response.put("period", "weekly");
        
        return response;
    }

    private Map<String, Object> formatMonthlyTrends(List<Object[]> results) {
        Map<String, Object> response = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Long> data = new ArrayList<>();
        
        for (Object[] result : results) {
            String month = (String) result[0];
            long count = ((Number) result[1]).longValue();
            
            String[] parts = month.split("-");
            String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
            String formattedMonth = monthNames[Integer.parseInt(parts[1]) - 1] + " " + parts[0];
            
            labels.add(formattedMonth);
            data.add(count);
        }
        
        response.put("labels", labels);
        response.put("data", data);
        response.put("period", "monthly");
        
        return response;
    }

    // ✅ 4. Get Resource Utilization (DYNAMIC - Last 30 days + Next 30 days)
    public Map<String, Object> getResourceUtilization() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = now.minusDays(30);
        LocalDateTime endDate = now.plusDays(30);
        
        List<Object[]> results = bookingRepository.findResourceUtilization(startDate, endDate);
        
        Map<String, Object> response = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();
        
        long totalDays = Duration.between(startDate, endDate).toDays();
        double operatingHoursPerDay = 10.0;
        double totalAvailableHours = totalDays * operatingHoursPerDay;
        
        for (Object[] result : results) {
            Long resourceId = ((Number) result[0]).longValue();
            String resourceName = (String) result[1];
            Long totalMinutes = ((Number) result[2]).longValue();
            
            double totalHoursUsed = totalMinutes / 60.0;
            double utilizationRate = (totalHoursUsed / totalAvailableHours) * 100;
            
            labels.add(resourceName);
            data.add(Math.round(utilizationRate * 100.0) / 100.0);
        }
        
        response.put("labels", labels);
        response.put("data", data);
        response.put("periodDays", totalDays);
        response.put("startDate", startDate.toLocalDate().toString());
        response.put("endDate", endDate.toLocalDate().toString());
        
        double totalUsedHours = results.stream()
            .mapToDouble(r -> ((Number) r[2]).longValue() / 60.0)
            .sum();
        
        double overallUtilization = results.isEmpty() ? 0.0 : 
            (totalUsedHours / (totalAvailableHours * results.size())) * 100;
        
        response.put("overallUtilization", Math.round(overallUtilization * 100.0) / 100.0);
        
        return response;
    }

    // ✅ 5. Get Summary Statistics
    public Map<String, Object> getSummaryStats() {
        Map<String, Object> stats = new HashMap<>();
        
        Map<String, Object> peakHours = getPeakBookingHours();
        stats.put("peakHour", peakHours.get("peakHour"));
        stats.put("peakHourCount", peakHours.get("peakCount"));
        
        Map<String, Object> peakDays = getPeakBookingDays();
        stats.put("peakDay", peakDays.get("peakDay"));
        stats.put("peakDayCount", peakDays.get("peakCount"));
        
        Map<String, Object> utilization = getResourceUtilization();
        stats.put("overallUtilization", utilization.get("overallUtilization"));
        
        return stats;
    }
}