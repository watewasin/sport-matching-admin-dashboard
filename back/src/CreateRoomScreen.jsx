import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import { ChevronLeft, MapPin, Clock, Loader2, Target, Tag, Activity } from 'lucide-react';

const CreateRoomScreen = ({ setCurrentScreen, user, setUser }) => {
  const [allCourts, setAllCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCourts, setFetchingCourts] = useState(true);

  // Form State
  const [selectedSport, setSelectedSport] = useState('Badminton');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [level, setLevel] = useState('All Levels');
  const [tags, setTags] = useState('');

  // 1. Fetch ALL courts on load
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const courtsSnap = await getDocs(collection(db, 'courts'));
        const courtData = courtsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllCourts(courtData);

        // Auto-select the first Badminton court by default
        const initialCourts = courtData.filter(c => c.sporttype === 'Badminton');
        if (initialCourts.length > 0) setSelectedCourt(initialCourts[0].id);
      } catch (err) { console.error(err); }
      setFetchingCourts(false);
    };
    fetchCourts();
  }, []);

  // Filter courts dynamically based on the selected sport tab
  const filteredCourts = allCourts.filter(c => c.sporttype === selectedSport);

  // Handle Sport Tab Click
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    const available = allCourts.filter(c => c.sporttype === sport);
    setSelectedCourt(available.length > 0 ? available[0].id : '');
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!selectedCourt) return alert("Please select a valid court location first!");

    setLoading(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      // ── Parse 12-hour AM/PM times to 24-hour integers (e.g. "6:00 PM" -> 18) ──
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period && period.toLowerCase() === 'pm' && hours !== 12) hours += 12;
        if (period && period.toLowerCase() === 'am' && hours === 12) hours = 0;
        return hours;
      };

      const start24 = parseTime(startTime);
      const end24 = parseTime(endTime);

      // Find the actual court name for display in the dashboard
      const selectedCourtObj = allCourts.find(c => c.id === selectedCourt);
      const courtName = selectedCourtObj ? selectedCourtObj.location : selectedCourt;

      // Rate lookup (matching Dashboard SPORT_META)
      const sportRates = { 'badminton': 350, 'football': 1200, 'tennis': 700, 'basketball': 800, 'swimming': 500 };
      const ratePerHour = sportRates[selectedSport.toLowerCase()] || 600;

      const newBooking = {
        // App-specific fields
        Level: level,
        Tags: tagsArray,
        Status: "Join", // App UI status
        Member: [user.id],

        // Unified Dashboard Schema Fields
        sport: selectedSport.toLowerCase(),
        court: courtName,
        courtId: selectedCourt,
        time: `${String(start24).padStart(2, '0')}:00 – ${String(end24).padStart(2, '0')}:00`,
        startH: start24,
        endH: end24,
        name: user.name || 'App User', // assuming user has a name field
        phone: user.phone || '—',
        status: 'reserved',            // App bookings are assumed reserved
        source: 'app',
        currentStage: 'pending',
        stadiumId: 'STD-001',          // default placeholder for dashboard
        price: (end24 - start24) * ratePerHour,
        isPaid: false,
        date: new Date().toISOString().split('T')[0] // Defaults to today
      };

      const docRef = await addDoc(collection(db, 'bookings'), newBooking);
      await updateDoc(doc(db, 'profiles', user.id), { Bookings: arrayUnion(docRef.id) });
      setUser(prev => ({ ...prev, Bookings: [...(prev.Bookings || []), docRef.id] }));

      alert(`${selectedSport} room successfully created!`);
      setCurrentScreen('findGroup');
    } catch (err) {
      console.error(err);
      alert("Failed to create room.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#f8fafc] min-h-full pb-20">
      <div className="bg-[#1a233a] rounded-b-3xl px-6 pt-12 pb-8 text-white">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentScreen('home')} className="bg-white/10 p-2 rounded-full"><ChevronLeft size={20} /></button>
          <h1 className="text-xl font-bold">Create a Room</h1>
        </div>
      </div>

      <div className="px-6 mt-8">
        {fetchingCourts ? <Loader2 className="animate-spin mx-auto text-gray-400" /> : (
          <form onSubmit={handleCreateRoom} className="space-y-5">

            {/* NEW: Sport Selection Tabs */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Activity size={16} className="text-blue-500" /> Select Sport</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['Badminton', 'Football', 'Tennis', 'Running'].map(sport => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => handleSportChange(sport)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedSport === sport ? 'bg-[#22c55e] text-white shadow-md' : 'bg-white border text-gray-600 shadow-sm'}`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered Court Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-[#22c55e]" /> Court Location</label>
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border outline-none shadow-sm text-slate-700 font-medium appearance-none"
                disabled={filteredCourts.length === 0}
              >
                {filteredCourts.length > 0 ? (
                  filteredCourts.map(c => <option key={c.id} value={c.id}>{c.location}</option>)
                ) : (
                  <option value="">No courts available for {selectedSport}</option>
                )}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Clock size={16} className="text-orange-400" /> Start Time</label>
                <input type="text" placeholder="e.g. 6:00 PM" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-4 rounded-2xl bg-white border outline-none shadow-sm text-slate-700" required />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Clock size={16} className="text-orange-400" /> End Time</label>
                <input type="text" placeholder="e.g. 8:00 PM" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-4 rounded-2xl bg-white border outline-none shadow-sm text-slate-700" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Target size={16} className="text-blue-500" /> Skill Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full p-4 rounded-2xl bg-white border outline-none shadow-sm text-slate-700 font-medium appearance-none">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Tag size={16} className="text-purple-500" /> Special Requirements</label>
              <input type="text" placeholder="e.g. Female Only, Turf shoes" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full p-4 rounded-2xl bg-white border outline-none shadow-sm text-slate-700 placeholder-gray-400" />
            </div>

            <button type="submit" disabled={loading || !selectedCourt} className="w-full bg-[#22c55e] text-white font-bold py-4 rounded-2xl mt-4 shadow-lg flex justify-center disabled:opacity-50 transition-opacity">
              {loading ? <Loader2 className="animate-spin" /> : `Host ${selectedSport} Room`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateRoomScreen;