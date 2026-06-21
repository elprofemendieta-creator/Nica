var APP_DATA = {
  "scenes": [
    {
      "id": "0-img1",
      "name": "img1",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        }
      ],
      "faceSize": 320,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -0.02065770912397369,
          "pitch": -0.0034426935155593696,
          "rotation": 6.283185307179586,
          "target": "1-img2"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "1-img2",
      "name": "img2",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        }
      ],
      "faceSize": 320,
      "initialViewParameters": {
        "yaw": 0.23912885643749782,
        "pitch": -0.13649053774112296,
        "fov": 1.311866485837528
      },
      "linkHotspots": [
        {
          "yaw": -3.0822637619831124,
          "pitch": 0.033627670419503985,
          "rotation": 0,
          "target": "0-img1"
        }
      ],
      "infoHotspots": [
        {
          "yaw": 0.4224041184609977,
          "pitch": -0.11340872654420764,
          "title": "Altar Mayor",
          "text": "Basílica menor de San Sebastian"
       // Después de crear el hotspot:
if (hotspotData.title === 'Token Oculto 1') {
  hotspotElement.addEventListener('click', () => {
    window.parent.postMessage({ type: 'TOKEN_ENCONTRADO', token: 'token1' }, '*');
  });
}
 }
); },
        {
          "yaw": -1.9916273830548157,
          "pitch": 0.02657746133935568,
          "title": "Token Oculto",
          "text": "Has encontrado un objeto especial"
        }
if (hotspotData.title === 'Token Oculto 2') {
  hotspotElement.addEventListener('click', () => {
    window.parent.postMessage({ type: 'TOKEN_ENCONTRADO', token: 'token2' }, '*');
  });
}

 }
);
      ]
    }
  ],
  "name": "Project Title",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": true,
    "fullscreenButton": true,
    "viewControlButtons": true
  }
};
