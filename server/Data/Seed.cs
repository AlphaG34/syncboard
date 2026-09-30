using SyncBoard.Models;

namespace SyncBoard.Data;

public static class Seed
{
    public static void Run(AppDbContext db)
    {
        if (db.Tasks.Any()) return;

        db.Tasks.AddRange(
            new TaskItem { Title = "Design the landing page", Notes = "Hero section, features and footer.", Status = "Done" },
            new TaskItem { Title = "Set up the CI pipeline", Notes = "Run build and tests on every push.", Status = "Done" },
            new TaskItem { Title = "Write the API documentation", Notes = "List every endpoint with an example.", Status = "Doing" },
            new TaskItem { Title = "Fix the login redirect bug", Notes = "Users land on a blank page after logging in.", Status = "Doing" },
            new TaskItem { Title = "Prepare the client demo", Notes = "Slides plus a live walkthrough.", Status = "Todo" },
            new TaskItem { Title = "Review pull requests", Status = "Todo" }
        );
        db.SaveChanges();
    }
}