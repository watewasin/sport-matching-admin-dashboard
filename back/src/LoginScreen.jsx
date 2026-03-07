import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Loader2 } from 'lucide-react';

const LoginScreen = ({ setUser, onSwitchToRegister }) => {
  const [profileId, setProfileId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const profileRef = doc(db, 'profiles', profileId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setUser({ id: profileSnap.id, ...profileSnap.data() });
      } else {
        setError("Profile ID not found.");
      }
    } catch (err) {
      setError("Failed to connect to Firebase.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col justify-center px-8 bg-[#1a233a] h-full text-white relative">
      <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
      <p className="text-gray-400 mb-8">Enter your Profile ID to continue.</p>
      
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Profile ID (e.g., user_1)" 
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="p-4 rounded-xl bg-white/10 outline-none text-white placeholder-gray-500"
          required
        />
        {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[#22c55e] p-4 rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50 flex justify-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Log In"}
        </button>
      </form>

      {/* NEW: Switch to Register Button */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">Don't have an account?</p>
        <button onClick={onSwitchToRegister} className="text-green-400 font-bold mt-2 hover:underline">
          Create an Account
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;