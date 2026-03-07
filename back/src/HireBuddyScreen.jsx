import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { ChevronLeft, Filter, Search, Star, MapPin, Loader2 } from 'lucide-react';

const HireBuddyScreen = ({ setCurrentScreen }) => {
  const [buddies, setBuddies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const fetchBuddies = async () => {
      try {
        const snap = await getDocs(collection(db, 'buddies'));
        setBuddies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchBuddies();
  }, []);

  return (
    <div className="bg-[#f8fafc] min-h-full pb-24">
      {/* Header */}
      <div className="bg-[#2563eb] rounded-b-3xl px-6 pt-12 pb-20 text-white relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentScreen('home')} className="bg-white/10 p-2 rounded-full"><ChevronLeft size={20}/></button>
            <div>
              <h1 className="text-xl font-bold">Hire a Sports Buddy</h1>
              <p className="text-blue-200 text-sm">Find your perfect play partner</p>
            </div>
          </div>
          <button className="bg-white/10 p-2 rounded-full"><Filter size={20}/></button>
        </div>

        {/* Search Bar - Positioned to overlap the bottom edge */}
        <div className="absolute -bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center px-4 py-3 shadow-lg">
          <Search size={20} className="text-white/70 mr-3" />
          <input type="text" placeholder="Search buddy by name or sport..." className="bg-transparent outline-none w-full text-white placeholder-white/70 text-sm" />
        </div>
      </div>

      <div className="px-6 mt-12">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-[#ea580c] text-white' : 'bg-white border text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-400 mb-4">{buddies.length} buddies available</p>

        {/* Buddy List */}
        {loading ? <Loader2 className="animate-spin mx-auto mt-10 text-gray-400" /> : (
          <div className="space-y-4">
            {buddies.map(buddy => (
              <div key={buddy.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative">
                <div className="flex gap-4 mb-4">
                  <div className="relative">
                    <img src={buddy.Image || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"} className="w-20 h-20 rounded-2xl object-cover" />
                    {buddy.Badge && (
                      <span className={`absolute -top-2 -left-2 text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-sm ${buddy.Badge === 'Top Rated' ? 'bg-[#eab308]' : 'bg-[#ea580c]'}`}>
                        {buddy.Badge}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-slate-800">{buddy.Name}</h3>
                      <div className="text-right">
                        <span className="text-[#2563eb] font-bold text-lg">฿{buddy.Price}</span>
                        <p className="text-[10px] text-gray-400">/hr</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1 text-sm font-bold text-slate-700">
                      <Star size={14} fill="#eab308" className="text-[#eab308]"/> {buddy.Rating} <span className="text-gray-400 font-normal">({buddy.Reviews})</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {buddy.Tags?.map(tag => (
                        <span key={tag} className={`text-[10px] font-bold px-2 py-1 rounded-full ${tag === 'Advanced' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4 ml-1">
                  <MapPin size={12}/> {buddy.Distance} km away
                </div>

                <button className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-sm">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HireBuddyScreen;