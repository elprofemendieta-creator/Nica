/*
 * Copyright 2016 Google Inc. All rights reserved.
 * Modificado para Integración Firebase – Visitas Pinolera
 */
'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Create link hotspots.
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Create info hotspots (algunos serán tokens)
    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // ... (resto del código original sin cambios hasta la definición de createInfoHotspotElement)

  // Funciones originales (se mantienen)
  function sanitize(s) { /* ... */ }
  function switchScene(scene) { /* ... */ }
  function updateSceneName(scene) { /* ... */ }
  function updateSceneList(scene) { /* ... */ }
  function showSceneList() { /* ... */ }
  function hideSceneList() { /* ... */ }
  function toggleSceneList() { /* ... */ }
  function startAutorotate() { /* ... */ }
  function stopAutorotate() { /* ... */ }
  function toggleAutorotate() { /* ... */ }
  function createLinkHotspotElement(hotspot) { /* ... */ }
  function findSceneById(id) { /* ... */ }
  function findSceneDataById(id) { /* ... */ }
  function stopTouchAndScrollEventPropagation(element, eventList) { /* ... */ }

  // ---------- MODIFICACIÓN CLAVE: createInfoHotspotElement ----------
  function createInfoHotspotElement(hotspot) {

    // Mapeo de títulos a token (según data.js)
    var token = null;
    if (hotspot.title === 'Altar Mayor') token = 'token1';
    else if (hotspot.title === 'Token Oculto') token = 'token2';

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');
    if (token) {
      wrapper.classList.add('token-hotspot');   // clase extra para estilos personalizados
    }

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    // Usar un ícono distinto para tokens
    if (token) {
      icon.src = 'img/token.png';   // Asegúrate de tener esta imagen o usa una base64
      icon.classList.add('token-hotspot-icon');
    } else {
      icon.src = 'img/info.png';
    }
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    // Create text element.
    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    wrapper.appendChild(header);
    wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    // Comportamiento especial para tokens
    if (token) {
      // Al hacer clic en el header o en el modal, guardar token (sin toggle visual)
      header.addEventListener('click', function(e) {
        e.stopPropagation();
        window.guardarToken(token);
      });
      modal.querySelector('.info-hotspot-header').addEventListener('click', function(e) {
        e.stopPropagation();
        window.guardarToken(token);
      });
      // También ocultamos el tooltip automáticamente después de un instante si se abrió
    } else {
      // Show content when hotspot is clicked (comportamiento original)
      wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);
      // Hide content when close icon is clicked.
      modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);
    }

    // Prevent touch and scroll events from reaching the parent element.
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // ---------- FIN DE MODIFICACIÓN ----------

  // Display the initial scene.
  switchScene(scenes[0]);

})();
