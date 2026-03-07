import React from 'react';
import { MapPin, Bell, Zap, Trophy, Users, ChevronRight, UserPlus, Dumbbell, Calendar } from 'lucide-react';

const HomeScreen = ({ setCurrentScreen, user }) => {
  return (
    <div>
      <div className="bg-[#1a233a] rounded-b-3xl px-6 pt-12 pb-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center text-emerald-400 mb-1 text-sm font-medium">
              <MapPin size={16} className="mr-1" /> Kuala Lumpur, MY
            </div>
            <h1 className="text-3xl font-bold">Hey, {user.Name.split(' ')[0]}! 👋</h1>
            <p className="text-gray-400 text-sm mt-1">Ready to play today?</p>
          </div>
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" className="w-10 h-10 rounded-full border-2 border-emerald-400 object-cover" />
        </div>

        <div className="bg-[#2a3650] rounded-2xl p-4 mt-6 flex justify-around text-center">
          <div><p className="font-bold flex justify-center gap-1"><Zap size={16} className="text-orange-400"/> {user.Bookings?.length || 0}</p><p className="text-xs text-gray-400 mt-1">Matches</p></div>
          <div className="w-px h-8 bg-gray-600"></div>
          <div><p className="font-bold flex justify-center gap-1"><Trophy size={16} className="text-orange-400"/> {user.Rating || '0.0'}★</p><p className="text-xs text-gray-400 mt-1">Rating</p></div>
          <div className="w-px h-8 bg-gray-600"></div>
          <div><p className="font-bold flex justify-center gap-1"><Users size={16} className="text-purple-400"/> {user.Buddie?.length || 0}</p><p className="text-xs text-gray-400 mt-1">Buddies</p></div>
        </div>
      </div>

      <div className="px-6 mt-6">
        <button className="w-full bg-[#22c55e] rounded-2xl p-4 flex items-center justify-between text-white shadow-lg mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-full"><Zap /></div>
            <div className="text-left"><h3 className="font-bold">Find Players Now ⚡</h3><p className="text-xs">Instant match with nearby players</p></div>
          </div>
          <ChevronRight />
        </button>

        <h2 className="text-lg font-bold text-[#0f172a] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setCurrentScreen('findGroup')} className="bg-white p-4 rounded-2xl border flex flex-col gap-3 text-left">
            <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center text-green-600"><Users /></div>
            <span className="font-bold text-sm text-slate-800">Find Sports Group</span>
          </button>
          <button className="bg-white p-4 rounded-2xl border flex flex-col gap-3 text-left">
            <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center text-orange-600"><UserPlus /></div>
            <span className="font-bold text-sm text-slate-800">Need 1 Player</span>
          </button>
          <button onClick={() => setCurrentScreen('createRoom')} className="bg-white p-4 rounded-2xl border flex flex-col gap-3 text-left shadow-sm">
            <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600"><Calendar /></div>
            <span className="font-bold text-sm text-slate-800">Create a Room</span>
          </button>
          <button onClick={() => setCurrentScreen('hireBuddy')} className="bg-white p-4 rounded-2xl border flex flex-col gap-3 text-left shadow-sm">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600"><Dumbbell /></div>
            <span className="font-bold text-sm text-slate-800">Hire a Sports Buddy</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;