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

Troubleshooting: "Push shows done but changes not on GitHub"
- Quick checks (run in repo root)
  1. Confirm you're on the expected branch and there are commits to push:
     git status
     git rev-parse --abbrev-ref HEAD
     git log --oneline -n 5
  2. Check the remote and upstream:
     git remote -v
     git branch -vv
     If your branch has no upstream, set it and push:
     git push --set-upstream origin <branch>
  3. Look for unpushed commits:
     git cherry -v
     or
     git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD
  4. Authentication issues (common on VS Code):
     - If using HTTPS, create a Personal Access Token (PAT) and use it as your password or configure a credential manager.
     - If using SSH, ensure your SSH key is added to the agent and uploaded to GitHub.
  5. VS Code specifics:
     - Check the "Git" output (View → Output → select "Git") for push errors.
     - The UI may report "pushed" but the push failed due to auth; the output shows details.
  6. If a push still silently "succeeds" locally but remote unchanged:
     - Verify you're pushing to the correct remote URL (origin) and the correct repo.
     - Ensure there is no pre-push hook that aborts or rewrites history.
  7. Force a diagnostic push (shows failure text):
     git push origin HEAD --verbose
  8. If you need automated diagnostics, run the included script:
     ./scripts/git-diagnose.sh

- If none of the above help, copy the output of the commands and the Git output panel and share it for further debugging.

## GitHub Sync Troubleshooting

If your local changes are not appearing on GitHub after push, check the following:

1. **Check remote and branch**
   ```sh
   git remote -v
   git branch -vv
   ```
   - Ensure `origin` points to your GitHub repo.
   - Ensure your branch is tracking `origin/main` (or your main branch).

2. **Check for unpushed commits**
   ```sh
   git status
   git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD
   ```

3. **Push with upstream if needed**
   ```sh
   git push --set-upstream origin $(git rev-parse --abbrev-ref HEAD)
   ```

4. **Check for errors**
   - If you see authentication errors, update your credentials (PAT for HTTPS, or SSH key).
   - In VS Code, check the "Git" output panel for errors.

5. **Force a verbose push for diagnostics**
   ```sh
   git push origin HEAD --verbose
   ```

6. **If still not syncing**
   - Make sure you are pushing to the correct remote and branch.
   - Try pulling first: `git pull origin $(git rev-parse --abbrev-ref HEAD)`
   - If you see "Everything up-to-date" but GitHub does not update, you may be pushing to a different repo or branch.

7. **If using OneDrive, ensure files are not locked or unsynced locally.**

If you need more help, run:
```sh
bash ./scripts/git-diagnose.sh
```
and share the output.