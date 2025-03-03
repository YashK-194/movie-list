"use client";

import { useState } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  doc,
  serverTimestamp,
  setDoc,
  runTransaction,
} from "firebase/firestore";

export default function addMovie({ onMovieAdded }) {
  const [movieName, setMovieName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const formatTitleCase = (name) => {
    return name
      .trim()
      .split(" ")
      .filter(word => word !== "")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const addMovie = async () => {
    if (!movieName.trim()) return alert("Enter a movie name!");

    try {
      setIsAdding(true);
      const formattedName = formatTitleCase(movieName);
      const moviesRef = collection(db, "movies");
      const counterRef = doc(db, "metadata", "movieCount");

      // Check if movie already exists (case-insensitive)
      const q = query(moviesRef, where("nameLower", "==", formattedName.toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        alert("Movie already exists!");
        return;
      }

      // Use transaction for atomic update
      await runTransaction(db, async (transaction) => {
        // Ensure movieCount exists
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists()) {
          transaction.set(counterRef, { count: 0 });
        }

        // Add new movie
        transaction.set(doc(moviesRef), {
          name: formattedName,
          nameLower: formattedName.toLowerCase(),
          createdAt: serverTimestamp(),
        });

        // Increment counter
        transaction.update(counterRef, { count: increment(1) });
      });

      setMovieName("");
      alert(`Movie "${formattedName}" added!`);

      if (typeof onMovieAdded === "function") {
        onMovieAdded();
      }
    } catch (error) {
      console.error("Error adding movie:", error);
      alert(`Error adding movie: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="flex w-full max-w-md mb-4">
        <input
          type="text"
          value={movieName}
          onChange={(e) => setMovieName(e.target.value)}
          placeholder="Enter movie name..."
          className="border p-2 rounded-l flex-grow"
          disabled={isAdding}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isAdding) {
              addMovie();
            }
          }}
        />
        <button 
          onClick={addMovie} 
          className={`${
            isAdding ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
          } text-white px-4 py-2 rounded-r transition-colors`}
          disabled={isAdding}
        >
          {isAdding ? "Adding..." : "Add Movie"}
        </button>
      </div>
    </div>
  );
}
