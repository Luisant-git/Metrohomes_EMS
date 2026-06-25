import { useState } from "react";

const MOCK_RESPONSES = {
  GET: {
    status: 200,
    data: {
      success: true,
      users: [
        { id: 1, name: "Alice Johnson", role: "Admin", active: true },
        { id: 2, name: "Bob Smith", role: "User", active: true },
        { id: 3, name: "Carol White", role: "User", active: false },
      ],
    },
  },
  POST: {
    status: 201,
    data: {
      success: true,
      message: "User created successfully",
      user: { id: 4, name: "Dave Brown", role: "User", active: true },
    },
  },
  PUT: {
    status: 200,
    data: {
      success: true,
      message: "User updated successfully",
      user: { id: 1, name: "Alice Johnson", role: "Super Admin", active: true },
    },
  },
  DELETE: {
    status: 200,
    data: {
      success: true,
      message: "User deleted successfully",
      deletedId: 3,
    },
  },
};

const METHOD_COLORS = {
  GET: "bg-blue-100 text-blue-700 border-blue-200",
  POST: "bg-green-100 text-green-700 border-green-200",
  PUT: "bg-yellow-100 text-yellow-700 border-yellow-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};

const ENDPOINTS = [
  { method: "GET",    path: "/api/users",     description: "Fetch all users" },
  { method: "POST",   path: "/api/users",     description: "Create a new user" },
  { method: "PUT",    path: "/api/users/:id", description: "Update a user by ID" },
  { method: "DELETE", path: "/api/users/:id", description: "Delete a user by ID" },
];

export default function ApiDemo() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState(null);

  const simulate = (method) => {
    setLoading(true);
    setActiveEndpoint(method);
    setResponse(null);
    setTimeout(() => {
      setResponse(MOCK_RESPONSES[method]);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-3">API Demo</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Simulate backend API calls. In production the frontend communicates with
          <code className="mx-1 bg-gray-100 px-1.5 py-0.5 rounded text-sm text-violet-600">backend/server.js</code>
          via HTTP requests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Endpoint List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Available Endpoints</h3>
          <div className="space-y-3">
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.method + ep.path}
                onClick={() => simulate(ep.method)}
                className={`w-full text-left bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                  activeEndpoint === ep.method ? "ring-2 ring-violet-400" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm text-gray-700 font-mono">{ep.path}</code>
                </div>
                <p className="text-gray-400 text-sm pl-1">{ep.description}</p>
              </button>
            ))}
          </div>

          {/* Backend Code Snippet */}
          <div className="mt-6 bg-gray-900 rounded-xl p-5 text-xs font-mono text-gray-300 shadow-lg">
            <p className="text-violet-400 mb-2 font-semibold text-sm">backend/routes/api.js</p>
            <pre className="leading-6 overflow-x-auto">{`import express from "express";
const router = express.Router();

// GET all users
router.get("/users", (req, res) => {
  res.json({ success: true, users });
});

// POST create user
router.post("/users", (req, res) => {
  const user = { id: Date.now(), ...req.body };
  users.push(user);
  res.status(201).json({ success: true, user });
});

export default router;`}</pre>
          </div>
        </div>

        {/* Response Panel */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Response</h3>
          <div className="bg-gray-900 rounded-2xl p-6 min-h-64 shadow-xl">
            {loading && (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400 text-sm">Sending request…</span>
              </div>
            )}
            {!loading && !response && (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5l.415-.207a.75.75 0 011.085.67V10.5m0 0h6m-6 0a3 3 0 00-3 3m9-3a3 3 0 013 3m-3-3v1.5m0 0v1.5m0-1.5h-6M4.5 19.5h15" />
                </svg>
                <span className="text-sm">Click an endpoint to simulate a request</span>
              </div>
            )}
            {!loading && response && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${response.status < 300 ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {response.status}
                  </span>
                  <span className="text-green-400 text-xs font-mono">
                    {response.status < 300 ? "OK" : "ERROR"}
                  </span>
                </div>
                <pre className="text-green-300 text-xs font-mono leading-6 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Frontend Code Snippet */}
          <div className="mt-6 bg-gray-900 rounded-xl p-5 text-xs font-mono text-gray-300 shadow-lg">
            <p className="text-violet-400 mb-2 font-semibold text-sm">frontend/src/pages/ApiDemo.jsx</p>
            <pre className="leading-6 overflow-x-auto">{`// Fetch from Express backend
const res = await fetch(
  "http://localhost:5000/api/users"
);
const data = await res.json();
setUsers(data.users);`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
