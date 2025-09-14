import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setMessage(data?.message ?? JSON.stringify(data)))
      .catch((err) => setMessage("Error: " + (err?.message || err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white font-sans p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-2">
          Frontend says hi <span className="animate-wave">👋</span>
        </h1>

        {loading ? (
          <p className="animate-pulse text-lg text-gray-200">Loading...</p>
        ) : (
          <p className="text-lg font-medium">
            Backend says:{" "}
            <span className="font-bold text-yellow-300">{message}</span>
          </p>
        )}

        <div className="mt-8">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-yellow-400 text-indigo-900 font-semibold shadow-md hover:bg-yellow-300 transition duration-300"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
