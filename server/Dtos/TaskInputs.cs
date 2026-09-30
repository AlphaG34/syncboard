using System.ComponentModel.DataAnnotations;

namespace SyncBoard.Dtos;

public class TaskInput
{
    [Required, StringLength(120)]
    public string Title { get; set; } = "";

    [StringLength(2000)]
    public string? Notes { get; set; }

    [Required, RegularExpression("^(Todo|Doing|Done)$", ErrorMessage = "Status must be Todo, Doing or Done.")]
    public string Status { get; set; } = "Todo";
}

public class TaskUpdate : TaskInput
{
    [Required]
    public int? BaseVersion { get; set; }   // the version the user was editing
}