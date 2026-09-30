namespace SyncBoard.Models;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string? Notes { get; set; }
    public string Status { get; set; } = "Todo";   // Todo, Doing or Done
    public int Version { get; set; } = 1;          // goes up on every edit
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}