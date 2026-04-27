package backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import backend.booking.model.Booking;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    // ==================== EXISTING: Basic Queries ====================
    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Booking> findByStatus(Booking.BookingStatus status);
    List<Booking> findByStatusOrderByCreatedAtDesc(Booking.BookingStatus status);
    List<Booking> findAllByOrderByCreatedAtDesc();
    List<Booking> findByResourcesIdAndStatus(Long resourcesId, Booking.BookingStatus status);
    Optional<Booking> findByBookingCode(String bookingCode);

    // ==================== EXISTING: Conflict Detection ====================
    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.resourcesId = :resourcesId " +
           "AND b.status IN ('APPROVED') " +
           "AND NOT (b.endTime <= :startTime OR b.startTime >= :endTime)")
    int countOverlappingBookings(
        @Param("resourcesId") Long resourcesId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.resourcesId = :resourcesId " +
           "AND b.status IN ('APPROVED') " +
           "AND b.bookingId != :excludeBookingId " +
           "AND NOT (b.endTime <= :startTime OR b.startTime >= :endTime)")
    int countOverlappingBookingsExcluding(
        @Param("resourcesId") Long resourcesId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        @Param("excludeBookingId") String excludeBookingId
    );

    // ==================== EXISTING: User Limits ====================
    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.userId = :userId " +
           "AND DATE(b.startTime) = :date " +
           "AND b.status IN ('APPROVED', 'PENDING')")
    int countByUserIdAndDate(@Param("userId") String userId, @Param("date") java.time.LocalDate date);

    // ==================== ✅ ANALYTICS: Peak Hours/Days (ALL approved - NO date filter) ====================
    @Query("SELECT HOUR(b.startTime) as hour, COUNT(b) as count " +
           "FROM Booking b " +
           "WHERE b.status = 'APPROVED' " +
           "GROUP BY HOUR(b.startTime) " +
           "ORDER BY hour ASC")
    List<Object[]> findPeakBookingHours();

    @Query("SELECT DAYOFWEEK(b.startTime) as dayOfWeek, COUNT(b) as count " +
           "FROM Booking b " +
           "WHERE b.status = 'APPROVED' " +
           "GROUP BY DAYOFWEEK(b.startTime) " +
           "ORDER BY dayOfWeek ASC")
    List<Object[]> findPeakBookingDays();

    // ==================== ✅ ANALYTICS: Resource Utilization (WITH dynamic date range) ====================
    @Query("SELECT b.resourcesId, r.name, " +
           "SUM(TIMESTAMPDIFF(MINUTE, b.startTime, b.endTime)) as totalMinutes " +
           "FROM Booking b " +
           "JOIN Resource r ON b.resourcesId = r.resourcesId " +
           "WHERE b.status = 'APPROVED' " +
           "AND b.startTime <= :endDate " +
           "AND b.endTime >= :startDate " +
           "GROUP BY b.resourcesId, r.name")
    List<Object[]> findResourceUtilization(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    // ==================== ✅ ANALYTICS: Booking Trends ====================
    @Query("SELECT DATE(b.startTime) as date, COUNT(b) as count " +
           "FROM Booking b " +
           "WHERE b.status = 'APPROVED' " +
           "AND b.startTime >= :startDate " +
           "GROUP BY DATE(b.startTime) " +
           "ORDER BY date ASC")
    List<Object[]> findDailyBookingTrends(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT YEARWEEK(b.startTime) as yearWeek, COUNT(b) as count " +
           "FROM Booking b " +
           "WHERE b.status = 'APPROVED' " +
           "AND b.startTime >= :startDate " +
           "GROUP BY YEARWEEK(b.startTime) " +
           "ORDER BY yearWeek ASC")
    List<Object[]> findWeeklyBookingTrends(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT DATE_FORMAT(b.startTime, '%Y-%m') as month, COUNT(b) as count " +
           "FROM Booking b " +
           "WHERE b.status = 'APPROVED' " +
           "AND b.startTime >= :startDate " +
           "GROUP BY DATE_FORMAT(b.startTime, '%Y-%m') " +
           "ORDER BY month ASC")
    List<Object[]> findMonthlyBookingTrends(@Param("startDate") LocalDateTime startDate);

    // ==================== HELPER ====================
    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.resourcesId = :resourceId " +
           "AND b.status = 'APPROVED'")
    long countByResourceId(@Param("resourceId") Long resourceId);
}