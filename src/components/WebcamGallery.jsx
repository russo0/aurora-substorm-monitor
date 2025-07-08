import React from "react";

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

export default function WebcamGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {WEBCAMS.map(cam => (
        <div key={cam.id} className="rounded-2xl bg-[#181e28] shadow-md p-4 flex flex-col items-center">
          <div className="w-full flex justify-center mb-2">
            {cam.type === "youtube" ? (
              <a href={getYoutubeUrl(cam.id)} target="_blank" rel="noopener noreferrer">
                <img
                  src={getYoutubeThumb(cam.id)}
                  alt={cam.title}
                  className="w-64 h-36 object-cover rounded-xl mb-2"
                />
              </a>
            ) : (
              <a href={cam.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={cam.url + "?" + Date.now()} // previne cache, força atualização ao abrir
                  alt={cam.title}
                  className="w-64 h-36 object-cover rounded-xl mb-2"
                />
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
