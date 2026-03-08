import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';
import { Settings, Edit3, MapPin, Trophy, Users, Star, LogOut, Medal, Gamepad2, Plus, X } from 'lucide-react';

const ProfileScreen = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState('Sports');
  const [newTag, setNewTag] = useState('');
  const [loadingTag, setLoadingTag] = useState(false);

  // Dynamic Stats matching your clean slate
  const totalGames = user.Bookings?.length || 0;
  const totalWins = user.Wins || 0; 
  const totalBuddies = user.Buddie?.length || 0;
  const totalHosted = user.Hosted || 0;

  // Fallback blank profile picture
  const profilePic = user.ProfileImage || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  // 🔥 ADD TAG TO FIREBASE 🔥
  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    setLoadingTag(true);

    try {
      const tagToAdd = newTag.trim();
      await updateDoc(doc(db, 'profiles', user.id), { Tags: arrayUnion(tagToAdd) });
      setUser(prev => ({ ...prev, Tags: [...(prev.Tags || []), tagToAdd] }));
      setNewTag('');
    } catch (err) {
      console.error("Failed to add tag", err);
    }
    setLoadingTag(false);
  };

  // 🔥 REMOVE TAG FROM FIREBASE 🔥
  const handleRemoveTag = async (tagToRemove) => {
    try {
      await updateDoc(doc(db, 'profiles', user.id), { Tags: arrayRemove(tagToRemove) });
      setUser(prev => ({ ...prev, Tags: prev.Tags.filter(t => t !== tagToRemove) }));
    } catch (err) {
      console.error("Failed to remove tag", err);
    }
  };

  return (
    <div className="bg-[#1a233a] min-h-full flex flex-col pb-20">
      <div className="px-6 pt-12 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <div className="flex gap-2">
            <button className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-sm"><Edit3 size={16}/> Edit</button>
            <button className="bg-white/10 p-2 rounded-full shadow-sm"><Settings size={20}/></button>
            <button onClick={() => setUser(null)} className="bg-red-500/20 text-red-400 p-2 rounded-full ml-1"><LogOut size={20}/></button>
          </div>
        </div>

        <div className="flex flex-col items-center mt-4">
          <img src={profilePic} className="w-24 h-24 rounded-full border-4 border-[#22c55e] object-cover bg-white" alt="Profile" />
          
          <h2 className="text-3xl font-bold mt-4">{user.Name}</h2>
          
          {user.location && (
            <p className="text-slate-400 text-sm flex items-center gap-1 mt-1"><MapPin size={14}/> {user.location}</p>
          )}
          
          <div className="flex items-center gap-1 mt-2 text-orange-400 font-bold">
            <Star size={16} fill="currentColor"/>
            <span className="text-white ml-1 text-sm">{user.Rating}</span> 
          </div>

          {/* Dynamic Tags Area */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-[280px]">
            {(user.Tags || []).map(tag => (
              <span key={tag} className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold pl-3 pr-1 py-1 rounded-full flex items-center gap-1">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="hover:bg-green-500/20 rounded-full p-0.5"><X size={12}/></button>
              </span>
            ))}
          </div>

          {/* Add Tag Input Form */}
          <form onSubmit={handleAddTag} className="mt-3 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Add a tag..." 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="bg-white/10 text-xs text-white placeholder-gray-400 outline-none px-3 py-1.5 rounded-full w-28"
              maxLength={15}
            />
            <button type="submit" disabled={loadingTag || !newTag.trim()} className="bg-[#22c55e] p-1.5 rounded-full text-white disabled:opacity-50">
              <Plus size={14} />
            </button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mt-8">
          <div className="bg-[#26314c] rounded-2xl p-4 text-center flex flex-col items-center shadow-sm">
            <Medal size={20} className="text-orange-400"/>
            <p className="text-xl font-bold mt-2">{totalGames}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Games</p>
          </div>
          <div className="bg-[#26314c] rounded-2xl p-4 text-center flex flex-col items-center shadow-sm">
            <Trophy size={20} className="text-red-400"/>
            <p className="text-xl font-bold mt-2">{totalWins}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Wins</p>
          </div>
          <div className="bg-[#26314c] rounded-2xl p-4 text-center flex flex-col items-center shadow-sm">
            <Users size={20} className="text-purple-500"/>
            <p className="text-xl font-bold mt-2">{totalBuddies}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Buddies</p>
          </div>
          <div className="bg-[#26314c] rounded-2xl p-4 text-center flex flex-col items-center shadow-sm">
            <Gamepad2 size={20} className="text-purple-600"/>
            <p className="text-xl font-bold mt-2">{totalHosted}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Hosted</p>
          </div>
        </div>
      </div>
      {/* ... Rest of your bottom White sheet (Sports/History tabs) remains the same ... */}
    </div>
  );
};

export default ProfileScreen;