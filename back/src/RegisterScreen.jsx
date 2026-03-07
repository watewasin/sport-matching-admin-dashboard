import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react';

const RegisterScreen = ({ setUser, onSwitchToLogin }) => {
  const [profileId, setProfileId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Ensure no spaces in the Profile ID
    const cleanId = profileId.trim().toLowerCase().replace(/\s+/g, '_');

    try {
      // 1. Check if ID already exists
      const profileRef = doc(db, 'profiles', cleanId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setError("This Profile ID is already taken. Try another.");
        setLoading(false);
        return;
      }

      // 2. Create the new user document
      const newUser = {
        Name: name,
        Rating: 5.0, // Start new users with a perfect 5 star!
        Bookings: [],
        Buddie: [],
        Tags: ["New Player", "Friendly"]
      };

      await setDoc(profileRef, newUser);

      // 3. Log them in automatically
      setUser({ id: cleanId, ...newUser });
    } catch (err) {
      setError("Failed to register. Check your connection.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col justify-center px-8 bg-[#1a233a] h-full text-white">
      <button onClick={onSwitchToLogin} className="absolute top-12 left-6 bg-white/10 p-2 rounded-full text-white">
        <ArrowLeft size={20} />
      </button>

      <div className="bg-green-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-green-400">
        <UserPlus size={32} />
      </div>
      <h1 className="text-3xl font-bold mb-2">Create Account</h1>
      <p className="text-gray-400 mb-8">Join the sports community today.</p>
      
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Display Name (e.g., Sarah Chen)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-4 rounded-xl bg-white/10 outline-none text-white placeholder-gray-500"
          required
        />
        <input 
          type="text" 
          placeholder="Choose Profile ID (e.g., sarah_99)" 
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="p-4 rounded-xl bg-white/10 outline-none text-white placeholder-gray-500"
          required
        />
        
        {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[#22c55e] p-4 rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50 flex justify-center mt-4"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default RegisterScreen;