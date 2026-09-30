using Microsoft.EntityFrameworkCore;
using SyncBoard.Data;
using SyncBoard.Hubs;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var connection = builder.Configuration.GetConnectionString("Default") ?? "Data Source=syncboard.db";
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));

// Local development only: lets `npm run dev` (port 3000) call this API
builder.Services.AddCors(o => o.AddPolicy("dev", p =>
    p.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    Seed.Run(db);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseCors("dev");
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.MapHub<BoardHub>("/hub");
app.MapFallbackToFile("index.html");

app.Run();