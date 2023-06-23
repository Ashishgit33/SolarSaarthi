let map, marker;
let confirmApiBtn=document.getElementById('confirm-key');
let drawPolygonBtn = document.querySelector(".draw-polygon");
let Map, AdvancedMarkerElement;
let drawingManager;
let polygon;
let solarPanels = [];

function changeLocation() {
  var longitude = document.getElementById("longitude").value;
  var latitude = document.getElementById("latitude").value;

  var parsedLongitude = parseFloat(longitude);
  var parsedLatitude = parseFloat(latitude);

  if (isNaN(parsedLongitude) || isNaN(parsedLatitude)) {
    console.log("invalid input");
    return;
  }
  console.log(parsedLatitude, parsedLongitude);
  const position = { lat: parsedLatitude, lng: parsedLongitude };
  map.setCenter(position);
}

function createLatLngControl(){
  let locationForm = document.createElement("div");
  locationForm.setAttribute("class", "location-form");
  locationForm.innerHTML='<div class="location-form"><div class="input-group"><label for="longitude">Longitude:</label><input type="text" id="longitude" placeholder="Enter longitude" /></div><div class="input-group">        <label for="latitude">Latitude:</label        ><input type="text" id="latitude" placeholder="Enter latitude" />      </div>      <div class="button-group">        <button class="locate-btn" >Locate</button>      </div>    </div>'
  let locateBtn=locationForm.querySelector('.locate-btn');
  locateBtn.addEventListener('click',changeLocation);
  return locationForm;
}

function initMap() {
  navigator.geolocation.getCurrentPosition(async (position) => {
    let pos = { lat: position.coords.latitude, lng: position.coords.longitude };

    map = new google.maps.Map(document.getElementById("map"), {
      center: pos,
      zoom: 20,
      mapTypeControl: false,
      streetViewControl: false,
      mapTypeId: "satellite",
    });
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(createLatLngControl());
    drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        editable: false,
        draggable: true,
        clickable: false,
        strokeColor: "#00ffff",
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: "#00ffff",
        fillOpacity: 0.2,
      },
    });
    drawingManager.setMap(map);
    google.maps.event.addListener(
      drawingManager,
      "overlaycomplete",
      function (event) {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          if (polygon) {
            polygon.setMap(null);
          }
          polygon = event.overlay;
          // polygon.setEditable(true);
        }
      }
    );
    google.maps.event.addListener(
      drawingManager,
      "polygoncomplete",
      function (polygon) {
        polygon.getPath().forEach((latlng) => {
          console.log(latlng.toString());
        });
      }
    );
    map.addListener("click", (event) => {
      let topleft = event.latLng;
      let topright = google.maps.geometry.spherical.computeOffset(
        topleft,
        1.7,
        180
      );
      let bottomright = google.maps.geometry.spherical.computeOffset(
        topright,
        1,
        90
      );
      let bottomleft = google.maps.geometry.spherical.computeOffset(
        bottomright,
        1.7,
        0
      );
      console.log(topleft.toString());
      const solarPanel = new google.maps.Polygon({
        path: [topleft, topright, bottomright, bottomleft],
        strokeColor: "#000080",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#000080",
        fillOpacity: 0.75,
        draggable: true,
      });
      solarPanels.push(solarPanel);
      solarPanel.addListener("dblclick", (event) => {
        solarPanel.setMap(null);
        solarPanels = solarPanels.filter((item) => item !== solarPanel);
      });
      solarPanel.addListener("dragend", (event) => {});
      solarPanel.setMap(map);
    });
  });
}
function loadMapScript(){
  let key=document.getElementById('api-key').value;
  if(!key) return;
  console.log(key)
  let mapScriptSrc=`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=drawing,geometry&callback=initMap`;
  console.log(mapScriptSrc)
  let script=document.createElement('script',mapScriptSrc);
  script.type= 'text/javascript';
  script.setAttribute('src',mapScriptSrc);
  document.head.appendChild(script);
  document.body.removeChild(document.body.querySelector('.api-form'));
}

confirmApiBtn.addEventListener('click',loadMapScript);
window.initMap = initMap;
