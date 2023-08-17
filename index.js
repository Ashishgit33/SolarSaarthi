import solarBoundryEventsHandler from "./utils/solarBoundryEventsHandler.js";
import CustomDrawingManager from "./utils/CustomDrawingManager.class.js";




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
    console.log('map loaded');
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
    disableDefaultUI: true,
    backgroundColor: 'transparent',
    gestureHandling: 'greedy',
    fullscreenControlOptions: {
      position: google.maps.ControlPosition.BOTTOM_RIGHT,
    },
    mapTypeId: "satellite",
    mapId: "50da7aa2fc7c40bc",
  });
  

  let drawingManagerForBoundry = new CustomDrawingManager(map,{
  });
  let obstacleDrawOption = {
    strokeWeight: 1.5,
    strokeColor: "#ff0000",
  };
  let drawingManagerForObstacle = new CustomDrawingManager(map, {
    polygonOptions: obstacleDrawOption,
    rectangleOptions: obstacleDrawOption,
    circleOptions: obstacleDrawOption,
  });
  solarBoundryEventsHandler(
    map,
    drawingManagerForBoundry,
    drawingManagerForObstacle,
    pos
  );
  locateBtn.addEventListener("click", () => {
    changeLocation(map);
  });
  window.drawingManager = drawingManagerForBoundry;
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
    document.getElementById("main").style.display = "flex";
  } catch (err) {
    console.log("error while loading maps script:", err);
  }
}

window.onload = () => {
  let confirmApiBtn = document.getElementById("confirm-key");
  confirmApiBtn.addEventListener("click", loadMapScript);
};

window.initMap = initMap;
