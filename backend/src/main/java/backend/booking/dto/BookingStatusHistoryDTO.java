package backend.booking.dto;

import java.time.LocalDateTime;

public class BookingStatusHistoryDTO {

    private String oldStatus;
    private String newStatus;
    private String changedByUserName;
    private String changeNote;
    private LocalDateTime changedAt;

    // Constructors
    public BookingStatusHistoryDTO() {}

    // Getters and Setters
    public String getOldStatus() { return oldStatus; }
    public void setOldStatus(String oldStatus) { this.oldStatus = oldStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getChangedByUserName() { return changedByUserName; }
    public void setChangedByUserName(String changedByUserName) { this.changedByUserName = changedByUserName; }

    public String getChangeNote() { return changeNote; }
    public void setChangeNote(String changeNote) { this.changeNote = changeNote; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}