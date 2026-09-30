using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SyncBoard.Data;
using SyncBoard.Dtos;
using SyncBoard.Models;

namespace SyncBoard.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TaskItem>>> GetAll()
    {
        return await db.Tasks.OrderBy(t => t.Id).ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskItem>> Get(int id)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null) return NotFound();
        return task;
    }

    [HttpPost]
    public async Task<ActionResult<TaskItem>> Create(TaskInput input)
    {
        var task = new TaskItem
        {
            Title = input.Title.Trim(),
            Notes = input.Notes,
            Status = input.Status
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = task.Id }, task);   // 201
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskItem>> Update(int id, TaskUpdate input)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null) return NotFound();                               // 404

        if (task.Version != input.BaseVersion)
            return Conflict(task);                                         // 409: someone edited it first

        task.Title = input.Title.Trim();
        task.Notes = input.Notes;
        task.Status = input.Status;
        task.Version++;
        task.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return task;
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var task = await db.Tasks.FindAsync(id);
        if (task is null) return NotFound();
        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return NoContent();                                                // 204
    }
}