import React, { useState } from "react";

const WEBCAMS = [
  {
    id: "o-dALODWYfg",
    title: "Abisko Aurora Live",
    country: "Suécia",
    type: "youtube"
  },
  {
    id: "ccTVAhJU5lg",
    title: "Kilpisjärvi Aurora Live",
    country: "Finlândia",
    type: "youtube"
  },
  {
    id: "AvKdtZIb-6c",
    title: "Rovaniemi Aurora Live",
    country: "Finlândia",
    type: "youtube"
  },
  {
    id: "landhotel-north",
    title: "Landhotel North (Iceland)",
    country: "Islândia",
    type: "image",
    url: "https://landhotel.is/webcam/northview.jpg"
  },
  {
    id: "landhotel-east",
    title: "Landhotel East (Iceland)",
    country: "Islândia",
    type: "image",
    url: "https://landhotel.is/webcam/eastview.jpg"
  }
];

function getYoutubeThumb(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
function getYoutubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function ImageThumb({ src, alt }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return <div style={{
      width: 210, height: 120, borderRadius: 12, background: "#333",
      color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center"
    }}>Preview indisponível</div>;
  }
  return (
    <img
      src={src}
      alt={alt}
      width="210"
      height="120"
      style={{ borderRadius: "12px", objectFit: "cover" }}
      onError={() => setErrored(true)}
    />
  );
}

export default function WebcamGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {WEBCAMS.map(cam => (
        <div key={cam.id} className="rounded-2xl bg-[#181e28] shadow-md p-4 flex flex-col items-center">
          <div className="w-full flex justify-center mb-2">
            {cam.type === "youtube" ? (
              // Embed YouTube player com autoplay bloqueado e sem sugestões
              <iframe
                width="320"
                height="180"
                src={`https://www.youtube.com/embed/${cam.id}?mute=1&autoplay=0&rel=0`}
                title={cam.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl"
              />
            ) : (
              <a href={cam.url} target="_blank" rel="noopener noreferrer">
                <ImageThumb src={cam.url + "?" + Date.now()} alt={cam.title} />
              </a>
            )}
          </div>
          <div className="font-semibold text-lg text-white">{cam.title}</div>
          <div className="text-auroraGreen text-xs mb-1">{cam.country}</div>
          <a
            href={cam.type === "youtube" ? getYoutubeUrl(cam.id) : cam.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-auroraGreen text-sm underline"
          >
            Assistir ao vivo
          </a>
        </div>
      ))}
    </div>
  );
}
