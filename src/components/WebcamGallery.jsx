import React from "react";

// Função para obter thumb do YouTube
function getYoutubeThumb(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Função para gerar URL via seu proxy do Cloudflare
function getProxiedImg(imgUrl) {
  return `https://proxy-image.russosec.workers.dev/?url=${encodeURIComponent(imgUrl)}`;
}

const WEBCAMS = [
  {
    id: "o-dALODWYfg",
    title: "Abisko Aurora Live",
    country: "Suécia",
    type: "youtube",
    videoId: "o-dALODWYfg",
    url: "https://www.youtube.com/watch?v=o-dALODWYfg"
  },
  {
    id: "ccTVAhJU5lg",
    title: "Kilpisjärvi Aurora Live",
    country: "Finlândia",
    type: "youtube",
    videoId: "ccTVAhJU5lg",
    url: "https://www.youtube.com/watch?v=ccTVAhJU5lg"
  },
  {
    id: "AvKdtZIb-6c",
    title: "Rovaniemi Aurora Live",
    country: "Finlândia",
    type: "youtube",
    videoId: "AvKdtZIb-6c",
    url: "https://www.youtube.com/watch?v=AvKdtZIb-6c"
  },
  // Imagens Landhotel (via proxy!)
  {
    id: "landhotel-north",
    title: "Landhotel North (Iceland)",
    country: "Islândia",
    type: "image",
    url: "https://landhotel.is/webcam/northview.jpg",
    thumb: getProxiedImg("https://landhotel.is/webcam/northview.jpg")
  },
  {
    id: "landhotel-east",
    title: "Landhotel East (Iceland)",
    country: "Islândia",
    type: "image",
    url: "https://landhotel.is/webcam/eastview.jpg",
    thumb: getProxiedImg("https://landhotel.is/webcam/eastview.jpg")
  }
];

// Um card para cada webcam
function WebcamCard({ webcam }) {
  return (
    <div className="rounded-2xl bg-[#181e28] shadow-md p-4 flex flex-col items-center w-64 m-2">
      <div className="w-full flex justify-center mb-2">
        {/* YouTube */}
        {webcam.type === "youtube" ? (
          <a href={webcam.url} target="_blank" rel="noopener noreferrer">
            <img
              src={getYoutubeThumb(webcam.videoId)}
              alt={webcam.title}
              className="w-64 h-36 object-cover rounded-xl mb-2"
              loading="lazy"
            />
            <span
              style={{
                position: "relative",
                top: 12,
                left: 20,
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
          </a>
        ) : (
          // Imagem estática via proxy
          <a href={webcam.url} target="_blank" rel="noopener noreferrer">
            <img
              src={webcam.thumb}
              alt={webcam.title}
              className="w-64 h-36 object-cover rounded-xl mb-2"
              loading="lazy"
            />
          </a>
        )}
      </div>
      <div className="font-semibold text-lg text-white">{webcam.title}</div>
      <div className="text-auroraGreen text-xs mb-1">{webcam.country}</div>
      <a href={webcam.url} target="_blank" rel="noopener noreferrer"
         className="text-auroraGreen text-sm underline">Assistir ao vivo</a>
    </div>
  );
}

export default function WebcamGallery() {
  return (
    <div className="flex flex-wrap justify-center">
      {WEBCAMS.map(cam => (
        <WebcamCard key={cam.id} webcam={cam} />
      ))}
    </div>
  );
}
