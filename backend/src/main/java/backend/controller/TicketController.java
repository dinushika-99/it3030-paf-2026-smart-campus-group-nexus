package backend.controller;

import backend.model.Ticket;
import backend.model.TicketStatusHistory;
import backend.model.TicketStatusUpdateRequest;
import backend.service.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ticketService.getTicketById(id, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ticket> updateTicket(@PathVariable Long id, @RequestBody Ticket ticket, Authentication authentication) {
        return ResponseEntity.ok(ticketService.updateTicket(id, ticket, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id, Authentication authentication) {
        ticketService.deleteTicket(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody TicketStatusUpdateRequest request) {
        Ticket updatedTicket = ticketService.updateTicketStatus(id, request);
        return ResponseEntity.ok(updatedTicket);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketStatusHistory>> getTicketHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getHistoryByTicketId(id));
    }

}