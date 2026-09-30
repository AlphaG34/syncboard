using Microsoft.EntityFrameworkCore;
using SyncBoard.Data;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var connection = builder.Configuration.GetConnectionString("Default") ?? "Data Source=syncboard.db";
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Create/update the database and fill it with demo data on every startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    Seed.Run(db);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();