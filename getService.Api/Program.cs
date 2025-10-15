using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Optional: for testing endpoints in Swagger

var app = builder.Build();

// Enable Swagger in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// In-memory stores (temporary)
var users = new List<User>();
var providers = new List<ServiceProvider>();
var appointments = new List<Appointment>();

// Root test endpoint
app.MapGet("/", () => "Welcome to getService MVP!");

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
