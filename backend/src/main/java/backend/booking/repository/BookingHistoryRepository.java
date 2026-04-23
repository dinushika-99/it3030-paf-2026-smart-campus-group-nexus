package backend.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import backend.booking.model.BookingStatusHistory;
import java.util.List;

@Repository
public interface BookingHistoryRepository extends JpaRepository<BookingStatusHistory, Integer> {

    List<BookingStatusHistory> findByBookingIdOrderByChangedAtDesc(String bookingId);
    
}
