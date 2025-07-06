// src/components/WebcamGallery.jsx
import React, { useState } from "react";

// Lista de webcams do YouTube
const WEBCAMS = [
  {
    title: "Abisko Aurora Sky Station",
    country: "Suécia",
    url: "https://www.youtube.com/watch?v=F8Vuw0G4Gfk",
    videoId: "F8Vuw0G4Gfk",
  },
  {
    title: "Nordlys Observatory",
    country: "Noruega",
    url: "https://www.youtube.com/watch?v=j5xZYIS9d_0",
    videoId: "j5xZYIS9d_0",
  },
  // Adicione mais webcams YouTube aqui!
];

function WebcamCard({ webcam }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative rounded-2xl bg-[#131e28] shadow-md flex flex-col items-center p-2 cursor-pointer transition hover:scale-105"
      style={{
        width: 210,
        minHeight: 170,
        margin: "0.5rem",
        border: hover ? "2px solid #32FF8F" : "2px solid transparent",
        zIndex: hover ? 20 : 1,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      tabIndex={0}
    >
      <div style={{ position: "relative", width: 210, height: 120 }}>
        {/* Player sempre visível */}
        <iframe
          width="210"
          height="120"
          src={`https://www.youtube.com/embed/${webcam.videoId}?autoplay=1&mute=1`}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={webcam.title}
          style={{ borderRadius: "12px" }}
        />
        {/* Efeito de zoom/flutuante no hover */}
        {hover && (
          <div
            className="absolute left-1/2 top-1/2 bg-black/90 border-2 border-auroraGreen rounded-xl shadow-2xl flex items-center justify-center"
            style={{
              width: 340,
              height: 200,
              zIndex: 100,
              transform: "translate(-50%,-50%) scale(1.05)",
              pointerEvents: "none",
            }}
          >
            <iframe
              width="340"
              height="200"
              src={`https://www.youtube.com/embed/${webcam.videoId}?autoplay=1&mute=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={webcam.title}
              style={{ borderRadius: "16px" }}
            />
          </div>
        )}
      </div>
      <div className="mt-2 text-white text-sm font-semibold text-center">{webcam.title}</div>
      <div className="text-gray-400 text-xs">{webcam.country}</div>
      <a
        href={webcam.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-auroraGreen text-xs mt-1"
      >
        Assistir ao vivo
      </a>
    </div>
  );
}

export default function WebcamGallery() {
  return (
    <div className="w-full max-w-4xl mx-auto mt-8 px-4">
      <h2 className="text-xl font-bold text-white mb-2">Webcams do Ártico ao vivo</h2>
      <div className="flex flex-wrap justify-center">
        {WEBCAMS.map((webcam, idx) => (
          <WebcamCard webcam={webcam} key={idx} />
        ))}
      </div>
    </div>
  );
}
