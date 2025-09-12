import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Use relative URL so dev-server proxy forwards to backend and avoids CORS/mixed-origin problems
    fetch("/api/hello")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setMessage(data?.message ?? JSON.stringify(data)))
      .catch(err => setMessage("Error: " + (err?.message || err)));
  }, []);

  return (
    <div>
      <h1>Frontend says hi 👋</h1>
      <p>Backend says: {message}</p>
    </div>
  );
}

export default App;
