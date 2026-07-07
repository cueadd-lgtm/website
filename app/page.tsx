'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useLocation, setUseLocation] = useState(false);

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) {
      setError('Please enter a valid ZIP code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/stores/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: zipCode.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to search stores');
      }

      router.push(`/results?zip=${encodeURIComponent(zipCode)}`);
    } catch (err) {
      setError('Error searching for stores. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError('');
    setUseLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch('/api/location/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!response.ok) {
            throw new Error('Failed to get location');
          }

          const data = await response.json();
          setZipCode(data.zipCode);
          router.push(`/results?zip=${encodeURIComponent(data.zipCode)}`);
        } catch (err) {
          setError('Failed to determine location. Please enter ZIP manually.');
          console.error(err);
        } finally {
          setLoading(false);
          setUseLocation(false);
        }
      },
      (error) => {
        setError('Unable to access your location. Please enter ZIP manually.');
        console.error(error);
        setLoading(false);
        setUseLocation(false);
      }
    );
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-green-600 mb-2">PennyScan</h1>
          <p className="text-gray-600 text-lg">Find penny deals & clearance items near you</p>
        </div>

        {/* Form */}
        <form onSubmit={handleZipSubmit} className="space-y-4 mb-6">
          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Your ZIP Code
            </label>
            <input
              id="zip"
              type="text"
              value={zipCode}
              onChange={(e) => {
                setZipCode(e.target.value.slice(0, 5));
                setError('');
              }}
              placeholder="12345"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-lg"
              maxLength={5}
              pattern="[0-9]{5}"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
          >
            {loading ? 'Searching...' : 'Search Deals'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t-2 border-gray-300"></div>
          <span className="text-gray-500 text-sm font-medium">OR</span>
          <div className="flex-1 border-t-2 border-gray-300"></div>
        </div>

        {/* Use Location Button */}
        <button
          onClick={handleUseLocation}
          disabled={loading || useLocation}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg mb-6"
        >
          {useLocation ? 'Getting location...' : '📍 Use My Location'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Features */}
        <div className="bg-gray-100 rounded-lg p-4 mt-8">
          <h3 className="font-bold text-gray-900 mb-3">What you'll find:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">💰</span>
              <span>Penny deals marked at $0.01</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">🔖</span>
              <span>Deep clearance items (70-90% off)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">🏪</span>
              <span>Exact aisle & section locations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">📍</span>
              <span>Distance from your location</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
