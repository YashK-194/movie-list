"use client";

import { useState, useEffect } from "react";

export default function MovieDetailsPopup({ movieName, movieYear, isOpen, onClose }) {
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const apiKey = "e6d807ea"; // Replace with your actual API key
        const response = await fetch(
          `https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}${
            movieYear ? `&y=${movieYear}` : ""
          }&apikey=${apiKey}`
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.Response === "False") {
          setError(data.Error || "Movie not found");
          setMovieDetails(null);
        } else {
          setMovieDetails(data);
        }
      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError("Failed to load movie details");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [isOpen, movieName, movieYear]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-200 p-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Movie Details</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-3xl font-light leading-none"
          >
            &times;
          </button>
        </div>
        
        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-700"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-center p-6 rounded-lg">
              <p className="text-lg font-semibold">{error}</p>
              <p className="mt-2 text-red-600">
                Try checking the movie name or year for accuracy.
              </p>
            </div>
          )}
          
          {!loading && !error && movieDetails && (
            <div className="flex flex-col md:flex-row gap-6">
              {movieDetails.Poster && movieDetails.Poster !== "N/A" ? (
                <img
                  src={movieDetails.Poster}
                  alt={`${movieDetails.Title} poster`}
                  className="w-full md:w-48 h-auto object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full md:w-48 h-72 bg-gray-200 flex items-center justify-center rounded-lg shadow-lg">
                  <span className="text-gray-500 font-medium">No Poster Available</span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  {movieDetails.Title} {movieDetails.Year && `(${movieDetails.Year})`}
                </h3>
                
                <div className="mb-4 flex flex-wrap gap-2">
                  {movieDetails.Genre?.split(", ").map((genre) => (
                    <span key={genre} className="bg-red-100 text-blue-900 px-2.5 py-1 rounded-md text-sm font-medium">
                      {genre}
                    </span>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-gray-800">
                  {movieDetails.imdbRating && (
                    <div className="bg-gray-200 p-2.5 rounded">
                      <span className="font-bold text-gray-900 mr-2">IMDB Rating:</span> 
                      <span className="text-blue-800 font-semibold">{movieDetails.imdbRating}/10</span>
                    </div>
                  )}
                  {movieDetails.Runtime && (
                    <div className="bg-gray-200 p-2.5 rounded">
                      <span className="font-bold text-gray-900 mr-2">Runtime:</span> {movieDetails.Runtime}
                    </div>
                  )}
                  {movieDetails.Director && movieDetails.Director !== "N/A" && (
                    <div className="bg-gray-200 p-2.5 rounded">
                      <span className="font-bold text-gray-900 mr-2">Director:</span> {movieDetails.Director}
                    </div>
                  )}
                  {movieDetails.Actors && (
                    <div className="bg-gray-200 p-2.5 rounded">
                      <span className="font-bold text-gray-900 mr-2">Actors:</span> {movieDetails.Actors}
                    </div>
                  )}
                </div>
                
                {movieDetails.Plot && movieDetails.Plot !== "N/A" && (
                  <div className="mb-4 bg-blue-100 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">Plot</h4>
                    <p className="text-gray-800 leading-relaxed">{movieDetails.Plot}</p>
                  </div>
                )}
                
                {movieDetails.Awards && movieDetails.Awards !== "N/A" && (
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">Awards</h4>
                    <p className="text-gray-800">{movieDetails.Awards}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}