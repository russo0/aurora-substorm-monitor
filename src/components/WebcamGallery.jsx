import React from "react";

const WEBCAMS = [
  {
    title: "Abisko Aurora Sky Station",
    country: "Suécia",
    url: "https://www.youtube.com/watch?v=o-dALODWYfg",
    videoId: "F8Vuw0G4Gfk",
  },
  {
    title: "Nordlys Observatory",
    country: "Noruega",
    url: "https://www.youtube.com/watch?v=j5xZYIS9d_0",
    videoId: "j5xZYIS9d_0",
  },
  // Adicione mais
];

function getYoutubeThumb(videoId) {
  // YouTube sempre tem esse thumb!
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function WebcamCard({ webcam }) {
  return (
    <a
      href={webcam.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative rounded-2xl bg-[#131e28] shadow-md flex flex-col items-center p-2 transition hover:scale-105"
      style={{
        width: 210,
        minHeight: 180,
        margin: "0.5rem",
        border: "2px solid #32FF8F",
        textDecoration: "none"
      }}
      title={`Assistir ${webcam.title} ao vivo`}
    >
      <div style={{ position: "relative", width: 210, height: 120 }}>
        <img
          src={getYoutubeThumb(webcam.videoId)}
          alt={webcam.title}
          width="210"
          height="120"
          style={{ borderRadius: "12px", objectFit: "cover" }}
        />
        {/* Overlay "AO VIVO" */}
        <span
          style={{
            position: "absolute",
            top: 6,
            left: 10,
            background: "#FF3232",
            color: "#fff",
            fontSize: 12,
            fontWeight: "bold",
            padding: "2px 8px",
            borderRadius: "8px",
            letterSpacing: 1,
            zIndex: 2
          }}
        >
          AO VIVO
        </span>
      </div>
      <div className="mt-2 text-white text-sm font-semibold text-center">{webcam.title}</div>
      <div className="text-gray-400 text-xs">{webcam.country}</div>
      <div className="text-auroraGreen text-xs mt-1">Clique para assistir ao vivo</div>
    </a>
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
