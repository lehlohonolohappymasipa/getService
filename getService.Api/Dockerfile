# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj(s) and restore
COPY *.sln ./
# Copy project files (adjust path if solution layout differs)
COPY getService.Api/*.csproj ./getService.Api/
RUN dotnet restore

# Copy everything and build
COPY . .
WORKDIR /src/getService.Api
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "getService.Api.dll"]
