import React, { useState } from "react";

const WEBCAMS = [
  {
    id: "abisko",
    title: "Abisko Sweden",
    country: "Sweden",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=o-dALODWYfg",
    videoId: "o-dALODWYfg"
  },
  {
    id: "kilpisjarvi",
    title: "Kilpisjärvi Finland",
    country: "Finland",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=ccTVAhJU5lg",
    videoId: "ccTVAhJU5lg"
  },
  {
    id: "rovaniemi",
    title: "Rovaniemi Finland",
    country: "Finland",
    type: "youtube",
    url: "https://www.youtube.com/watch?v=AvKdtZIb-6c",
    videoId: "AvKdtZIb-6c"
  },
  // Landhotel North (Iceland)
  {
    id: "landhotel-north",
    title: "Landhotel-North Iceland",
    country: "Iceland",
    type: "iframe",
    url: "https://g0.ipcamlive.com/player/player.php?alias=6565ed34e367a&autoplay=1&mute=1&disablezoombutton=1&disabledownloadbutton=1&disablenavigation=1",
    thumb: "https://landhotel.is/wp-content/uploads/2021/05/landhotel_front-1.jpg"
  },
  // Landhotel East (Iceland)
  {
    id: "landhotel-east",
    title: "Landhotel East-Iceland",
    country: "Iceland",
    type: "iframe",
    url: "https://g0.ipcamlive.com/player/player.php?alias=6501dd6068492&autoplay=1&mute=1&disablezoombutton=1&disabledownloadbutton=1&disablenavigation=1",
    thumb: "https://landhotel.is/wp-content/uploads/2021/05/landhotel_front-1.jpg"
  }
];

function getYoutubeThumb(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export default function WebcamGallery() {
  const [activeCam, setActiveCam] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {WEBCAMS.map(cam => (
        <div
          key={cam.id}
          className="rounded-2xl bg-[#181e28] shadow-md p-4 flex flex-col items-center"
          style={{ minHeight: 250 }}
        >
          <div className="w-full flex justify-center mb-2 relative">
            {/* YouTube Embed */}
            {cam.type === "youtube" && (
              <>
                {activeCam === cam.id ? (
                  <iframe
                    width="320"
                    height="180"
                    src={`https://www.youtube.com/embed/${cam.videoId}?autoplay=1&mute=1`}
                    title={cam.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-xl"
                  />
                ) : (
                  <div
                    style={{ position: "relative", cursor: "pointer" }}
                    onClick={() => setActiveCam(cam.id)}
                    title="Clique para assistir ao vivo"
                  >
                    <img
                      src={getYoutubeThumb(cam.videoId)}
                      alt={cam.title}
                      className="w-80 h-44 object-cover rounded-xl"
                    />
                    {/* Play icon overlay */}
                    <span
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        background: "rgba(0,0,0,0.7)",
                        borderRadius: "50%",
                        padding: 16,
                        zIndex: 2
                      }}
                    >
                      ▶️
                    </span>
                    {/* AO VIVO badge */}
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 14,
                        background: "#FF3232",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "bold",
                        padding: "2px 8px",
                        borderRadius: 8,
                        letterSpacing: 1,
                        zIndex: 2
                      }}
                    >
                      AO VIVO
                    </span>
                  </div>
                )}
              </>
            )}

            {/* IP Camera Embed */}
            {cam.type === "iframe" && (
              <>
                {activeCam === cam.id ? (
                  <iframe
                    src={cam.url}
                    width="320"
                    height="180"
                    frameBorder="0"
                    allowFullScreen
                    className="rounded-xl"
                    title={cam.title}
                  />
                ) : (
                  <div
                    style={{ position: "relative", cursor: "pointer" }}
                    onClick={() => setActiveCam(cam.id)}
                    title="Clique para assistir ao vivo"
                  >
                    <img
                      src={cam.thumb}
                      alt={cam.title}
                      className="w-80 h-44 object-cover rounded-xl"
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 14,
                        background: "#FF3232",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "bold",
                        padding: "2px 8px",
                        borderRadius: 8,
                        letterSpacing: 1,
                        zIndex: 2
                      }}
                    >
                      AO VIVO
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="font-semibold text-lg text-white text-center">{cam.title}</div>
          <div className="text-auroraGreen text-xs mb-1">{cam.country}</div>
          <a
            href={cam.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-auroraGreen text-sm underline"
          >
            Abrir em nova aba
          </a>
        </div>
      ))}
    </div>
  );
}
