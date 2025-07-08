import React from "react";

// Lista de webcams (exemplo com YouTube e Landhotel via proxy)
const WEBCAMS = [
  {
    id: "o-dALODWYfg",
    title: "Abisko Aurora Live",
    country: "Suécia",
    url: "https://www.youtube.com/watch?v=o-dALODWYfg",
    embed: false, // thumbnail clicável, não iframe
    type: "youtube"
  },
  {
    id: "ccTVAhJU5lg",
    title: "Kilpisjärvi Aurora Live",
    country: "Finlândia",
    url: "https://www.youtube.com/watch?v=ccTVAhJU5lg",
    embed: false,
    type: "youtube"
  },
  {
    id: "AvKdtZIb-6c",
    title: "Rovaniemi Aurora Live",
    country: "Finlândia",
    url: "https://www.youtube.com/watch?v=AvKdtZIb-6c",
    embed: false,
    type: "youtube"
  },
  // Landhotel North (proxy)
  {
    id: "landhotel-north",
    title: "Landhotel North (Iceland)",
    country: "Islândia",
    url: "https://landhotel.is/webcam/northview.jpg",
    embed: false,
    type: "image",
    thumb: "https://proxy-image.russosec.workers.dev/?url=https://landhotel.is/webcam/northview.jpg"
  },
  {
    id: "landhotel-east",
    title: "Landhotel East (Iceland)",
    country: "Islândia",
    url: "https://landhotel.is/webcam/eastview.jpg",
    embed: false,
    type: "image",
    thumb: "https://proxy-image.russosec.workers.dev/?url=https://landhotel.is/webcam/eastview.jpg"
  }
];

// Função para thumb do YouTube
function getYoutubeThumb(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// Card de webcam
function WebcamCard({ cam }) {
  // Decide se é imagem estática ou YouTube
  const isYoutube = cam.type === "youtube";
  const thumb = isYoutube
    ? getYoutubeThumb(cam.id)
    : cam.thumb || cam.url;

  return (
    <a
      href={cam.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative rounded-2xl bg-[#131e28] shadow-md flex flex-col items-center p-2 transition hover:scale-105"
      style={{
        width: 210,
        minHeight: 210,
        margin: "0.5rem",
        border: "2px solid #32FF8F",
        textDecoration: "none"
      }}
      title={`Assistir ${cam.title} ao vivo`}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", width: 210, height: 120 }}>
        <img
          src={thumb}
          alt={cam.title}
          width="210"
          height="120"
          style={{
            borderRadius: "12px",
            objectFit: "cover",
            background: "#222"
          }}
        />
        {/* "AO VIVO" */}
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
        {/* Ícone de play só no YouTube */}
        {isYoutube && (
          <svg
            viewBox="0 0 64 64"
            width={44}
            height={44}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: 0.85,
              pointerEvents: "none"
            }}
          >
            <circle cx="32" cy="32" r="32" fill="#000" opacity="0.55" />
            <polygon points="26,20 26,44 46,32" fill="#fff" />
          </svg>
        )}
      </div>
      <div className="mt-2 text-white text-sm font-semibold text-center">{cam.title}</div>
      <div className="text-gray-400 text-xs">{cam.country}</div>
      <div className="text-auroraGreen text-xs mt-1">Clique para assistir ao vivo</div>
    </a>
  );
}

// Galeria
export default function WebcamGallery() {
  return (
    <div className="w-full flex flex-wrap justify-center items-center">
      {WEBCAMS.map(cam => (
        <WebcamCard key={cam.id} cam={cam} />
      ))}
    </div>
  );
}
