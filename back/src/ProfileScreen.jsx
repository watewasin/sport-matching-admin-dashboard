import React from 'react';
import { Settings, Edit3, MapPin, Trophy, Users, Star, LogOut, Medal, Gamepad2, Check, GraduationCap } from 'lucide-react';

const ProfileScreen = ({ user, setUser }) => {
  const totalGames = user.Bookings?.length || 0;
  const totalWins = user.Wins || 0; 

  return (
    <div className="bg-[#1a233a] min-h-full pb-20">
      <div className="px-6 pt-12 text-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <div className="flex gap-2">
            <button className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-sm">
              <Edit3 size={16}/> Edit
            </button>
            <button className="bg-white/10 p-2 rounded-full shadow-sm">
              <Settings size={20}/>
            </button>
            {/* Added a subtle logout button so you don't get trapped */}
            <button onClick={() => setUser(null)} className="bg-red-500/20 text-red-400 p-2 rounded-full ml-1">
              <LogOut size={20}/>
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center mt-4">
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" className="w-24 h-24 rounded-full border-4 border-[#22c55e] object-cover" />
            <div className="absolute bottom-0 right-0 bg-[#22c55e] border-2 border-[#1a233a] rounded-full p-1">
              <Check size={12} strokeWidth={4} className="text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mt-4">{user.Name}</h2>
          <p className="text-slate-400 text-sm flex items-center gap-1 mt-1"><MapPin size={14}/> {user.location || "Kuala Lumpur, MY"}</p>
          
          <div className="flex items-center gap-1 mt-2 text-orange-400 font-bold">
            <Star size={16} fill="currentColor"/>
            <Star size={16} fill="currentColor"/>
            <Star size={16} fill="currentColor"/>
            <Star size={16} fill="currentColor"/>
            <span className="text-white ml-1 text-sm">{user.Rating || '4.8'}</span> 
            <span className="text-slate-400 font-normal text-sm ml-1">(32 reviews)</span>
          </div>

          <div className="flex gap-2 mt-4">
            {(user.Tags || ["Friendly", "Competitive Player"]).map(tag => (
              <span key={tag} className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">{tag}</span>
            ))}
          </div>

          <p className="text-slate-400 text-xs mt-4 flex items-center gap-2">
            <GraduationCap size={16}/> Universiti Malaya · Intermediate
          </p>
        </div>

        {/* Bio Box */}
        <div className="mt-6 bg-[#26314c] rounded-2xl p-5 text-sm text-slate-200 leading-relaxed shadow-inner">
          {user.bio || "Passionate about sports and meeting new people. Love badminton and running!"}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mt-4">
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
            <p className="text-xl font-bold mt-2">{user.Buddie?.length || 12}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Buddies</p>
          </div>
          <div className="bg-[#26314c] rounded-2xl p-4 text-center flex flex-col items-center shadow-sm">
            <Gamepad2 size={20} className="text-purple-600"/>
            <p className="text-xl font-bold mt-2">0</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Hosted</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfileScreen;