import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Crosshair, Check, X, Loader2, Navigation } from 'lucide-react';

export default function LocationPickerModal({ isOpen, onClose, onSelectLocation, initialAddress = {} }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentCoords, setCurrentCoords] = useState({ lat: 26.8467, lng: 80.9462 }); // Default Lucknow, Uttar Pradesh
  
  const [addressDetails, setAddressDetails] = useState({
    street: initialAddress.street || initialAddress.addressLine1 || '',
    colony: initialAddress.colony || initialAddress.addressLine2 || '',
    landmark: initialAddress.landmark || '',
    city: initialAddress.city || 'Lucknow',
    state: initialAddress.state || 'Uttar Pradesh',
    pincode: initialAddress.pincode || ''
  });

  // Re-sync addressDetails whenever modal opens with new initialAddress
  useEffect(() => {
    if (isOpen) {
      setAddressDetails({
        street: initialAddress.street || initialAddress.addressLine1 || '',
        colony: initialAddress.colony || initialAddress.addressLine2 || '',
        landmark: initialAddress.landmark || '',
        city: initialAddress.city || 'Lucknow',
        state: initialAddress.state || 'Uttar Pradesh',
        pincode: initialAddress.pincode || ''
      });
      if (initialAddress.lat && initialAddress.lng) {
        setCurrentCoords({ lat: parseFloat(initialAddress.lat), lng: parseFloat(initialAddress.lng) });
      }
    }
  }, [isOpen, initialAddress]);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  // Load Leaflet dynamically when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const loadLeaflet = async () => {
      // Inject CSS if not present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS if not present
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      if (!isMounted || !mapContainerRef.current || !window.L) return;

      // Initialize map if not already initialized
      if (!leafletMapRef.current) {
        const L = window.L;
        const initialLat = currentCoords.lat;
        const initialLng = currentCoords.lng;

        const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Custom marker icon
        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="background-color: #0d9488; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid white;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36]
        });

        const marker = L.marker([initialLat, initialLng], { draggable: true, icon: customIcon }).addTo(map);
        markerRef.current = marker;
        leafletMapRef.current = map;

        // Map click event
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setCurrentCoords({ lat, lng });
          reverseGeocode(lat, lng);
        });

        // Marker drag event
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          setCurrentCoords({ lat: position.lat, lng: position.lng });
          reverseGeocode(position.lat, position.lng);
        });

        // Trigger resize calculation
        setTimeout(() => map.invalidateSize(), 300);
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reverse geocode lat, lng to address details
  const reverseGeocode = async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.building || (addr.house_number ? `${addr.house_number}, ${addr.road || ''}` : '');
        const colony = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.subdistrict || '';
        const landmark = addr.amenity || addr.landmark || addr.commercial || addr.historic || '';
        const city = addr.city || addr.town || addr.city_district || addr.district || addr.county || 'Lucknow';
        const state = addr.state || 'Uttar Pradesh';
        const pincode = addr.postcode || '';

        setAddressDetails(prev => ({
          street: street || prev.street,
          colony: colony || prev.colony,
          landmark: landmark || prev.landmark,
          city: city || prev.city,
          state: state || prev.state,
          pincode: pincode || prev.pincode
        }));
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Search area/landmark in map search bar
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const query = searchQuery.includes('Uttar Pradesh') ? searchQuery : `${searchQuery}, Uttar Pradesh, India`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`);
      const data = await res.json();
      setSearchResults(data || []);
      if (data && data.length > 0) {
        selectSearchResult(data[0]);
      }
    } catch (err) {
      console.warn('Search location error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setCurrentCoords({ lat, lng });

    if (leafletMapRef.current && markerRef.current) {
      leafletMapRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
    setSearchResults([]);

    const addr = result.address || {};
    const street = addr.road || addr.building || (addr.house_number ? `${addr.house_number}, ${addr.road || ''}` : '');
    const colony = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.subdistrict || '';
    const landmark = addr.amenity || addr.landmark || addr.commercial || '';
    const city = addr.city || addr.town || addr.city_district || addr.district || addr.county || 'Lucknow';
    const state = addr.state || 'Uttar Pradesh';
    const pincode = addr.postcode || '';

    setAddressDetails(prev => ({
      street: street || searchQuery || prev.street,
      colony: colony || prev.colony,
      landmark: landmark || prev.landmark,
      city: city || prev.city,
      state: state || prev.state,
      pincode: pincode || prev.pincode
    }));
  };

  // Use current device GPS location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsReverseGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });

        if (leafletMapRef.current && markerRef.current) {
          leafletMapRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsReverseGeocoding(false);
        alert('Could not access current location. Please check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onSelectLocation({
      ...addressDetails,
      addressLine1: addressDetails.street,
      addressLine2: addressDetails.colony,
      lat: currentCoords.lat,
      lng: currentCoords.lng
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Pick Business Location on Map</h3>
              <p className="text-xs text-gray-400">Click or drag pin anywhere to set street, colony & landmark</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search bar & GPS button */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search street, colony, landmark, city (e.g. Hazratganj, Lucknow)"
              className="w-full pl-9 pr-20 py-2.5 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={15} />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
            >
              {isSearching ? <Loader2 size={12} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Crosshair size={15} className="text-teal-700" /> Use GPS Location
          </button>
        </div>

        {/* Interactive Map Container */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-100 border-b border-gray-200">
          <div ref={mapContainerRef} className="h-full w-full z-10" />
          
          {isReverseGeocoding && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-2xs z-20 flex items-center justify-center gap-2 font-bold text-xs text-teal-900">
              <Loader2 size={18} className="animate-spin text-teal-700" /> Fetching location details...
            </div>
          )}
        </div>

        {/* Address Inputs Form & Preview */}
        <div className="p-5 space-y-3 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation size={14} className="text-teal-600" /> Address Details (Street, Colony, Landmark, City, State)
            </span>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              {addressDetails.state || 'Uttar Pradesh'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Street / Building *</label>
              <input
                type="text"
                value={addressDetails.street}
                onChange={(e) => setAddressDetails({ ...addressDetails, street: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
                placeholder="e.g. Plot 42, Main Station Road"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Colony / Area *</label>
              <input
                type="text"
                value={addressDetails.colony}
                onChange={(e) => setAddressDetails({ ...addressDetails, colony: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
                placeholder="e.g. Civil Lines / Sector 62"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Landmark</label>
              <input
                type="text"
                value={addressDetails.landmark}
                onChange={(e) => setAddressDetails({ ...addressDetails, landmark: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
                placeholder="e.g. Near Jubilee Park"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">City / District *</label>
              <input
                type="text"
                value={addressDetails.city}
                onChange={(e) => setAddressDetails({ ...addressDetails, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
                placeholder="e.g. Lucknow / Noida"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">State *</label>
              <input
                type="text"
                value={addressDetails.state}
                onChange={(e) => setAddressDetails({ ...addressDetails, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
                placeholder="Uttar Pradesh"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Pincode *</label>
              <input
                type="text"
                maxLength={6}
                value={addressDetails.pincode}
                onChange={(e) => setAddressDetails({ ...addressDetails, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 outline-hidden"
                placeholder="226001"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-[11px] text-gray-500 truncate max-w-xs sm:max-w-sm">
            <span className="font-bold text-gray-700">Preview:</span> {[addressDetails.street, addressDetails.colony, addressDetails.landmark, addressDetails.city, addressDetails.state].filter(Boolean).join(', ')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check size={16} /> Confirm & Use Location
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
