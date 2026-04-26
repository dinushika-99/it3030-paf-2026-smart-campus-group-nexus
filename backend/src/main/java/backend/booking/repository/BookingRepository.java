package backend.booking.repository;

import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import backend.booking.model.Booking;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    // Find all bookings by user id
    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

    // Find bookings by status
    List<Booking> findByStatus(Booking.BookingStatus status);

    // Find bookings by status ordered by creation date
    List<Booking> findByStatusOrderByCreatedAtDesc(Booking.BookingStatus status);

    // Find all bookings (for admin) ordered by creation date
    List<Booking> findAllByOrderByCreatedAtDesc();

    // Find pending bookings for a resource
    List<Booking> findByResourcesIdAndStatus(Long resourcesId, Booking.BookingStatus status);

    // Find by booking code
    Optional<Booking> findByBookingCode(String bookingCode);

    // Check for overlapping bookings (CRITICAL FOR CONFLICT DETECTION)
    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.resourcesId = :resourcesId " +
           "AND b.status IN ('APPROVED', 'PENDING') " +
           "AND NOT (b.endTime <= :startTime OR b.startTime >= :endTime)")
    int countOverlappingBookings(
        @Param("resourcesId") Long resourcesId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    // Count bookings by user and date (for daily limit validation)
    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.userId = :userId " +
           "AND DATE(b.startTime) = :date " +
           "AND b.status IN ('APPROVED', 'PENDING')")
    int countByUserIdAndDate(@Param("userId") String userId, @Param("date") java.time.LocalDate date);
}