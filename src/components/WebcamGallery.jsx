import React from "react";

const WEBCAMS = [
  {
    title: "Abisko Aurora Live",
    country: "Suécia",
    url: "https://www.youtube.com/watch?v=o-dALODWYfg",
    embed: true,
    id: "o-dALODWYfg"
  },
  {
    title: "Abisko Aurora Live",
    country: "Suécia",
    url: "https://www.youtube.com/watch?v=o-dALODWYfg",
    embed: true,
    id: "o-dALODWYfg"
  },
  {
    title: "Kilpisjärvi Aurora Live",
    country: "Finlândia",
    url: "https://www.youtube.com/watch?v=ccTVAhJU5lg",
    embed: true,
    id: "ccTVAhJU5lg"
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {WEBCAMS.map(cam =>
        <div key={cam.id} className="rounded-2xl bg-[#181e28] shadow-md p-4 flex flex-col items-center">
          <div className="w-full flex justify-center mb-2">
            {cam.embed ? (
              <iframe
                width="320"
                height="180"
                src={`https://www.youtube.com/embed/${cam.id}?mute=1`}
                title={cam.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl"
              />
            ) : (
              <a href={cam.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={`https://img.youtube.com/vi/${cam.id}/hqdefault.jpg`}
                  alt={cam.title}
                  className="w-64 h-36 object-cover rounded-xl mb-2"
                />
              </a>
            )}
          </div>
          <div className="font-semibold text-lg text-white">{cam.title}</div>
          <div className="text-auroraGreen text-xs mb-1">{cam.country}</div>
          <a href={cam.url} target="_blank" rel="noopener noreferrer"
             className="text-auroraGreen text-sm underline">Assistir ao vivo</a>
        </div>
      )}
    </div>
  );
}