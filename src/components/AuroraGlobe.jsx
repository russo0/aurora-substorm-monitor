import React, { useRef, useEffect, useState } from "react";
import Globe from "react-globe.gl";

// Cinturão auroral
function getAuroraBelt(latMin = 65, latMax = 70, steps = 180) {
  const belts = [];
  for (let lat = latMin; lat < latMax; lat += 1) {
    for (let i = 0; i < steps; i++) {
      const lng1 = (i * 360) / steps - 180;
      const lng2 = ((i + 1) * 360) / steps - 180;
      belts.push({
        startLat: lat,
        startLng: lng1,
        endLat: lat,
        endLng: lng2,
        color: "#32FF8F"
      });
    }
  }
  return belts;
}

// Terminador (grayline)
function getNightPolygon(steps = 180) {
  const now = new Date();
  const solarLng = ((now.getUTCHours() + now.getUTCMinutes()/60) * 15) - 180;
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const lat = (i * 180) / steps - 90;
    const lng = solarLng + 90;
    coords.push([lat, lng]);
  }
  for (let i = steps; i >= 0; i--) {
    const lat = (i * 180) / steps - 90;
    const lng = solarLng - 90;
    coords.push([lat, lng]);
  }
  return [
    {
      polygon: coords,
      color: "rgba(0,0,0,0.33)",
    }
  ];
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
      <div style={{
        width: "100%",
        maxWidth: 400,
        height: 400,
        minHeight: 300,
        position: "relative"
      }}>
        {Array.isArray(nightPolygons) && (
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
        )}
      </div>
    </div>
  );
}
