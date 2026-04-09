package backend.repository;

import backend.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
	List<Ticket> findByCreatedByUserId(Long createdByUserId);
}