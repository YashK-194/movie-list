"use client";

import { useState, useEffect, useRef } from "react";
import AddMovieForm from "../app/components/addMovie";
import { db, auth } from "../app/firebase/config"; // Adjust path if needed
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import fetchMovies from "../app/components/fetchMovies";
import Modal from "../app/components/Modal";
import SignInModal from "../app/components/SignInModal";
import MovieDetailsPopup from "../app/components/MovieDetailsPopup";
import { signOut, onAuthStateChanged } from "firebase/auth";

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movieCount, setMovieCount] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [user, setUser] = useState(null); // Track user state

  // New state for movie details popup
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Add this function to handle movie selection
  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setIsDetailsOpen(true);
  };

  const fetchMovieCount = async () => {
    try {
      const countDoc = await getDoc(doc(db, "metadata", "movieCount"));
      if (countDoc.exists()) {
        setMovieCount(countDoc.data().count);
      }
    } catch (error) {
      console.error("Error fetching movie count:", error);
    }
  };

  const deleteMovie = async (movieId) => {
    try {
      await deleteDoc(doc(db, "movies", movieId));

      // Update the movie count in metadata
      const countDocRef = doc(db, "metadata", "movieCount");
      const countDoc = await getDoc(countDocRef);
      if (countDoc.exists()) {
        const currentCount = countDoc.data().count;
        await updateDoc(countDocRef, {
          count: currentCount - 1,
        });
      }

      setMovies((prev) => prev.filter((movie) => movie.id !== movieId));
      fetchMovieCount(); // Fetch updated count
      setForceRefresh((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting movie:", error);
    }
  };

  const refreshMovies = async () => {
    setLoading(true);
    setMovies([]);

    try {
      // Get fresh data directly from Firestore
      const querySnapshot = await getDocs(collection(db, "movies"));
      const moviesData = [];
      querySnapshot.forEach((doc) => {
        moviesData.push({ id: doc.id, ...doc.data() });
      });
      setMovies(moviesData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError("Failed to load movies");
      setLoading(false);
    }

    fetchMovieCount();
  };

  useEffect(() => {
    fetchMovieCount();
    refreshMovies(); // Use our direct Firestore fetch for consistent results

    // We'll keep this for realtime updates, but initial load comes from refreshMovies
    const unsubscribe = fetchMovies(
      (movie) => {
        // Only add the movie if it's not already in the list
        setMovies((prev) => {
          if (!prev.some((m) => m.id === movie.id)) {
            return [...prev, movie];
          }
          return prev;
        });
      },
      () => setLoading(false),
      (err) => {
        console.error("Error fetching movies:", err);
        setError("Failed to load movies");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [forceRefresh]); // Dependency on forceRefresh to reload after deletions

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return "Unknown Date";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredMovies = movies
    .slice()
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .filter((movie) =>
      movie.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="relative flex flex-col items-center min-h-screen p-6 overflow-hidden">
      {/* Enhanced animated background with deeper colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-purple-800 to-pink-800 animate-pulse opacity-70 -z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-700 via-transparent to-amber-700 animate-pulse delay-300 opacity-60 -z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-cyan-700 via-transparent to-indigo-900 animate-pulse delay-700 opacity-50 -z-10"></div>

      {/* Animated floating shapes with deeper colors and wider movement range */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-700 opacity-30 blur-3xl animate-bounce delay-200 -z-10 transform translate-x-16 -translate-y-8"></div>
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-blue-800 opacity-40 blur-3xl animate-bounce delay-500 -z-10 transform -translate-x-20 translate-y-12"></div>
      <div className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-purple-700 opacity-30 blur-3xl animate-bounce delay-700 -z-10 transform translate-y-16 -translate-x-24"></div>
      <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-amber-700 opacity-40 blur-3xl animate-bounce -z-10 transform translate-x-12 translate-y-8"></div>

      {/* Add Movie & Sign In Buttons at Top Left & Right */}
      {user?.email === "yashkm194@gmail.com" && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-all flex items-center relative opacity-80"
          >
            <span className="mr-2">➕</span> Add New Movie
          </button>
        </div>
      )}

      {/* Sign In / Logout Button */}
      <div className="absolute top-4 right-4 z-10">
        {user ? (
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-red-700 transition-all opacity-80"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => setIsSignInOpen(true)}
            className="bg-gray-700 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      />

      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />

      <div className="relative z-10 w-full max-w-lg">
        <h1 className="text-4xl font-extrabold text-white drop-shadow-lg text-center mt-12 mb-2">
          🎬 Yash's Movie List
        </h1>

        {/* Added description */}
        <p className="text-white text-center mb-6 italic text-lg shadow-sm">
          A List of all the movies I've watched and recommend watching.
        </p>
        <br />

        {/* Total Movies Count */}
        <p className="text-white text-lg font-semibold text-center mb-4">
          Total Movies: {movieCount}
        </p>

        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400 mb-6 bg-white text-gray-800"
        />

        <div className="w-full bg-white bg-opacity-90 backdrop-blur-lg shadow-xl rounded-lg p-4">
          {loading && (
            <p className="text-gray-700 text-center font-semibold">
              Loading movies...
            </p>
          )}
          {error && <p className="text-red-500 text-center">{error}</p>}

          {filteredMovies.length === 0 && !loading ? (
            <p className="text-gray-700 text-center">No movies found.</p>
          ) : (
            <ul className="divide-y divide-gray-300">
              {filteredMovies.map((movie) => (
                <li
                  key={movie.id}
                  className="p-3 hover:bg-gray-200 transition-all text-base font-semibold text-gray-900 flex justify-between items-center relative cursor-pointer"
                  onClick={() => handleMovieClick(movie)}
                >
                  <span>‣ {movie.name}</span>
                  <div
                    className="flex items-center space-x-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-gray-500 mr-2">
                      {formatDate(movie.createdAt)}
                    </span>
                    {user?.email === "yashkm194@gmail.com" && (
                      <MovieOptions onDelete={() => deleteMovie(movie.id)} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Modal for Add Movie Form */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <h2 className="text-xl font-bold mb-4">Add a New Movie</h2>
          <AddMovieForm
            onMovieAdded={() => {
              setIsModalOpen(false);
              refreshMovies();
            }}
          />
        </Modal>

        {/* Movie Details Popup */}
        <MovieDetailsPopup
          movieName={selectedMovie?.name || ""}
          movieYear={selectedMovie?.year || ""}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedMovie(null);
          }}
        />
      </div>
    </div>
  );
}

// MovieOptions Component for Three-Dot Menu
function MovieOptions({ onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="ml-2 p-1 text-gray-600 hover:text-gray-900 z-20"
      >
        ⋮
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white border rounded-lg shadow-lg z-30">
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}



// Services: {
//   [serviceId]:{
//     description: "STRING",
//     location:{
//       address:"STRING",
//       latitude:NUMBER,
//       longitude:NUMBER
//       timestamp:"STRING",
//     },
//     price:{
//       max:"STRING",
//       min:"STRING",
//     },
//     timestamp:"STRING",
//     title:"STRING",
//     userId:"STRING"
//   }

// }

// Users:{
//   [userId]:{
//     email:"STRING",
//     location:{
//       address:"STRING",
//       latitude:NUMBER,
//       longitude:NUMBER
//       timestamp:"STRING",
//     },
//     name:"STRING",
//     phone:"STRING",
//     services:ARRAY_OF_STRING
//   }
// }