import React, { useRef, useEffect, useState } from "react";
import Globe from "react-globe.gl";

function getAuroraBelt(latMin = 65, latMax = 70, steps = 120) {
  const arcs = [];
  for (let i = 0; i < steps; i++) {
    const lng1 = (i * 360) / steps - 180;
    const lng2 = ((i + 1) * 360) / steps - 180;
    arcs.push({
      startLat: latMin,
      startLng: lng1,
      endLat: latMin,
      endLng: lng2,
      color: "#32FF8F"
    });
    arcs.push({
      startLat: latMax,
      startLng: lng1,
      endLat: latMax,
      endLng: lng2,
      color: "#32FF8F"
    });
  }
  return arcs;
}

// Night terminator: polygon is an array of [lat, lng]
function getNightPolygon(steps = 180) {
  const now = new Date();
  const jd = now.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * Math.sin(g * Math.PI / 180) + 0.020 * Math.sin(2 * g * Math.PI / 180)) % 360;
  const RA = Math.atan2(Math.cos(23.44 * Math.PI / 180) * Math.sin(L * Math.PI / 180), Math.cos(L * Math.PI / 180)) * 180 / Math.PI;
  const dec = Math.asin(Math.sin(23.44 * Math.PI / 180) * Math.sin(L * Math.PI / 180)) * 180 / Math.PI;
  const lst = (now.getUTCHours() * 15 + now.getUTCMinutes() * 0.25 + now.getUTCSeconds() * (0.25 / 60)) - 180;

  const poly = [];
  for (let i = 0; i <= steps; i++) {
    const lat = 90 - (i * 180) / steps;
    const ha = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(dec * Math.PI / 180)) * 180 / Math.PI;
    const lng = (lst - ha + 360) % 360 - 180;
    poly.push([lat, lng]);
  }
  for (let i = steps; i >= 0; i--) {
    const lat = 90 - (i * 180) / steps;
    const ha = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(dec * Math.PI / 180)) * 180 / Math.PI;
    const lng = (lst + ha + 360) % 360 - 180;
    poly.push([lat, lng]);
  }
  return [{ polygon: poly, color: "rgba(0,0,0,0.33)" }];
}

export default function AuroraGlobe({ latMin = 65, latMax = 70 }) {
  const globeEl = useRef();
  const [nightPolygons, setNightPolygons] = useState(getNightPolygon());

  useEffect(() => {
    const interval = setInterval(() => {
      setNightPolygons(getNightPolygon());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 75, lng: 20, altitude: 2 }, 2000);
    }
  }, []);

  const auroraArcs = getAuroraBelt(latMin, latMax);

  return (
    <div className="w-full flex justify-center items-center my-4">
      <div style={{ width: "100%", maxWidth: 400, height: 400, minHeight: 300, position: "relative" }}>
        <Globe
          ref={globeEl}
          width={400}
          height={400}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundColor="#0B1C24"
          arcsData={auroraArcs}
          arcStartLat={d => d.startLat}
          arcStartLng={d => d.startLng}
          arcEndLat={d => d.endLat}
          arcEndLng={d => d.endLng}
          arcColor={d => d.color}
          arcStroke={2}
          arcDashLength={0.5}
          arcDashGap={0.5}
          arcDashInitialGap={Math.random()}
          arcDashAnimateTime={3000}
          pointsData={[]}
          polygonsData={nightPolygons}
          polygonPoints={d => d.polygon}
          polygonCapColor={d => d.color}
          polygonSideColor={() => 'rgba(0,0,0,0)'}
          polygonStrokeColor={() => 'rgba(0,0,0,0)'}
          polygonAltitude={0.01}
        />
      </div>
    </div>
  );
}
