package backend.Ticketing.controller;

import backend.Ticketing.dto.AssignTechnicianRequest;
import backend.Ticketing.model.Ticket;
import backend.Ticketing.model.TicketAssignment;
import backend.Ticketing.model.TicketStatusHistory;
import backend.Ticketing.model.TicketStatusUpdateRequest;
import backend.Ticketing.services.TicketService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import backend.Ticketing.dto.TicketAttachmentResponse;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import backend.Ticketing.dto.TicketCommentRequest;
import backend.Ticketing.dto.TicketCommentResponse;
import backend.Ticketing.dto.TicketCommentUpdateRequest;



@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Ticket ticket, Authentication authentication) {
        Ticket createdTicket = ticketService.createTicket(ticket, authentication);
        return new ResponseEntity<>(createdTicket, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets(Authentication authentication) {
        return ResponseEntity.ok(ticketService.getTicketsForCurrentUser(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(ticketService.getTicketById(id, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ticket> updateTicket(@PathVariable Integer id, @RequestBody Ticket ticket, Authentication authentication) {
        return ResponseEntity.ok(ticketService.updateTicket(id, ticket, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Integer id, Authentication authentication) {
        ticketService.deleteTicket(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable Integer id,
            @RequestBody TicketStatusUpdateRequest request,
            Authentication authentication) {
        Ticket updatedTicket = ticketService.updateTicketStatus(id, request, authentication);
        return ResponseEntity.ok(updatedTicket);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketStatusHistory>> getTicketHistory(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.getHistoryByTicketId(id));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTechnician(
            @PathVariable Integer id,
            @RequestBody AssignTechnicianRequest request,
            Authentication authentication) {
        Ticket updatedTicket = ticketService.assignTechnician(id, request, authentication);
        return ResponseEntity.ok(updatedTicket);
    }

    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<Ticket>> getTicketsByTechnician(@PathVariable String technicianId) {
        return ResponseEntity.ok(ticketService.getTicketsByTechnician(technicianId));
    }

    @GetMapping("/{id}/assignments")
    public ResponseEntity<List<TicketAssignment>> getAssignmentHistory(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.getAssignmentHistory(id));
    }


    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<TicketAttachmentResponse> uploadAttachment(
        @PathVariable Integer id,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "caption", required = false) String caption,
        @RequestParam("uploadedByUserId") String uploadedByUserId) {

    TicketAttachmentResponse response = ticketService.uploadAttachment(id, file, caption, uploadedByUserId);
    return ResponseEntity.ok(response);
}

@GetMapping("/{id}/attachments")
public ResponseEntity<List<TicketAttachmentResponse>> getAttachmentsByTicketId(@PathVariable Integer id) {
    return ResponseEntity.ok(ticketService.getAttachmentsByTicketId(id));
}

@DeleteMapping("/attachments/{attachmentId}")
public ResponseEntity<String> deleteAttachment(@PathVariable Integer attachmentId) {
    ticketService.deleteAttachment(attachmentId);
    return ResponseEntity.ok("Attachment deleted successfully");
}

@PostMapping("/{id}/comments")
public ResponseEntity<TicketCommentResponse> addComment(
        @PathVariable Integer id,
        @RequestBody TicketCommentRequest request) {
    return ResponseEntity.ok(ticketService.addComment(id, request));
}

@GetMapping("/{id}/comments")
public ResponseEntity<List<TicketCommentResponse>> getCommentsByTicketId(@PathVariable Integer id) {
    return ResponseEntity.ok(ticketService.getCommentsByTicketId(id));
}

@PutMapping("/comments/{commentId}")
public ResponseEntity<TicketCommentResponse> updateComment(
        @PathVariable Integer commentId,
        @RequestBody TicketCommentUpdateRequest request) {
    return ResponseEntity.ok(ticketService.updateComment(commentId, request));
}

@DeleteMapping("/comments/{commentId}")
public ResponseEntity<String> deleteComment(
        @PathVariable Integer commentId,
        @RequestParam("userId") String userId) {
    ticketService.deleteComment(commentId, userId);
    return ResponseEntity.ok("Comment deleted successfully");
}

}