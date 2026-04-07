package backend.service;

import backend.model.Ticket;
import backend.model.User;
import backend.repository.TicketRepository;
import backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    public Ticket createTicket(Ticket ticket, Authentication authentication) {
        if (ticket.getLocationId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "locationId is required");
        }
        if (ticket.getResourceId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "resourceId is required");
        }

        User currentUser = resolveCurrentUser(authentication);
        ticket.setCreatedByUserId(currentUser.getId());

        if (ticket.getPreferredContactName() == null || ticket.getPreferredContactName().isBlank()) {
            ticket.setPreferredContactName(currentUser.getName());
        }
        if (ticket.getPreferredContactEmail() == null || ticket.getPreferredContactEmail().isBlank()) {
            ticket.setPreferredContactEmail(currentUser.getEmail());
        }

        return ticketRepository.save(ticket);
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
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
}