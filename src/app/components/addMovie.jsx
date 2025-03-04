"use client";

import { useState } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  increment,
  doc,
  serverTimestamp,
  setDoc,
  runTransaction,
} from "firebase/firestore";

export default function AddMovie({ onMovieAdded }) {
  const [movieName, setMovieName] = useState("");
  const [movieYear, setMovieYear] = useState("");
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
    if (!movieYear.trim()) return alert("Enter a movie year!");
    
    // Validate year is a number and in reasonable range
    const year = parseInt(movieYear);
    if (isNaN(year) || year < 1890 || year > new Date().getFullYear() + 5) {
      return alert("Please enter a valid year!");
    }

    try {
      setIsAdding(true);
      const formattedName = formatTitleCase(movieName);
      const moviesRef = collection(db, "movies");
      const counterRef = doc(db, "metadata", "movieCount");

      // Check if movie already exists (case-insensitive and same year)
      const q = query(
        moviesRef, 
        where("nameLower", "==", formattedName.toLowerCase()),
        where("year", "==", year)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        alert("Movie already exists for that year!");
        return;
      }

      // Use transaction for atomic update
      await runTransaction(db, async (transaction) => {
        // Ensure movieCount exists
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists()) {
          transaction.set(counterRef, { count: 0 });
        }

        // Add new movie with year
        transaction.set(doc(moviesRef), {
          name: formattedName,
          nameLower: formattedName.toLowerCase(),
          year: year,
          createdAt: serverTimestamp(),
        });

        // Increment counter
        transaction.update(counterRef, { count: increment(1) });
      });

      setMovieName("");
      setMovieYear("");
      alert(`Movie "${formattedName} (${year})" added!`);

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
      <div className="flex flex-col w-full max-w-md mb-4 gap-2">
        {/* Movie Name Input */}
        <input
          type="text"
          value={movieName}
          onChange={(e) => setMovieName(e.target.value)}
          placeholder="Enter movie name..."
          className="border p-2 rounded w-full"
          disabled={isAdding}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isAdding) {
              document.getElementById("yearInput").focus();
            }
          }}
        />
        
        {/* Movie Year Input */}
        <div className="flex w-full">
          <input
            id="yearInput"
            type="number"
            value={movieYear}
            onChange={(e) => setMovieYear(e.target.value)}
            placeholder="Enter movie year..."
            className="border p-2 rounded-l flex-grow"
            disabled={isAdding}
            min="1890"
            max={new Date().getFullYear() + 5}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAdding && movieName) {
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
    </div>
  );
}