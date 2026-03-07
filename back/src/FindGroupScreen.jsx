import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { ChevronLeft, Search, SlidersHorizontal, MapPin, Calendar, Users, Loader2 } from 'lucide-react';

const FindGroupScreen = ({ setCurrentScreen, onSelectMatch, user }) => {
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedSportTab, setSelectedSportTab] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courtsSnap = await getDocs(collection(db, 'courts'));
        const courtMap = {};
        courtsSnap.forEach(doc => { courtMap[doc.id] = doc.data(); });
        setCourts(courtMap);

        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        setBookings(bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter bookings based on selected sport tab
  const filteredBookings = bookings.filter(b => {
    if (selectedSportTab === 'All') return true;
    return b.sport?.toLowerCase() === selectedSportTab.toLowerCase();
  });

  return (
    <div className="bg-[#f8fafc] min-h-full pb-20">
      <div className="bg-[#1a233a] rounded-b-3xl px-6 pt-12 pb-6 text-white">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentScreen('home')} className="bg-white/10 p-2 rounded-full"><ChevronLeft size={20} /></button>
          <h1 className="text-xl font-bold">Find Sports Group</h1>
        </div>
        <div className="mt-6 flex gap-3">
          <div className="flex-1 bg-white/10 rounded-xl flex items-center px-4 py-3">
            <Search size={20} className="mr-2 text-gray-400" />
            <input type="text" placeholder="Search location or sport..." className="bg-transparent outline-none w-full text-sm" />
          </div>
          <button className="bg-white/10 p-3 rounded-xl"><SlidersHorizontal size={20} /></button>
        </div>
      </div>

      <div className="px-6 mt-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {['All', 'Badminton', 'Football', 'Basketball', 'Tennis', 'Swimming'].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setSelectedSportTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${selectedSportTab === tab ? 'bg-green-500 text-white shadow-md' : 'bg-white border text-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? <Loader2 className="animate-spin mx-auto mt-10 text-gray-400" /> : (
          <div className="space-y-4 pb-4">
            <p className="text-sm text-gray-500">{filteredBookings.length} games found</p>
            {filteredBookings.map((booking) => {
              // Now we can use the unified schema `court` string exactly, or fallback to the courtsmap lookup if needed
              const locationStr = booking.court || (courts[booking.courtId || booking.CourtID]?.location) || 'Unknown Court';
              const isJoined = user.Bookings?.includes(booking.id);

              return (
                <div key={booking.id} onClick={() => onSelectMatch(booking)} className="bg-white p-3 rounded-2xl border shadow-sm flex gap-4 cursor-pointer">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase">{booking.sport || booking.courtDetails?.sporttype || "Match"}</span>
                      {booking.Level && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold">{booking.Level}</span>}
                    </div>

                    <div className="text-gray-500 text-xs mt-2 flex items-center gap-1.5"><MapPin size={12} /> {locationStr}</div>
                    <div className="text-gray-500 text-xs mt-1 flex items-center gap-1.5"><Calendar size={12} /> {booking.time || booking.start}</div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                      <span className="text-slate-600 text-xs font-bold flex items-center gap-1.5"><Users size={12} /> {booking.Member?.length || 0} Players</span>
                      <span className={`text-[10px] font-bold px-4 py-1.5 rounded-full ${isJoined ? 'bg-red-50 text-red-500' : 'bg-[#22c55e] text-white'}`}>
                        {isJoined ? 'Joined' : 'Join'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindGroupScreen;