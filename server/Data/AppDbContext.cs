using Microsoft.EntityFrameworkCore;
using SyncBoard.Models;

namespace SyncBoard.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
}