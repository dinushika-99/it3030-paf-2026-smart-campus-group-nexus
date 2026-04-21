package backend.Ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import backend.Ticketing.model.Ticket;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Integer> {
	List<Ticket> findByCreatedByUserId(String createdByUserId);
	List<Ticket> findByAssignedTechnicianId(String assignedTechnicianId);
}
