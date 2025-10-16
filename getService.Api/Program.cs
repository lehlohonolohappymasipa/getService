using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://blue-field-070493d03.1.azurestaticapps.net")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add services
builder.Services.AddControllers();              // ✅ Enable controllers
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Enable CORS
app.UseCors();

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