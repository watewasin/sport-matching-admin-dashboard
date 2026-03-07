import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ChevronLeft, Share2, MapPin, Calendar, Users, MessageCircle, XCircle, CheckCircle2, Loader2, Tag } from 'lucide-react';

const MatchDetailsScreen = ({ booking, setCurrentScreen, user, setUser }) => {
  const [loading, setLoading] = useState(false);

  if (!booking) return null;
  const isJoined = user.Bookings?.includes(booking.id);

  // JOIN LOGIC
  const handleJoinParty = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'bookings', booking.id), { Member: arrayUnion(user.id) });
      await updateDoc(doc(db, 'profiles', user.id), { Bookings: arrayUnion(booking.id) });
      setUser(prev => ({ ...prev, Bookings: [...(prev.Bookings || []), booking.id] }));
      booking.Member.push(user.id);
      alert("Successfully joined!");
    } catch (err) { alert("Failed to join."); }
    setLoading(false);
  };

  // LEAVE LOGIC (With Auto-Delete)
  const handleLeaveParty = async () => {
    setLoading(true);
    try {
      const isLastMember = booking.Member.length === 1 && booking.Member.includes(user.id);

      if (isLastMember) {
        // 1A. Destroy the room entirely
        await deleteDoc(doc(db, 'bookings', booking.id));
        alert("Room was empty, so it was deleted.");
      } else {
        // 1B. Just remove the user
        await updateDoc(doc(db, 'bookings', booking.id), { Member: arrayRemove(user.id) });
      }

      // 2. Remove from User's profile
      await updateDoc(doc(db, 'profiles', user.id), { Bookings: arrayRemove(booking.id) });

      // 3. Sync local state
      setUser(prev => ({ ...prev, Bookings: prev.Bookings.filter(id => id !== booking.id) }));
      setCurrentScreen('findGroup');
    } catch (err) {
      console.error(err);
      alert("Failed to leave match.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white min-h-full pb-24">
      {/* Header Image */}
      <div className="relative h-64">
        <img src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute top-12 px-6 w-full flex justify-between">
          <button onClick={() => setCurrentScreen('findGroup')} className="bg-white p-2 rounded-full"><ChevronLeft size={20} /></button>
          <button className="bg-white p-2 rounded-full"><Share2 size={20} /></button>
        </div>
        <div className="absolute bottom-6 px-6 text-white">
          <h1 className="text-3xl font-bold uppercase tracking-wider">{booking.sport || booking.courtDetails?.sporttype || "Match"}</h1>
          <div className="flex gap-2 mt-2">
            <span className="bg-orange-500 px-3 py-1 rounded-full text-xs font-bold">{booking.Level || "All Levels"}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-600"><MapPin className="text-gray-400" size={20} /> <span className="font-semibold text-sm">{booking.court || booking.courtDetails?.location || 'Unknown Court'}</span></div>
          <div className="flex items-center gap-3 text-slate-600"><Calendar className="text-gray-400" size={20} /> <span className="font-semibold text-sm">{booking.time || `${booking.start} - ${booking.end}`}</span></div>
          <div className="flex items-center gap-3 text-slate-600"><Users className="text-orange-400" size={20} /> <span className="font-semibold text-sm">{booking.Member?.length} Players joined</span></div>
        </div>

        {/* Display Custom Tags if they exist */}
        {booking.Tags && booking.Tags.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2"><Tag size={14} /> Special Requirements</h2>
            <div className="flex flex-wrap gap-2">
              {booking.Tags.map(tag => (
                <span key={tag} className="bg-purple-50 text-purple-600 border border-purple-100 text-xs font-bold px-3 py-1.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 w-[400px] bg-white border-t p-4 flex gap-3 z-50">
        {isJoined ? (
          <>
            <button className="flex-1 border-2 border-green-500 text-green-500 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm">
              <MessageCircle size={18} /> Chat
            </button>
            <button onClick={handleLeaveParty} disabled={loading} className="flex-[2] bg-red-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><XCircle size={18} /> Leave Match</>}
            </button>
          </>
        ) : (
          <button onClick={handleJoinParty} disabled={loading} className="w-full bg-[#22c55e] text-white font-bold py-4 rounded-2xl disabled:opacity-50 flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : "Join Match"}
          </button>
        )}
      </div>
    </div>
  );
};
export default MatchDetailsScreen;