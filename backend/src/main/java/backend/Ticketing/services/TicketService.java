package backend.Ticketing.services;

import backend.Ticketing.dto.AssignTechnicianRequest;
import backend.Ticketing.dto.TicketAttachmentResponse;
import backend.Ticketing.model.Ticket;
import backend.Ticketing.model.TicketAssignment;
import backend.Ticketing.model.TicketAttachment;
import backend.Ticketing.model.TicketPriority;
import backend.Ticketing.model.TicketStatus;
import backend.Ticketing.model.TicketStatusHistory;
import backend.Ticketing.model.TicketStatusUpdateRequest;
import backend.Ticketing.repository.TicketAssignmentRepository;
import backend.Ticketing.repository.TicketAttachmentRepository;
import backend.Ticketing.repository.TicketRepository;
import backend.Ticketing.repository.TicketStatusHistoryRepository;
import backend.auth.model.Role;
import backend.auth.model.User;
import backend.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import backend.Ticketing.dto.TicketCommentRequest;
import backend.Ticketing.dto.TicketCommentResponse;
import backend.Ticketing.dto.TicketCommentUpdateRequest;
import backend.Ticketing.model.TicketComment;
import backend.Ticketing.repository.TicketCommentRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class TicketService {

    private final TicketCommentRepository ticketCommentRepository;

    private final TicketRepository ticketRepository;
    private final TicketStatusHistoryRepository ticketStatusHistoryRepository;
    private final UserRepository userRepository;
    private final TicketAssignmentRepository ticketAssignmentRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;

    @Value("${app.upload.dir:uploads/tickets}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp");

    private static final Map<TicketPriority, List<String>> PRIORITY_KEYWORDS = Map.of(
            TicketPriority.CRITICAL,
            List.of("fire", "alarm", "emergency", "explosion", "evacuation", "security breach", "hazard", "gas leak"),
            TicketPriority.HIGH,
            List.of("server down", "network issue", "network down", "power outage", "urgent", "major", "critical lab"),
            TicketPriority.MEDIUM,
            List.of("not working", "broken", "error", "failed", "malfunction", "projector", "printer", "internet slow",
                    "light issue"),
            TicketPriority.LOW,
            List.of("request", "improvement", "minor", "enhancement", "new chair", "feature request"));

    public TicketService(
            TicketRepository ticketRepository,
            TicketStatusHistoryRepository ticketStatusHistoryRepository,
            UserRepository userRepository,
            TicketAssignmentRepository ticketAssignmentRepository,
            TicketAttachmentRepository ticketAttachmentRepository,
            TicketCommentRepository ticketCommentRepository) {
        this.ticketRepository = ticketRepository;
        this.ticketStatusHistoryRepository = ticketStatusHistoryRepository;
        this.userRepository = userRepository;
        this.ticketAssignmentRepository = ticketAssignmentRepository;
        this.ticketAttachmentRepository = ticketAttachmentRepository;
        this.ticketCommentRepository = ticketCommentRepository;
    }

    public Ticket createTicket(Ticket ticket, Authentication authentication) {
        User currentUser = resolveCurrentUser(authentication);
        ticket.setCreatedByUserId(currentUser.getId());
        ticket.setResourceId(normalizeOptionalField(ticket.getResourceId()));
        ticket.setLocationId(normalizeOptionalField(ticket.getLocationId()));

        if (ticket.getPreferredContactName() == null || ticket.getPreferredContactName().isBlank()) {
            ticket.setPreferredContactName(currentUser.getName());
        }
        if (ticket.getPreferredContactEmail() == null || ticket.getPreferredContactEmail().isBlank()) {
            ticket.setPreferredContactEmail(currentUser.getEmail());
        }

        try {
            return ticketRepository.save(ticket);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Ticket data is invalid for current database constraints",
                    ex);
        }
    }

    public Map<String, Object> suggestPriority(String description, String category) {
        String text = String.join(" ",
                String.valueOf(description == null ? "" : description),
                String.valueOf(category == null ? "" : category))
                .toLowerCase(Locale.ROOT)
                .trim();

        if (text.isEmpty()) {
            return buildSuggestionResponse(TicketPriority.MEDIUM, 0, List.of(),
                    "No description provided. Defaulting to MEDIUM.");
        }

        int score = 0;
        List<String> matchedKeywords = new ArrayList<>();

        for (String keyword : PRIORITY_KEYWORDS.get(TicketPriority.CRITICAL)) {
            if (text.contains(keyword)) {
                score += 5;
                matchedKeywords.add(keyword);
            }
        }

        for (String keyword : PRIORITY_KEYWORDS.get(TicketPriority.HIGH)) {
            if (text.contains(keyword)) {
                score += 3;
                matchedKeywords.add(keyword);
            }
        }

        for (String keyword : PRIORITY_KEYWORDS.get(TicketPriority.MEDIUM)) {
            if (text.contains(keyword)) {
                score += 2;
                matchedKeywords.add(keyword);
            }
        }

        for (String keyword : PRIORITY_KEYWORDS.get(TicketPriority.LOW)) {
            if (text.contains(keyword)) {
                score += 1;
                matchedKeywords.add(keyword);
            }
        }

        TicketPriority suggestedPriority;
        if (score >= 6) {
            suggestedPriority = TicketPriority.HIGH;
        } else if (score >= 3) {
            suggestedPriority = TicketPriority.MEDIUM;
        } else {
            suggestedPriority = TicketPriority.LOW;
        }

        if (!matchedKeywords.isEmpty()
                && matchedKeywords.stream().anyMatch(PRIORITY_KEYWORDS.get(TicketPriority.CRITICAL)::contains)) {
            suggestedPriority = TicketPriority.HIGH;
        }

        String reason = matchedKeywords.isEmpty()
                ? "No strong keywords found. Suggested LOW by default scoring."
                : "Matched keywords: " + String.join(", ", matchedKeywords);

        return buildSuggestionResponse(suggestedPriority, score, matchedKeywords, reason);
    }

    private Map<String, Object> buildSuggestionResponse(TicketPriority priority,
            int score,
            List<String> matchedKeywords,
            String reason) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("suggestedPriority", priority.name());
        response.put("score", score);
        response.put("matchedKeywords", matchedKeywords);
        response.put("reason", reason);
        return response;
    }

    public List<Ticket> getTicketsForCurrentUser(Authentication authentication) {
        User currentUser = resolveCurrentUser(authentication);
        if (currentUser.getRole() == Role.ADMIN) {
            return ticketRepository.findAll();
        }
        if (currentUser.getRole() == Role.TECHNICIAN) {
            List<Ticket> createdTickets = ticketRepository.findByCreatedByUserId(currentUser.getId());
            List<Ticket> assignedTickets = ticketRepository.findByAssignedTechnicianId(currentUser.getId());

            return java.util.stream.Stream.concat(createdTickets.stream(), assignedTickets.stream())
                    .collect(Collectors.collectingAndThen(
                            Collectors.toMap(Ticket::getTicketId, ticket -> ticket, (left, right) -> left),
                            ticketsById -> ticketsById.values().stream()
                                    .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                                    .collect(Collectors.toList())));
        }
        return ticketRepository.findByCreatedByUserId(currentUser.getId());
    }

    public List<Ticket> getAssignedTicketsForCurrentUser(Authentication authentication) {
        User currentUser = resolveCurrentUser(authentication);
        if (currentUser.getRole() == Role.ADMIN) {
            return ticketRepository.findAll();
        }
        return ticketRepository.findByAssignedTechnicianId(currentUser.getId());
    }

    public Ticket getTicketById(Integer id, Authentication authentication) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ticket not found with id: " + id));
        User currentUser = resolveCurrentUser(authentication);
        ensureTicketReadableByCurrentUser(ticket, currentUser);
        return ticket;
    }

    public Ticket updateTicket(Integer id, Ticket updatedTicket, Authentication authentication) {
        Ticket existingTicket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ticket not found with id: " + id));

        User currentUser = resolveCurrentUser(authentication);
        ensureTicketOwnership(existingTicket, currentUser);
        ensureTicketCanBeModifiedByUser(existingTicket, currentUser);

        existingTicket.setTitle(updatedTicket.getTitle());
        existingTicket.setCategory(updatedTicket.getCategory());
        existingTicket.setDescription(updatedTicket.getDescription());
        existingTicket.setPriority(updatedTicket.getPriority());
        existingTicket.setStatus(updatedTicket.getStatus());
        existingTicket.setPreferredContactName(updatedTicket.getPreferredContactName());
        existingTicket.setPreferredContactEmail(updatedTicket.getPreferredContactEmail());
        existingTicket.setPreferredContactPhone(updatedTicket.getPreferredContactPhone());
        existingTicket.setLocationId(normalizeOptionalField(updatedTicket.getLocationId()));
        existingTicket.setResourceId(normalizeOptionalField(updatedTicket.getResourceId()));

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

        User currentUser = resolveCurrentUser(authentication);
        ensureTicketOwnership(existingTicket, currentUser);
        ensureTicketCanBeModifiedByUser(existingTicket, currentUser);
        ticketRepository.delete(existingTicket);
    }

    private void ensureTicketOwnership(Ticket ticket, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        if (!Objects.equals(ticket.getCreatedByUserId(), currentUser.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only access your own tickets");
        }
    }

    private void ensureTicketCanBeModifiedByUser(Ticket ticket, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        String assignedTechnicianId = ticket.getAssignedTechnicianId();
        if (assignedTechnicianId != null && !assignedTechnicianId.trim().isEmpty()) {
            throw new ResponseStatusException(FORBIDDEN, "Assigned tickets are view-only for users");
        }
    }

    private void ensureTicketReadableByCurrentUser(Ticket ticket, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }

        if (Objects.equals(ticket.getCreatedByUserId(), currentUser.getId())) {
            return;
        }

        if (Objects.equals(ticket.getAssignedTechnicianId(), currentUser.getId())) {
            return;
        }

        throw new ResponseStatusException(FORBIDDEN, "You can only access your own or assigned tickets");
    }

    private void ensureTicketCanBeManagedByCurrentUser(Ticket ticket, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }

        if (!Objects.equals(ticket.getAssignedTechnicianId(), currentUser.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Only the assigned technician can update this ticket");
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

    private String normalizeOptionalField(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    public Ticket updateTicketStatus(Integer ticketId, TicketStatusUpdateRequest request,
            Authentication authentication) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        User currentUser = resolveCurrentUser(authentication);
        ensureTicketCanBeManagedByCurrentUser(ticket, currentUser);

        TicketStatus oldStatus = ticket.getStatus();
        TicketStatus newStatus = TicketStatus.valueOf(request.getStatus().toUpperCase());

        if (currentUser.getRole() == Role.TECHNICIAN) {
            if (!(oldStatus == TicketStatus.IN_PROGRESS && newStatus == TicketStatus.RESOLVED)) {
                throw new ResponseStatusException(FORBIDDEN,
                        "Technicians can only mark IN_PROGRESS tickets as RESOLVED");
            }
        }

        if (newStatus == TicketStatus.CLOSED && currentUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can close tickets");
        }

        String normalizedResolutionNotes = normalizeOptionalField(request.getResolutionNotes());
        String normalizedChangeNote = normalizeOptionalField(request.getChangeNote());

        if (oldStatus == newStatus) {
            if (currentUser.getRole() == Role.TECHNICIAN) {
                throw new ResponseStatusException(FORBIDDEN, "Technicians can only resolve assigned tickets");
            }
            ticket.setResolutionNotes(normalizedResolutionNotes);
            Ticket updatedTicket = ticketRepository.save(ticket);
            return updatedTicket;
        }

        if (!isValidStatusTransition(oldStatus, newStatus)) {
            throw new RuntimeException("Invalid status transition from " + oldStatus + " to " + newStatus);
        }

        ticket.setStatus(newStatus);

        if (newStatus == TicketStatus.REJECTED) {
            ticket.setRejectionReason(request.getRejectionReason());
        }

        if (newStatus == TicketStatus.RESOLVED) {
            ticket.setResolutionNotes(normalizedResolutionNotes);
            ticket.setResolvedAt(LocalDateTime.now());
        }

        if (newStatus == TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
        }

        if (newStatus == TicketStatus.IN_PROGRESS && ticket.getAssignedAt() == null) {
            ticket.setAssignedAt(LocalDateTime.now());
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        TicketStatusHistory history = new TicketStatusHistory(
                updatedTicket,
                oldStatus.name(),
                newStatus.name(),
                currentUser.getId(),
                normalizedChangeNote);

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

    @Transactional
    public Ticket assignTechnician(Integer ticketId, AssignTechnicianRequest request, Authentication authentication) {
        User currentUser = resolveCurrentUser(authentication);
        if (currentUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can assign technicians");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ticket not found with id: " + ticketId));

        if (request.getTechnicianId() == null || request.getTechnicianId().trim().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Technician ID is required");
        }

        if (ticket.getStatus() != TicketStatus.OPEN && ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            throw new ResponseStatusException(BAD_REQUEST, "Ticket can only be assigned when OPEN or IN_PROGRESS");
        }

        boolean technicianExists = userRepository.existsById(request.getTechnicianId());
        if (!technicianExists) {
            throw new ResponseStatusException(NOT_FOUND,
                    "Technician not found with user_id: " + request.getTechnicianId());
        }

        LocalDateTime now = LocalDateTime.now();

        ticketAssignmentRepository.findByTicketTicketIdAndIsActiveTrue(ticketId).ifPresent(activeAssignment -> {
            activeAssignment.setIsActive(false);
            activeAssignment.setUnassignedAt(now);
            ticketAssignmentRepository.save(activeAssignment);
        });

        TicketStatus previousStatus = ticket.getStatus();

        ticket.setAssignedTechnicianId(request.getTechnicianId());
        ticket.setAssignedAt(now);
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        TicketAssignment newAssignment = new TicketAssignment();
        newAssignment.setTicket(updatedTicket);
        newAssignment.setTechnicianId(request.getTechnicianId());
        newAssignment.setAssignedByUserId(currentUser.getId());
        newAssignment.setAssignedAt(now);
        newAssignment.setAssignmentNote(request.getAssignmentNote());
        newAssignment.setIsActive(true);
        ticketAssignmentRepository.save(newAssignment);

        if (previousStatus == TicketStatus.OPEN && updatedTicket.getStatus() == TicketStatus.IN_PROGRESS) {
            TicketStatusHistory assignmentStatusHistory = new TicketStatusHistory(
                    updatedTicket,
                    previousStatus.name(),
                    TicketStatus.IN_PROGRESS.name(),
                    currentUser.getId(),
                    (request.getAssignmentNote() == null || request.getAssignmentNote().isBlank())
                            ? "Assigned technician and moved to in progress."
                            : request.getAssignmentNote());
            ticketStatusHistoryRepository.save(assignmentStatusHistory);
        }

        return updatedTicket;
    }

    public List<Ticket> getTicketsByTechnician(String technicianId) {
        return ticketRepository.findByAssignedTechnicianId(technicianId);
    }

    public List<TicketAssignment> getAssignmentHistory(Integer ticketId) {
        return ticketAssignmentRepository.findByTicketTicketIdOrderByAssignedAtDesc(ticketId);
    }

    @Transactional
    public TicketAttachmentResponse uploadAttachment(Integer ticketId,
            MultipartFile file,
            String caption,
            String uploadedByUserId,
            Authentication authentication) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        User currentUser = resolveCurrentUser(authentication);
        ensureTicketOwnership(ticket, currentUser);
        ensureTicketCanBeModifiedByUser(ticket, currentUser);

        if (uploadedByUserId == null || uploadedByUserId.trim().isEmpty()) {
            uploadedByUserId = currentUser.getId();
        }

        if (!Objects.equals(uploadedByUserId, currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "You can only upload attachments as yourself");
        }

        if (!userRepository.existsById(uploadedByUserId)) {
            throw new RuntimeException("User not found with user_id: " + uploadedByUserId);
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Attachment file is required");
        }

        long currentCount = ticketAttachmentRepository.countByTicketTicketId(ticketId);
        if (currentCount >= MAX_ATTACHMENTS_PER_TICKET) {
            throw new RuntimeException("Maximum 3 attachments allowed per ticket");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Only image files (JPG, JPEG, PNG, WEBP) are allowed");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds 5MB limit");
        }

        String originalFileName = file.getOriginalFilename();
        String safeOriginalName = originalFileName == null ? "image"
                : Paths.get(originalFileName).getFileName().toString();

        String extension = "";
        int dotIndex = safeOriginalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = safeOriginalName.substring(dotIndex);
        }

        String newFileName = UUID.randomUUID() + extension;
        Path ticketFolderPath = Paths.get(uploadDir, String.valueOf(ticketId)).toAbsolutePath().normalize();

        try {
            Files.createDirectories(ticketFolderPath);

            Path targetPath = ticketFolderPath.resolve(newFileName);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            TicketAttachment attachment = new TicketAttachment();
            attachment.setTicket(ticket);
            attachment.setFileName(safeOriginalName);
            attachment.setFileUrl("uploads/tickets/" + ticketId + "/" + newFileName);
            attachment.setFileType(contentType);
            attachment.setFileSize(Math.toIntExact(file.getSize()));
            attachment.setCaption(caption);
            attachment.setUploadedByUserId(uploadedByUserId);
            attachment.setUploadedAt(LocalDateTime.now());

            TicketAttachment savedAttachment = ticketAttachmentRepository.save(attachment);
            return mapToAttachmentResponse(savedAttachment);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store attachment file", e);
        }
    }

    public List<TicketAttachmentResponse> getAttachmentsByTicketId(Integer ticketId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        return ticketAttachmentRepository.findByTicketTicketIdOrderByUploadedAtDesc(ticketId)
                .stream()
                .map(this::mapToAttachmentResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAttachment(Integer attachmentId, Authentication authentication) {
        TicketAttachment attachment = ticketAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found with id: " + attachmentId));

        User currentUser = resolveCurrentUser(authentication);
        Ticket ticket = attachment.getTicket();
        ensureTicketOwnership(ticket, currentUser);
        ensureTicketCanBeModifiedByUser(ticket, currentUser);

        try {
            Path filePath = Paths.get(attachment.getFileUrl()).toAbsolutePath().normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete attachment file", e);
        }

        ticketAttachmentRepository.deleteById(attachmentId);
    }

    private TicketAttachmentResponse mapToAttachmentResponse(TicketAttachment attachment) {
        TicketAttachmentResponse response = new TicketAttachmentResponse();
        response.setAttachmentId(attachment.getAttachmentId());
        response.setTicketId(attachment.getTicket().getTicketId());
        response.setFileName(attachment.getFileName());
        response.setFileUrl(attachment.getFileUrl());
        response.setFileType(attachment.getFileType());
        response.setFileSize(attachment.getFileSize());
        response.setCaption(attachment.getCaption());
        response.setUploadedByUserId(attachment.getUploadedByUserId());
        response.setUploadedAt(attachment.getUploadedAt());
        return response;
    }

    @Transactional
    public TicketCommentResponse addComment(Integer ticketId, TicketCommentRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
            throw new RuntimeException("User ID is required");
        }

        if (!userRepository.existsById(request.getUserId())) {
            throw new RuntimeException("User not found with user_id: " + request.getUserId());
        }

        if (request.getCommentText() == null || request.getCommentText().trim().isEmpty()) {
            throw new RuntimeException("Comment text is required");
        }

        TicketComment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = ticketCommentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException(
                            "Parent comment not found with id: " + request.getParentCommentId()));

            if (!parentComment.getTicket().getTicketId().equals(ticketId)) {
                throw new RuntimeException("Parent comment does not belong to this ticket");
            }

            if (parentComment.getDeletedAt() != null) {
                throw new RuntimeException("Cannot reply to a deleted comment");
            }
        }

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setUserId(request.getUserId());
        comment.setCommentText(request.getCommentText().trim());
        comment.setParentComment(parentComment);
        comment.setIsInternal(request.getIsInternal() != null ? request.getIsInternal() : false);
        comment.setIsEdited(false);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());

        TicketComment savedComment = ticketCommentRepository.save(comment);
        return mapToCommentResponse(savedComment);
    }

    public List<TicketCommentResponse> getCommentsByTicketId(Integer ticketId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        return ticketCommentRepository.findByTicketTicketIdAndDeletedAtIsNullOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketCommentResponse updateComment(Integer commentId, TicketCommentUpdateRequest request) {
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        if (comment.getDeletedAt() != null) {
            throw new RuntimeException("Cannot update a deleted comment");
        }

        if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
            throw new RuntimeException("User ID is required");
        }

        if (!comment.getUserId().equals(request.getUserId())) {
            throw new RuntimeException("You can only edit your own comment");
        }

        if (request.getCommentText() == null || request.getCommentText().trim().isEmpty()) {
            throw new RuntimeException("Comment text is required");
        }

        comment.setCommentText(request.getCommentText().trim());
        comment.setIsEdited(true);
        comment.setUpdatedAt(LocalDateTime.now());

        TicketComment updatedComment = ticketCommentRepository.save(comment);
        return mapToCommentResponse(updatedComment);
    }

    @Transactional
    public void deleteComment(Integer commentId, String userId) {
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        if (comment.getDeletedAt() != null) {
            throw new RuntimeException("Comment already deleted");
        }

        if (userId == null || userId.trim().isEmpty()) {
            throw new RuntimeException("User ID is required");
        }

        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own comment");
        }

        comment.setDeletedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        ticketCommentRepository.save(comment);
    }

    private TicketCommentResponse mapToCommentResponse(TicketComment comment) {
        TicketCommentResponse response = new TicketCommentResponse();
        response.setCommentId(comment.getCommentId());
        response.setTicketId(comment.getTicket().getTicketId());
        response.setUserId(comment.getUserId());
        response.setCommentText(comment.getCommentText());
        response.setParentCommentId(
                comment.getParentComment() != null ? comment.getParentComment().getCommentId() : null);
        response.setIsInternal(comment.getIsInternal());
        response.setIsEdited(comment.getIsEdited());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        response.setDeletedAt(comment.getDeletedAt());
        return response;
    }
}
