package backend.Ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import backend.Ticketing.model.TicketAssignment;

import java.util.List;
import java.util.Optional;

public interface TicketAssignmentRepository extends JpaRepository<TicketAssignment, Integer> {
	Optional<TicketAssignment> findByTicketTicketIdAndIsActiveTrue(Integer ticketId);

	List<TicketAssignment> findByTicketTicketIdOrderByAssignedAtDesc(Integer ticketId);
}
