"use client";

import { useState } from "react";
import { auth } from "../firebase/config"; // Adjust path if needed
import { signInWithEmailAndPassword } from "firebase/auth";
import SignUpModal from "./SignUpModal";

export default function SignInModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false); // State for SignUpModal

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose(); // Close modal on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-40 backdrop-blur-md z-50">
        <div className="relative bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-lg w-full text-gray-900">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <form onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded mb-4"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-3">
            New user?{" "}
            <button
              onClick={() => {
                onClose(); // Close sign-in modal
                setIsSignUpOpen(true); // Open sign-up modal
              }}
              className="text-blue-600 hover:underline"
            >
              Sign up
            </button>
          </p>
          <SignUpModal
             isOpen={isSignUpOpen}
             onClose={() => setIsSignUpOpen(false)}
          />

        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-600 hover:text-gray-900"
        >
          Close
        </button>
      </div>
    </div>
  );
}
