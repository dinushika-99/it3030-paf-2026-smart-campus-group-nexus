package backend.Ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import backend.Ticketing.model.TicketComment;

import java.util.List;

public interface TicketCommentRepository extends JpaRepository<TicketComment, Integer> {

    List<TicketComment> findByTicketTicketIdAndDeletedAtIsNullOrderByCreatedAtAsc(Integer ticketId);
}