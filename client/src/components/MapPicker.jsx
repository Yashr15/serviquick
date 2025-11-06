// Fix default icon issue in Leaflet + Vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";


const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function MapPicker({ value, onChange }) {
  const [marker, setMarker] = useState(
    value || { lat: 28.6139, lng: 77.2090 } // Default Delhi coords
  );

  function MapClicker() {
    useMapEvents({
      click(e) {
        const pos = e.latlng;
        setMarker(pos);
        onChange(pos);
      },
    });
    return null;
  }

  const setMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMarker(pos);
        onChange(pos);
      });
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={setMyLocation}
        className="px-2 py-1 bg-gray-200 rounded"
      >
        Use my location
      </button>

      <MapContainer
        center={marker}
        zoom={13}
        style={{ height: "320px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <Marker position={marker} />
        <MapClicker />
      </MapContainer>

      <div className="text-xs text-gray-600">
        Selected: <b>{marker.lat.toFixed(6)}</b>, <b>{marker.lng.toFixed(6)}</b>
      </div>
    </div>
  );
}
