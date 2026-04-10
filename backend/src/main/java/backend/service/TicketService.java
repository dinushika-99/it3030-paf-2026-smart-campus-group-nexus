package backend.service;

import backend.model.Ticket;
import backend.model.Role;
import backend.model.TicketStatus;
import backend.model.TicketStatusHistory;
import backend.model.TicketStatusUpdateRequest;
import backend.model.User;
import backend.repository.TicketRepository;
import backend.repository.TicketStatusHistoryRepository;
import backend.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketStatusHistoryRepository ticketStatusHistoryRepository;
    private final UserRepository userRepository;

    public TicketService(
            TicketRepository ticketRepository,
            TicketStatusHistoryRepository ticketStatusHistoryRepository,
            UserRepository userRepository
    ) {
        this.ticketRepository = ticketRepository;
        this.ticketStatusHistoryRepository = ticketStatusHistoryRepository;
        this.userRepository = userRepository;
    }

    public Ticket createTicket(Ticket ticket, Authentication authentication) {
        User currentUser = resolveCurrentUser(authentication);
        ticket.setCreatedByUserId(currentUser.getId());

        // Until resources table flow is finalized, do not persist resources FK values.
        // This prevents FK violations when users type free-text resource info.
        ticket.setResourceId(null);

        if (ticket.getPreferredContactName() == null || ticket.getPreferredContactName().isBlank()) {
            ticket.setPreferredContactName(currentUser.getName());
        }
        if (ticket.getPreferredContactEmail() == null || ticket.getPreferredContactEmail().isBlank()) {
            ticket.setPreferredContactEmail(currentUser.getEmail());
        }

        try {
            return ticketRepository.save(ticket);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Ticket data is invalid for current database constraints", ex);
        }
    }

    public List<Ticket> getTicketsForCurrentUser(Authentication authentication) {
        User currentUser = resolveCurrentUser(authentication);
        if (currentUser.getRole() == Role.ADMIN) {
            return ticketRepository.findAll();
        }
        return ticketRepository.findByCreatedByUserId(currentUser.getId());
    }

    public Ticket getTicketById(Integer id, Authentication authentication) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ticket not found with id: " + id));
        ensureTicketOwnership(ticket, authentication);
        return ticket;
    }

    public Ticket updateTicket(Integer id, Ticket updatedTicket, Authentication authentication) {
        Ticket existingTicket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ticket not found with id: " + id));

        ensureTicketOwnership(existingTicket, authentication);

        existingTicket.setTitle(updatedTicket.getTitle());
        existingTicket.setCategory(updatedTicket.getCategory());
        existingTicket.setDescription(updatedTicket.getDescription());
        existingTicket.setPriority(updatedTicket.getPriority());
        existingTicket.setStatus(updatedTicket.getStatus());
        existingTicket.setPreferredContactName(updatedTicket.getPreferredContactName());
        existingTicket.setPreferredContactEmail(updatedTicket.getPreferredContactEmail());
        existingTicket.setPreferredContactPhone(updatedTicket.getPreferredContactPhone());
        existingTicket.setLocationId(updatedTicket.getLocationId());
        // Keep detached from resources table until resource management is in place.
        existingTicket.setResourceId(null);

        if (!Objects.equals(existingTicket.getAssignedTechnicianId(), updatedTicket.getAssignedTechnicianId())) {
            existingTicket.setAssignedTechnicianId(updatedTicket.getAssignedTechnicianId());
        }

        existingTicket.setRejectionReason(updatedTicket.getRejectionReason());
        existingTicket.setResolutionNotes(updatedTicket.getResolutionNotes());

        try {
            return ticketRepository.save(existingTicket);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Ticket update violates current database constraints", ex);
        }
    }

    public void deleteTicket(Integer id, Authentication authentication) {
        Ticket existingTicket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ticket not found with id: " + id));

        ensureTicketOwnership(existingTicket, authentication);
        ticketRepository.delete(existingTicket);
    }

    private void ensureTicketOwnership(Ticket ticket, Authentication authentication) {
        User currentUser = resolveCurrentUser(authentication);
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        if (!Objects.equals(ticket.getCreatedByUserId(), currentUser.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only access your own tickets");
        }
    }

    private User resolveCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "You must be logged in to create a ticket");
        }

        Object principal = authentication.getPrincipal();
        String email = null;

        if (principal instanceof OAuth2User oauth2User) {
            email = oauth2User.getAttribute("email");
        } else if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String principalName && !"anonymousUser".equalsIgnoreCase(principalName)) {
            email = principalName;
        }

        if ((email == null || email.isBlank()) && authentication.getName() != null
                && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
            email = authentication.getName();
        }

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unable to identify logged-in user");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Logged-in user account not found"));
    }

    public Ticket updateTicketStatus(Integer ticketId, TicketStatusUpdateRequest request, Authentication authentication) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        TicketStatus oldStatus = ticket.getStatus();
        TicketStatus newStatus = TicketStatus.valueOf(request.getStatus().toUpperCase());

        if (!isValidStatusTransition(oldStatus, newStatus)) {
            throw new RuntimeException("Invalid status transition from " + oldStatus + " to " + newStatus);
        }

        ticket.setStatus(newStatus);

        if (newStatus == TicketStatus.REJECTED) {
            ticket.setRejectionReason(request.getRejectionReason());
        }

        if (newStatus == TicketStatus.RESOLVED) {
            ticket.setResolutionNotes(request.getResolutionNotes());
            ticket.setResolvedAt(LocalDateTime.now());
        }

        if (newStatus == TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
        }

        if (newStatus == TicketStatus.IN_PROGRESS && ticket.getAssignedAt() == null) {
            ticket.setAssignedAt(LocalDateTime.now());
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        User currentUser = resolveCurrentUser(authentication);
        String changedByUserId = request.getChangedByUserId();
        if (changedByUserId == null || changedByUserId.isBlank()) {
            changedByUserId = currentUser.getId();
        }

        TicketStatusHistory history = new TicketStatusHistory(
                updatedTicket,
                oldStatus.name(),
                newStatus.name(),
            changedByUserId,
                request.getChangeNote()
        );

        ticketStatusHistoryRepository.save(history);

        return updatedTicket;
    }

    private boolean isValidStatusTransition(TicketStatus oldStatus, TicketStatus newStatus) {
        return switch (oldStatus) {
            case OPEN -> newStatus == TicketStatus.IN_PROGRESS || newStatus == TicketStatus.REJECTED;
            case IN_PROGRESS -> newStatus == TicketStatus.RESOLVED;
            case RESOLVED -> newStatus == TicketStatus.CLOSED;
            default -> false;
        };
    }

    public List<TicketStatusHistory> getHistoryByTicketId(Integer ticketId) {
        return ticketStatusHistoryRepository.findByTicketTicketIdOrderByChangedAtAsc(ticketId);
    }


}