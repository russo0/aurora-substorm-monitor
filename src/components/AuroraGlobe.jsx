import React, { useRef, useEffect, useState } from "react";
import Globe from "react-globe.gl";
import SunCalc from "suncalc";

// Função para gerar cinturão da aurora
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

// Função para gerar a “noite” (lat, lng, color)
function getNightArcs(steps = 360) {
  const date = new Date();
  const solarLng = ((date.getUTCHours() + date.getUTCMinutes()/60) * 15) - 180;
  const nightArcs = [];
  for (let i = 0; i < steps; i++) {
    const lat = (i * 180) / (steps - 1) - 90;
    const lngStart = solarLng - 90;
    const lngEnd = solarLng + 90;
    nightArcs.push({
      startLat: lat,
      startLng: lngStart,
      endLat: lat,
      endLng: lngEnd,
      color: "rgba(0,0,0,0.23)" // sombra sutil!
    });
  }
  return nightArcs;
}


export default function AuroraGlobe({ latMin = 65, latMax = 70 }) {
  const globeEl = useRef();
  const [nightArcs, setNightArcs] = useState([]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 75, lng: 20, altitude: 2 }, 2000);
    }
    // Atualiza a zona de noite a cada minuto
    const updateNight = () => setNightArcs(getNightArcs());
    updateNight();
    const interval = setInterval(updateNight, 60000);
    return () => clearInterval(interval);
  }, []);

  const auroraArcs = getAuroraBelt(latMin, latMax);

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
          // Aurora
          arcsData={[...auroraArcs, ...nightArcs]}
          arcStartLat={d => d.startLat}
          arcStartLng={d => d.startLng}
          arcEndLat={d => d.endLat}
          arcEndLng={d => d.endLng}
          arcColor={d => d.color}
          arcStroke={d => (d.color.startsWith("rgba") ? 30 : 2)}
          arcDashLength={d => (d.color.startsWith("rgba") ? 1 : 0.5)}
          arcDashGap={d => (d.color.startsWith("rgba") ? 0 : 0.5)}
          arcDashInitialGap={Math.random()}
          arcDashAnimateTime={3000}
          pointsData={[]}
        />
      </div>
    </div>
  );
}
