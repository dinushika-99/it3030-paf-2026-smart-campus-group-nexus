package backend.Ticketing.dto;

public class TicketCommentUpdateRequest {

    private String userId;
    private String commentText;

    public TicketCommentUpdateRequest() {
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getCommentText() {
        return commentText;
    }

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }
}
