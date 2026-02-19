import React, { useEffect, useRef } from 'react';
import { Specialist } from '../types';
import { useNavigate } from 'react-router-dom';

interface MapProps {
  specialists: Specialist[];
}

// Ensure Leaflet types are recognized (since we use CDN)
declare global {
  interface Window {
    L: any;
  }
}

export const MapComponent: React.FC<MapProps> = ({ specialists }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window.L === 'undefined') return;

    // Initialize map if it doesn't exist
    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current).setView([41.2995, 69.2401], 12);
      
      // Add Tile Layer (OpenStreetMap)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    // Clear existing markers
    mapInstance.current.eachLayer((layer: any) => {
      if (layer instanceof window.L.Marker) {
         mapInstance.current.removeLayer(layer);
      }
    });

    // Add new markers based on filtered specialists
    const markers: any[] = [];
    specialists.forEach(spec => {
      if (spec.lat && spec.lng) {
         // Create a simple custom icon color based on logic if needed, using default for now
         const marker = window.L.marker([spec.lat, spec.lng])
           .addTo(mapInstance.current)
           .bindPopup(`
             <div style="font-family: 'Inter', sans-serif; padding: 5px; min-width: 160px;">
               <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <img src="${spec.avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                  <div>
                    <h3 style="font-weight: 700; font-size: 14px; margin: 0; line-height: 1.2;">${spec.name}</h3>
                    <div style="color: #6b7280; font-size: 11px;">${spec.category}</div>
                  </div>
               </div>
               <div style="font-size: 12px; margin-bottom: 8px;">
                 <span style="color: #10b981; font-weight: 600;">от ${new Intl.NumberFormat('ru-RU').format(spec.priceStart)} UZS</span>
               </div>
               <button 
                 id="btn-${spec.id}" 
                 style="width: 100%; background-color: #7c3aed; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;"
               >
                 Профиль
               </button>
             </div>
           `);
         
         // Handle button click inside popup (Leaflet creates HTML string, so we attach event listener after popup opens)
         marker.on('popupopen', () => {
             const btn = document.getElementById(`btn-${spec.id}`);
             if(btn) {
                 btn.onclick = () => navigate(`/specialist/${spec.id}`);
             }
         });

         markers.push(marker);
      }
    });
    
    // Fit bounds if we have markers
    if (markers.length > 0) {
        const group = window.L.featureGroup(markers);
        mapInstance.current.fitBounds(group.getBounds().pad(0.1));
    }

    // Cleanup function not strictly needed for the map instance itself as we ref it, 
    // but good practice if component unmounts completely (though we might want to keep state)
    return () => {
        // We generally keep the map instance if re-rendering with different props
    };

  }, [specialists, navigate]);

  // Updated height: 350px on mobile, 600px on desktop
  return <div ref={mapRef} className="w-full h-[350px] md:h-[600px] rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700 z-0 bg-gray-100" />;
};