var builder = WebApplication.CreateBuilder(args);

// Hosts like Render/Railway tell the app which port to use via PORT
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();      // serves the Next.js build from wwwroot
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();