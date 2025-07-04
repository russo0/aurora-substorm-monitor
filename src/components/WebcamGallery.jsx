import React from "react";

const WEBCAMS = [
  {
    name: "Abisko Aurora Sky Station",
    url: "https://www.auroraskystation.se/live/",
    img: "https://www.auroraskystation.se/live/image.jpg", // troque para uma imagem estática se tiver
    country: "Suécia",
  },
  {
    name: "Tromsø – Noruega",
    url: "https://www.norwegianweather.com/webcam/tromso",
    img: "https://www.norwegianweather.com/webcam/tromso/image.jpg",
    country: "Noruega",
  },
  {
    name: "Kiruna AllSkyCam",
    url: "https://www.allskaicam.com/kiruna",
    img: "https://www.allskaicam.com/kiruna/preview.jpg",
    country: "Suécia",
  },
  // Adicione outras webcams legais!
];

export default function WebcamGallery() {
  return (
    <div className="w-full max-w-2xl mt-8 mb-12">
      <h2 className="text-xl font-bold text-white mb-3">Webcams de Aurora ao Vivo</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {WEBCAMS.map((cam, idx) => (
          <a
            href={cam.url}
            key={idx}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl shadow-md overflow-hidden bg-[#161f27] hover:ring-2 ring-auroraGreen group transition"
            title={cam.name}
          >
            <div className="aspect-video w-full bg-[#23292e] flex items-center justify-center">
              {cam.img ? (
                <img
                  src={cam.img}
                  alt={cam.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition"
                  loading="lazy"
                  style={{ minHeight: 80, maxHeight: 120 }}
                />
              ) : (
                <span className="text-white/60 text-sm">Imagem indisponível</span>
              )}
            </div>
            <div className="p-2">
              <div className="font-semibold text-white">{cam.name}</div>
              <div className="text-xs text-gray-400">{cam.country}</div>
              <div className="text-auroraGreen text-xs mt-1">Assistir ao vivo</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
