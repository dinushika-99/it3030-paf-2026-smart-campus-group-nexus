package backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_status_history")
public class TicketStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Integer historyId;

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(name = "old_status")
    private String oldStatus;

    @Column(name = "new_status", nullable = false)
    private String newStatus;

    @Column(name = "changed_by_user_id", nullable = false)
    private Long changedByUserId;

    @Column(name = "change_note")
    private String changeNote;

    @Column(name = "changed_at")
    private LocalDateTime changedAt = LocalDateTime.now();

    public TicketStatusHistory() {
    }

    public TicketStatusHistory(Ticket ticket, String oldStatus, String newStatus, Long changedByUserId, String changeNote) {
        this.ticket = ticket;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedByUserId = changedByUserId;
        this.changeNote = changeNote;
        this.changedAt = LocalDateTime.now();
    }

    // getters and setters
}

