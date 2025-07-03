import React, { useRef, useEffect } from "react";
import Globe from "react-globe.gl";

// Gera pontos de latitude para o "belt" da aurora
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

export default function AuroraGlobe({ latMin = 65, latMax = 70 }) {
  const globeEl = useRef();

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 75, lng: 20, altitude: 2 }, 2000);
    }
  }, []);

  const arcsData = getAuroraBelt(latMin, latMax);

  return (
    <div className="w-full flex justify-center items-center my-4">
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          height: 400,
          minHeight: 300,
          position: "relative",
        }}
      >
        <Globe
          ref={globeEl}
          width={400}
          height={400}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundColor="#0B1C24"
          arcsData={arcsData}
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
          pointsData={[]} // Para pins de webcam depois
        />
      </div>
    </div>
  );
}
