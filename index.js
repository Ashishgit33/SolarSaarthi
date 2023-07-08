import solarBoundryEventsHandler from "./utils/solarBoundryEventsHandler.js";

function changeLocation(map) {
  try {
    let locationForm = document.querySelector(".location-form");
    let longitude = locationForm.getElementById("longitude").value;
    let latitude = locationForm.getElementById("latitude").value;

    let parsedLongitude = parseFloat(longitude);
    let parsedLatitude = parseFloat(latitude);

    if (isNaN(parsedLongitude) || isNaN(parsedLatitude))
      throw Error("invalid lat lng coords");
    const position = { lat: parsedLatitude, lng: parsedLongitude };
    map.setCenter(position);
  } catch (err) {
    console.log("Error occured while changing location:", err);
  }
}

function getPosition(options) {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  );
}

function whenMapReady(map) {
  google.maps.event.addListenerOnce(map, "tilesloaded", function () {
    let locationForm = document.querySelector(".location-form");
    let setpanelForm = document.querySelector(".setpanel-form");
    locationForm.style.display = "flex";
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(locationForm);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(setpanelForm);
  });
}

async function initMap() {
  let position = await getPosition();
  let pos = { lat: position.coords.latitude, lng: position.coords.longitude };
  let locationForm = document.querySelector(".location-form");
  let locateBtn = locationForm.querySelector(".locate-btn");
  let map = new google.maps.Map(document.getElementById("map"), {
    center: pos,
    zoom: 20,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    fullscreenControlOptions: {
      position: google.maps.ControlPosition.BOTTOM_RIGHT,
    },
    mapTypeId: "satellite",
  });
  locateBtn.addEventListener("click", () => {
    changeLocation(map);
  });
  let addBoundry = solarBoundryEventsHandler(map);
  let drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [google.maps.drawing.OverlayType.POLYGON],
    },
    polygonOptions: {
      editable: false,
      draggable: false,
      clickable: true,
      strokeColor: "#00ffff",
      strokeOpacity: 1,
      strokeWeight: 3,
      fillColor: "#00ffff",
      fillOpacity: 0.2,
      zIndex: 0,
    },
    map,
  });
  google.maps.event.addListener(
    drawingManager,
    "polygoncomplete",
    function (polygon) {
      drawingManager.setDrawingMode(null);
      polygon.setMap(null);
      addBoundry(polygon);
    }
  );
  whenMapReady(map);
}

function loadMapScript() {
  try {
    let key = document.getElementById("api-key").value;
    if (!key) return;
    let mapScriptSrc = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=drawing,geometry&callback=initMap`;
    let script = document.createElement("script", mapScriptSrc);
    script.type = "text/javascript";
    script.setAttribute("src", mapScriptSrc);
    document.head.appendChild(script);
    document.body.removeChild(document.body.querySelector(".api-form"));
  } catch (err) {
    console.log("error while loading maps script:", err);
  }
}

window.onload = () => {
  console.log("hello world");
  let confirmApiBtn = document.getElementById("confirm-key");
  confirmApiBtn.addEventListener("click", loadMapScript);
};

window.initMap = initMap;
