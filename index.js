import Geomertry from "./utils/Geometry.class.js";
import SolarBoundry from "./utils/SolarBoundry.class.js";

let map;
let locationForm = document.querySelector(".location-form");
let setpanelForm=document.querySelector(".setpanel-form");
let confirmApiBtn = document.getElementById("confirm-key");
let drawingManager;


function changeLocation() {
  try {
    var longitude = locationForm.getElementById("longitude").value;
    var latitude = locationForm.getElementById("latitude").value;

    var parsedLongitude = parseFloat(longitude);
    var parsedLatitude = parseFloat(latitude);

    if (isNaN(parsedLongitude) || isNaN(parsedLatitude))
      throw Error("invalid lat lng coords");
    const position = { lat: parsedLatitude, lng: parsedLongitude };
    map.setCenter(position);
  } catch (err) {
    console.log("Error occured while changing location:", err);
  }
}

let addBoundry=(function (){
  let solarBoundries=[]
  let activeSolarBoundry=null;
  document.addEventListener('toggle-active',(event)=>{
    if(activeSolarBoundry)
      activeSolarBoundry.toggleFocus();
    activeSolarBoundry=event.detail;
    activeSolarBoundry.toggleFocus();
  })
  return function(polygon){
    let isIntersecting=solarBoundries.reduce((acc,solarBoundry)=>{
      acc=acc||Geomertry.isIntersecting(polygon,solarBoundry.boundry);
      return acc; 
    },false);                           
    if(isIntersecting)
      return
    solarBoundries.push(new SolarBoundry(map,polygon));
  }
})();

function getPosition(options) {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  );
}

function whenMapReady(map) {
  google.maps.event.addListenerOnce(map, "tilesloaded", function () {
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(locationForm);
    map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(setpanelForm);
    locationForm.style.display = "flex";
    setpanelForm.style.display="flex";
  });
}

async function initMap() {
  let position = await getPosition();
  let pos = { lat: position.coords.latitude, lng: position.coords.longitude };
  let locateBtn = locationForm.querySelector(".locate-btn");
  locateBtn.addEventListener("click", changeLocation);
  map = new google.maps.Map(document.getElementById("map"), {
    center: pos,
    zoom: 20,
    mapTypeControl: false,
    streetViewControl: false,
    mapTypeId: "satellite",
  });

  drawingManager = new google.maps.drawing.DrawingManager({
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
      zIndex:0
    },
    map,
  });
  google.maps.event.addListener(
    drawingManager,
    "polygoncomplete",
    function (polygon) {
      drawingManager.setDrawingMode(null)
      polygon.setMap(null)
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

confirmApiBtn.addEventListener("click", loadMapScript);
window.initMap = initMap;
