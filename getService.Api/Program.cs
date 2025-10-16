using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();              // ✅ Enable controllers
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Enable Swagger in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();

app.MapControllers();                           // ✅ Map attribute-routed controllers

// ------------------------
// Minimal API Endpoints
// ------------------------
app.MapGet("/", () => "Welcome to getService MVP!");

// ✅ Health-check endpoint
app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "Healthy",
        environment = app.Environment.EnvironmentName,
        timestamp = DateTime.UtcNow
    });
});

app.Run();