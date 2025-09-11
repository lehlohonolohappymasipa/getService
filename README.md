getService - Week 1 guide

Goal
- Create a simple backend endpoint (already present: GET /api/hello) and a minimal frontend that calls it.

Prerequisites
- .NET SDK (6.0+ or 7.0+)
- Node.js and npm
- Git
- Docker (optional)

Quick backend run
1. From the repository root run the API (if the project is in the root):
   dotnet run

2. If your API project is in a subfolder use:
   dotnet run --project ./Path/To/YourProject.csproj

Test the endpoint
- HTTP: curl http://localhost:5000/api/hello
- HTTPS: curl -k https://localhost:5001/api/hello

If the endpoint returns JSON like { "message": "Hello from GetService API!", "timestamp": "..." } the backend is working.

Frontend (Week 1)
1. Create a React app in the project folder:
   npx create-react-app frontend

2. For local development add a proxy to frontend/package.json so the dev server forwards API calls to the backend:
   "proxy": "http://localhost:5000"
   This lets your frontend use fetch('/api/hello') without CORS issues.

3. Production / deployment:
   - Don't use CRA proxy in production. Deploy the frontend assets to a static host or serve them behind a reverse proxy.
   - Configure backend allowed origins in getService.Api/appsettings.json under Frontend:AllowedOrigins (array).
   - The API is configured to use forwarded headers and response compression to work efficiently behind reverse proxies (NGINX, load balancers).

Docker (optional)
- Build: docker build -t getservice-api .
- Run: docker run -p 5000:80 getservice-api

Repro steps summary
1. Install prerequisites.
2. Clone the repo.
3. dotnet run (or use docker).
4. Create the React frontend and run npm start.
5. Open the frontend in the browser and verify it calls /api/hello.

Next steps for Week 2
- Add user registration & login (JWT), database scaffold (Postgres), and basic auth middleware.
