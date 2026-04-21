package backend.Ticketing.repository;

import backend.Ticketing.model.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Integer> {

    List<TicketAttachment> findByTicketTicketIdOrderByUploadedAtDesc(Integer ticketId);

    long countByTicketTicketId(Integer ticketId);
}