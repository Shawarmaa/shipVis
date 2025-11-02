'use client';

import { useWebSocket } from '@/lib/useWebSocket';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import WebSocketStatus from '@/components/WebSocketStatus';

const NauticalMap = dynamic(() => import('@/components/NauticalMap'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-gray-900 flex items-center justify-center text-white">Loading map...</div>
});

export default function Home() {
  const [allShipsEnabled, setAllShipsEnabled] = useState(false); // Start enabled
  const { status, lastMessage, vessels, error } = useWebSocket('ws://localhost:8000/ws/all_ships', allShipsEnabled);
  const { 
    status: shipsStatus, 
    lastMessage: shipsLastMessage, 
    vessels: shipsVessels, 
    error: shipsError 
  } = useWebSocket('ws://localhost:8000/ws/ships?port=ROTTERDAM');
  const { 
    status: filteredStatus, 
    lastMessage: filteredLastMessage, 
    vessels: filteredVessels, 
    error: filteredError 
  } = useWebSocket('ws://localhost:8000/ws/filtered_ships');

  // Log ship tracking data
  useEffect(() => {
    if (shipsLastMessage) {
      console.log('🚢 ROTTERDAM SHIPS - New message received:', shipsLastMessage);
      console.log('🚢 ROTTERDAM SHIPS - Current vessels count:', shipsVessels.size);
      console.log('🚢 ROTTERDAM SHIPS - All tracked vessels:', Array.from(shipsVessels.values()));
    }
  }, [shipsLastMessage, shipsVessels]);

  useEffect(() => {
    console.log('🚢 ROTTERDAM SHIPS - Connection status changed:', shipsStatus);
    if (shipsError) {
      console.error('🚢 ROTTERDAM SHIPS - Error:', shipsError);
    }
  }, [shipsStatus, shipsError]);

  return (
    <div className="h-screen flex flex-col">
      <WebSocketStatus
        status={status}
        error={error}
        vessels={vessels}
        shipsStatus={shipsStatus}
        shipsError={shipsError}
        shipsVessels={shipsVessels}
        filteredStatus={filteredStatus}
        filteredError={filteredError}
        filteredVessels={filteredVessels}
        allShipsEnabled={allShipsEnabled}
      />

      <NauticalMap 
        className="h-full w-full" 
        vessels={vessels} 
        shipsVessels={shipsVessels} 
        filteredVessels={filteredVessels}
        allShipsEnabled={allShipsEnabled}
        setAllShipsEnabled={setAllShipsEnabled}
      />
    </div>
  );
}
