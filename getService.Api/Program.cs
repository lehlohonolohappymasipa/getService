using Microsoft.OpenApi.Models;
using System;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.ResponseCompression;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Optional: for testing endpoints in Swagger
builder.Services.AddControllers();

// Configure response compression (improves network efficiency)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(opts => opts.Level = System.IO.Compression.CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(opts => opts.Level = System.IO.Compression.CompressionLevel.Fastest);

// Configure CORS from configuration (Frontend:AllowedOrigins), fallback to localhost:3000 for dev
var allowedOrigins = builder.Configuration.GetSection("Frontend:AllowedOrigins").Get<string[]>();
if (allowedOrigins == null || allowedOrigins.Length == 0)
{
    allowedOrigins = new[] { "http://localhost:3000" };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Enable Swagger in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Forwarded headers so reverse proxies (NGINX, etc.) work properly
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// Apply response compression and CORS policy (before routing/mapping endpoints)
app.UseResponseCompression();
app.UseCors("FrontendPolicy");

app.UseHttpsRedirection();

// In-memory stores (temporary)
var users = new List<User>();
var providers = new List<ServiceProvider>();
var appointments = new List<Appointment>();

// Enable attribute controllers (so Controllers/HelloController will work if included in the project)
app.MapControllers();

// ------------------------
// User Endpoints
// ------------------------
app.MapPost("/users/signup", (User user) =>
{
    users.Add(user);
    return Results.Created($"/users/{user.Username}", user);
});

app.MapPost("/users/login", (LoginRequest login) =>
{
    var user = users.FirstOrDefault(u => u.Username == login.Username && u.Password == login.Password);
    return user != null ? Results.Ok(user) : Results.Unauthorized();
});

// ------------------------
// Service Provider Endpoints
// ------------------------
app.MapGet("/providers", () => providers);

app.MapPost("/providers", (ServiceProvider provider) =>
{
    providers.Add(provider);
    return Results.Created($"/providers/{provider.Id}", provider);
});

// ------------------------
// Appointment Endpoints
// ------------------------
app.MapGet("/appointments", () => appointments);

app.MapPost("/appointments", (Appointment appointment) =>
{
    var providerExists = providers.Any(p => p.Id == appointment.ProviderId);
    if (!providerExists) return Results.BadRequest("Provider does not exist.");

    appointments.Add(appointment);
    return Results.Created($"/appointments/{appointment.Id}", appointment);
});

app.Run();

// ------------------------
// Data Models
// ------------------------
record User(string Username, string Password, string FullName);

record LoginRequest(string Username, string Password);

record ServiceProvider(Guid Id, string Name, string ServiceType);

interface IAppointment
{
    Guid Id { get; init; }
    string UserId { get; init; }
    Guid ProviderId { get; init; }
    DateTime DateTime { get; init; }

    void Deconstruct(out Guid Id, out string UserId, out Guid ProviderId, out DateTime DateTime);
    bool Equals(object? obj);
    bool Equals(Appointment? other);
    int GetHashCode();
    string ToString();
}

record Appointment(Guid Id, string UserId, Guid ProviderId, DateTime DateTime) : IAppointment;
