'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface StoreItem {
  id: string;
  itemName: string;
  category: string;
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  dealType: string;
  aisleNumber?: string;
  section?: string;
  notes?: string;
}

interface Store {
  id: string;
  name: string;
  chain: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  distance: number;
  items: StoreItem[];
  lastUpdated: string;
}

export default function Results() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const zip = searchParams.get('zip');
  
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterChain, setFilterChain] = useState('ALL');
  const [filterDiscount, setFilterDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!zip) {
      router.push('/');
      return;
    }

    const fetchStores = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stores/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode: zip }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stores');
        }

        const data = await response.json();
        setStores(data.stores || []);
      } catch (err) {
        setError('Failed to load deals. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [zip, router]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stores/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: zip }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh');
      }

      const data = await response.json();
      setStores(data.stores || []);
    } catch (err) {
      setError('Failed to refresh deals.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores
    .filter((store) => filterChain === 'ALL' || store.chain === filterChain)
    .map((store) => ({
      ...store,
      items: store.items.filter(
        (item) =>
          item.discountPercent >= filterDiscount &&
          (searchTerm === '' ||
            item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    }))
    .filter((store) => store.items.length > 0);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-green-600 hover:text-green-700 font-semibold mb-4 inline-block">
            ← Back to Search
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Penny Deals Near You</h1>
          <p className="text-gray-600">ZIP Code: {zip}</p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="mb-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh Deals'}
        </button>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
              <input
                type="text"
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Chain</label>
              <select
                value={filterChain}
                onChange={(e) => setFilterChain(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="ALL">All Stores</option>
                <option value="WALMART">Walmart</option>
                <option value="TARGET">Target</option>
                <option value="BEST_BUY">Best Buy</option>
                <option value="HOME_DEPOT">Home Depot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Discount</label>
              <select
                value={filterDiscount}
                onChange={(e) => setFilterDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="0">Any Discount</option>
                <option value="30">30% Off</option>
                <option value="50">50% Off</option>
                <option value="70">70% Off</option>
                <option value="90">90% Off</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="text-4xl">🔄</div>
            </div>
            <p className="text-gray-600 mt-4">Loading deals...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredStores.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-gray-600 text-lg">No penny deals found near {zip}</p>
            <p className="text-gray-500 mt-2">Try expanding your radius or check back later for new deals</p>
          </div>
        )}

        {/* Stores List */}
        <div className="space-y-6">
          {filteredStores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              {/* Store Header */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b-2 border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
                    <p className="text-gray-600 text-sm">{store.address}</p>
                    <p className="text-gray-600 text-sm">{store.city}, {store.state} {store.zip}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-600 text-white rounded-full px-3 py-1 text-sm font-bold">
                      📍 {store.distance.toFixed(1)} mi
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Updated: {new Date(store.lastUpdated).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y">
                {store.items.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.itemName}</h3>
                        <p className="text-sm text-gray-600">{item.category}</p>
                      </div>
                      <div className="text-right ml-4">
                        {item.dealType === 'PENNY' ? (
                          <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">💰 PENNY DEAL</span>
                        ) : (
                          <span className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">{item.discountPercent}% OFF</span>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center gap-4 mb-3">
                      {item.originalPrice > 0 && (
                        <span className="text-gray-500 line-through text-sm">${item.originalPrice.toFixed(2)}</span>
                      )}
                      <span className="text-2xl font-bold text-green-600">${item.currentPrice.toFixed(2)}</span>
                    </div>

                    {/* Location */}
                    <div className="bg-blue-50 rounded p-3 flex items-start gap-2">
                      <span className="text-lg">📍</span>
                      <div>
                        {item.aisleNumber && <p className="font-semibold text-gray-900">Aisle {item.aisleNumber}</p>}
                        {item.section && <p className="text-sm text-gray-700">{item.section}</p>}
                        {item.notes && <p className="text-xs text-gray-600 italic mt-1">{item.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
