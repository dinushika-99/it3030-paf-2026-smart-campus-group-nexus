package backend.Ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import backend.Ticketing.model.TicketStatusHistory;

import java.util.List;

public interface TicketStatusHistoryRepository extends JpaRepository<TicketStatusHistory, Integer> {
    List<TicketStatusHistory> findByTicketTicketIdOrderByChangedAtAsc(Integer ticketId);
}
