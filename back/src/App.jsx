import React, { useState } from 'react';
import { Home, Swords, Calendar, MessageSquare, User } from 'lucide-react';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen'; // <-- IMPORT THIS
import CreateRoomScreen from './CreateRoomScreen';
import HomeScreen from './HomeScreen';
import FindGroupScreen from './FindGroupScreen';
import MatchDetailsScreen from './MatchDetailsScreen';
import ProfileScreen from './ProfileScreen';
import HireBuddyScreen from './HireBuddyScreen';

const App = () => {
  const [user, setUser] = useState(null); 
  const [isRegistering, setIsRegistering] = useState(false); // <-- NEW STATE
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const navigateToDetails = (booking) => {
    setSelectedBooking(booking);
    setCurrentScreen('matchDetails');
  };

  // If not logged in, show Login OR Register
  if (!user) {
    return (
      <div className="flex justify-center min-h-screen py-10 bg-gray-200 font-sans">
        <div className="w-[400px] h-[850px] bg-white rounded-[40px] overflow-hidden shadow-2xl relative ring-8 ring-gray-800">
          {isRegistering ? (
            <RegisterScreen setUser={setUser} onSwitchToLogin={() => setIsRegistering(false)} />
          ) : (
            <LoginScreen setUser={setUser} onSwitchToRegister={() => setIsRegistering(true)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen py-10">
      <div className="w-[400px] h-[850px] bg-[#f8fafc] rounded-[40px] overflow-hidden shadow-2xl relative ring-8 ring-gray-800 flex flex-col">
        
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {currentScreen === 'home' && <HomeScreen setCurrentScreen={setCurrentScreen} user={user} />}
          {currentScreen === 'findGroup' && <FindGroupScreen setCurrentScreen={setCurrentScreen} onSelectMatch={navigateToDetails} user={user} />}
          {currentScreen === 'matchDetails' && <MatchDetailsScreen booking={selectedBooking} setCurrentScreen={setCurrentScreen} user={user} setUser={setUser} />}
          {currentScreen === 'profile' && <ProfileScreen user={user} setUser={setUser} />}
          {currentScreen === 'createRoom' && <CreateRoomScreen setCurrentScreen={setCurrentScreen} user={user} setUser={setUser} />}
          {currentScreen === 'hireBuddy' && <HireBuddyScreen setCurrentScreen={setCurrentScreen} />}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-10 rounded-b-[40px]">
          <button onClick={() => setCurrentScreen('home')} className={`flex flex-col items-center gap-1 ${currentScreen === 'home' ? 'text-green-500' : 'text-gray-400'}`}>
            <Home size={24} /><span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={() => setCurrentScreen('findGroup')} className={`flex flex-col items-center gap-1 ${currentScreen === 'findGroup' || currentScreen === 'matchDetails' ? 'text-green-500' : 'text-gray-400'}`}>
            <Swords size={24} /><span className="text-[10px] font-bold">Matches</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Calendar size={24} /><span className="text-[10px] font-bold">Court</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 relative">
            <MessageSquare size={24} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">1</span>
            <span className="text-[10px] font-bold">Messages</span>
          </button>
          <button onClick={() => setCurrentScreen('profile')} className={`flex flex-col items-center gap-1 ${currentScreen === 'profile' ? 'text-green-500' : 'text-gray-400'}`}>
            <User size={24} /><span className="text-[10px] font-bold">Profile</span>
          </button>
      
        </div>
      </div>
    </div>
  );
};

export default App;