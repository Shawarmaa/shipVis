'use client';

import { useWebSocket } from '@/lib/useWebSocket';
import dynamic from 'next/dynamic';

const NauticalMap = dynamic(() => import('@/components/NauticalMap'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-gray-900 flex items-center justify-center text-white">Loading map...</div>
});

export default function Home() {
  const { status, lastMessage, vessels, error } = useWebSocket('ws://localhost:8000/ws/all_ships');

  return (
    <div className="h-screen flex flex-col">
      {/* Status panel in bottom-left */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur-sm p-3 rounded-lg text-white max-w-xs">
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span>WebSocket:</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              status === 'connected' ? 'bg-green-500' : 
              status === 'connecting' ? 'bg-yellow-500' : 
              status === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`}>
              {status}
            </span>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <p>Vessels tracked: {vessels.size}</p>
        </div>
      </div>

      <NauticalMap className="h-full w-full" vessels={vessels} />
    </div>
  );
}
