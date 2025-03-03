import { db } from "../firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

// Cache constants
const MOVIES_CACHE_KEY = "cached_movies";
const CACHE_EXPIRY_KEY = "cached_movies_expiry";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches movies from Firestore without duplicates.
 * @param {Function} onMovieReceived - Callback for each movie as it's loaded.
 * @param {Function} onComplete - Callback when all movies are loaded.
 * @param {Function} onError - Callback for handling errors.
 * @param {boolean} forceRefresh - Whether to bypass cache.
 * @returns {Function} - Unsubscribe function to stop listening.
 */
export default function fetchMovies(onMovieReceived, onComplete, onError, forceRefresh = false) {
  try {
    if (!forceRefresh) {
      const cachedData = checkMoviesCache();
      if (cachedData) {
        console.log("Using cached movie data");
        cachedData.forEach(onMovieReceived);
        onComplete?.();
        return () => {}; // No need for Firestore subscription
      }
    }

    console.log("Streaming fresh movie data from Firestore");
    const moviesRef = collection(db, "movies");
    const q = query(moviesRef, orderBy("createdAt", "desc"));

    const allMovies = new Map(); // Prevents duplicates

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const newMovies = [];

        querySnapshot.forEach((doc) => {
          if (!allMovies.has(doc.id)) {
            const movie = { id: doc.id, ...doc.data() };
            allMovies.set(movie.id, movie);
            newMovies.push(movie);
          }
        });

        if (newMovies.length > 0) {
          newMovies.forEach(onMovieReceived);
          cacheMovies(Array.from(allMovies.values()));
        }

        onComplete?.();
      },
      (error) => {
        console.error("Error streaming movies:", error);
        onError?.(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up movie stream:", error);
    onError?.(error);
    return () => {}; // Return an empty function as a fallback
  }
}

/**
 * Checks cached movies.
 * @returns {Array|null} Cached movies or null if expired/invalid.
 */
function checkMoviesCache() {
  try {
    const expiryTimestamp = localStorage.getItem(CACHE_EXPIRY_KEY);
    const cachedData = localStorage.getItem(MOVIES_CACHE_KEY);

    if (!expiryTimestamp || !cachedData) return null;
    if (Date.now() < Number(expiryTimestamp)) {
      return JSON.parse(cachedData);
    }

    // Expired cache, clear it
    localStorage.removeItem(MOVIES_CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    return null;
  } catch (error) {
    console.error("Error checking movies cache:", error);
    return null;
  }
}

/**
 * Caches movies in localStorage.
 * @param {Array} movies - Movies to cache.
 */
function cacheMovies(movies) {
  try {
    localStorage.setItem(MOVIES_CACHE_KEY, JSON.stringify(movies));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    console.log(`Cached ${movies.length} movies successfully`);
  } catch (error) {
    console.error("Error caching movies:", error);
  }
}
