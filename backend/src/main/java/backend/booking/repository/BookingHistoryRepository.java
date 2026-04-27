package backend.booking.repository;

import backend.booking.model.BookingStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingHistoryRepository extends JpaRepository<BookingStatusHistory, Integer> {
    
    
    // Find history for a booking, oldest first (for timeline display)
    List<BookingStatusHistory> findByBookingIdOrderByChangedAtAsc(String bookingId);
    
    // Find history for a booking, newest first (alternative)
    List<BookingStatusHistory> findByBookingIdOrderByChangedAtDesc(String bookingId);
}