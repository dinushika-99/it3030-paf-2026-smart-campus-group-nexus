package backend.repository;

import backend.model.TicketStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketStatusHistoryRepository extends JpaRepository<TicketStatusHistory, Integer> {
    List<TicketStatusHistory> findByTicketTicketIdOrderByChangedAtAsc(Long ticketId);
}
