import React from "react";

// Adapte o array abaixo para suas câmeras
const WEBCAMS = [
  // YouTube Live
  {
    id: "o-dALODWYfg",
    title: "Abisko Aurora Live",
    country: "Sweden",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=o-dALODWYfg",
  },
  {
    id: "ccTVAhJU5lg",
    title: "Kilpisjärvi Aurora Live",
    country: "Finland",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=ccTVAhJU5lg",
  },
  // IPCamLive
  {
    id: "landhotel-north",
    title: "Landhotel North",
    country: "Iceland",
    type: "iframe",
    url: "https://g0.ipcamlive.com/player/player.php?alias=6565ed34e367a&autoplay=1&mute=1&disablezoombutton=1&disabledownloadbutton=1&disablenavigation=1",
    thumb: "https://landhotel.is/wp-content/uploads/2021/05/landhotel_front-1.jpg" // Opcional, pode ser uma foto do hotel
  },
  // Imagem Estática (exemplo, se você tiver algum snapshot)
  {
    id: "some-static-img",
    title: "Estática Demo",
    country: "Anywhere",
    type: "image",
    url: "https://exemplo.com/cam.jpg",
    thumb: "https://exemplo.com/thumb.jpg"
  }
];

function getYoutubeThumb(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function WebcamCard({ webcam }) {
  // Se for YouTube, mostra embed ou thumbnail (ao clicar, abre ao vivo)
  if (webcam.type === "youtube") {
    return (
      <div className="rounded-2xl bg-[#181e28] shadow-md p-4 flex flex-col items-center">
        <iframe
          width="320"
          height="180"
          src={`https://www.youtube.com/embed/${webcam.id}?autoplay=0&mute=1`}
          title={webcam.title}
          frameBorder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-xl"
        />
        <div className="font-semibold text-lg text-white mt-2">{webcam.title}</div>
        <div className="text-auroraGreen text-xs mb-1">{webcam.country}</div>
        <a href={webcam.url} target="_blank" rel="noopener noreferrer" className="text-auroraGreen text-sm underline">Watch live</a>
      </div>
    );
  }

  // Se for IPCamLive ou similar (iframe)
  if (webcam.type === "iframe") {
    return (
      <div className="rounded-2xl bg-[#181e28] shadow-md p-4 flex flex-col items-center">
        <iframe
          src={webcam.url}
          width="320"
          height="180"
          title={webcam.title}
          frameBorder="0"
          allowFullScreen
          className="rounded-xl"
          style={{ background: "#000" }}
        />
        <div className="font-semibold text-lg text-white mt-2">{webcam.title}</div>
        <div className="text-auroraGreen text-xs mb-1">{webcam.country}</div>
        {/* Link opcional */}
        {webcam.thumb &&
          <a href={webcam.url} target="_blank" rel="noopener noreferrer" className="text-auroraGreen text-sm underline">Ver ao vivo</a>
        }
      </div>
    );
  }

  // Imagem estática (jpg/png)
  if (webcam.type === "image") {
    return (
      <div className="rounded-2xl bg-[#181e28] shadow-md p-4 flex flex-col items-center">
        <a href={webcam.url} target="_blank" rel="noopener noreferrer">
          <img
            src={webcam.thumb || webcam.url}
            alt={webcam.title}
            className="w-80 h-44 object-cover rounded-xl mb-2"
            style={{ background: "#222" }}
          />
        </a>
        <div className="font-semibold text-lg text-white">{webcam.title}</div>
        <div className="text-auroraGreen text-xs mb-1">{webcam.country}</div>
        <a href={webcam.url} target="_blank" rel="noopener noreferrer" className="text-auroraGreen text-sm underline">Ver ao vivo</a>
      </div>
    );
  }

  return null;
}

export default function WebcamGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {WEBCAMS.map((cam) => (
        <WebcamCard webcam={cam} key={cam.id} />
      ))}
    </div>
  );
}
