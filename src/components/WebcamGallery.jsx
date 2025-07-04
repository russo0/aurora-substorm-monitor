import React from "react";

const WEBCAMS = [
  {
    title: "Abisko Aurora Sky Station",
    country: "Suécia",
    img: "https://www.auroraskystation.se/contentassets/76877e0e987ecd9659e4e951f2bfaec5/webcam_large.jpg",
    url: "https://www.auroraskystation.se/live/",
  },
  {
    title: "Tromsø – Noruega",
    country: "Noruega",
    img: "https://www.auroralivestream.com/static/media/thumb-tromso.eba95321.jpg",
    url: "https://www.auroralivestream.com/aurora-live",
  },
  {
    title: "Kiruna AllSkyCam",
    country: "Suécia",
    img: "https://www.allsouthernsky.com/clients/kiruna.jpg", // Substituído pois original estava fora
    url: "https://www.allsouthernsky.com/kiruna/",
  },
];

export default function WebcamGallery() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-white">Webcams de Aurora ao Vivo</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {WEBCAMS.map((webcam, idx) => (
          <a
            key={idx}
            href={webcam.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-[#131e28] shadow-md p-2 flex flex-col items-center hover:scale-105 transition-transform"
            title={webcam.title}
          >
            <img
              src={webcam.img}
              alt={webcam.title}
              className="w-full h-44 object-cover rounded-lg mb-2"
              loading="lazy"
              style={{ background: "#222" }}
              onError={e => { e.target.onerror = null; e.target.src = "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"; }}
            />
            <div className="font-semibold text-white text-center">{webcam.title}</div>
            <div className="text-gray-400 text-sm">{webcam.country}</div>
            <div className="mt-1 text-emerald-400 text-xs">Assistir ao vivo</div>
          </a>
        ))}
      </div>
    </div>
  );
}
