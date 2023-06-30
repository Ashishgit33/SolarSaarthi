let map, marker;
let locationForm = document.querySelector(".location-form");
let confirmApiBtn = document.getElementById("confirm-key");
let Map;
let drawingManager;
let polygon;
let solarPanels = [];
let distancePopups = [];

function changeLocation() {
  try {
    var longitude = document.getElementById("longitude").value;
    var latitude = document.getElementById("latitude").value;

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

function clickToAddSolarPanel(map, drawingManager) {
  let addSolarPanelEvent = (event) => {
    renderSolarPanel(map, event.latLng);
  };
  let addSolarPanelEventListener = map.addListener("click", addSolarPanelEvent);
  drawingManager.addListener("drawingmode_changed", () => {
    if (drawingManager.getDrawingMode() != null) {
      google.maps.event.removeListener(addSolarPanelEventListener);
    } else {
      addSolarPanelEventListener = map.addListener("click", addSolarPanelEvent);
    }
  });
}

function renderSolarPanel(map, latlng, canRender) {
  let length = 1.5,
    breath = 1;
  let topleft = latlng;
  let topright = google.maps.geometry.spherical.computeOffset(
    topleft,
    breath,
    90
  );
  let bottomright = google.maps.geometry.spherical.computeOffset(
    topright,
    length,
    180
  );
  let bottomleft = google.maps.geometry.spherical.computeOffset(
    bottomright,
    breath,
    -90
  );
  let path = [topleft, topright, bottomright, bottomleft];
  const solarPanel = new google.maps.Polygon({
    path,
    strokeColor: "#000080",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#000080",
    fillOpacity: 0.75,
    draggable: true,
  });
  if (!canRender(solarPanel)) return;
  solarPanel.setMap(map);
  solarPanels.push(solarPanel);
  //double click to delete the solar panel
  solarPanel.addListener("dblclick", (event) => {
    solarPanel.setMap(null);
    solarPanels = solarPanels.filter((item) => item !== solarPanel);
  });
}

function fillSolarPanels(map, polygon) {
  let points = polygon.getPath();
  let bounds = new google.maps.LatLngBounds();
  let renderCondition=(solarPanel)=>{
    let value=true;
    solarPanel.getPath().forEach((currPoint)=>{
      value=value && google.maps.geometry.poly.containsLocation(currPoint,polygon);
    })
    return value;
  }
  points.forEach(function (coord) {
    bounds.extend(coord);
  });
  for (
    let rowLatlng = bounds.getSouthWest();
    bounds.contains(rowLatlng);
    rowLatlng = google.maps.geometry.spherical.computeOffset(rowLatlng, 2, 0)
  ) {
    for (
      let colLatlng = rowLatlng;
      bounds.contains(colLatlng);
      colLatlng = google.maps.geometry.spherical.computeOffset(colLatlng, 2, 90)
    ) {
      renderSolarPanel(map, colLatlng,renderCondition);
    }
  }
}

function getPosition(options) {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  );
}

function whenMapReady(map) {
  google.maps.event.addListenerOnce(map, "tilesloaded", function () {
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(locationForm);
    locationForm.style.display = "flex";
  });
}

async function initMap() {
  let position = await getPosition();
  let pos = { lat: position.coords.latitude, lng: position.coords.longitude };
  console.log(pos);
  let TextPopup = (await import("./TextPopup.class.js")).default;
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
      draggable: true,
      clickable: false,
      strokeColor: "#00ffff",
      strokeOpacity: 1,
      strokeWeight: 3,
      fillColor: "#00ffff",
      fillOpacity: 0.2,
    },
    map,
  });
  // google.maps.event.addListener(
  //   drawingManager,
  //   "drawingmode_changed",
  //   function () {
  //     if (drawingManager.getDrawingMode() == null) {
  //       distancePopups.forEach((popup) => popup.setMap(null));
  //     } else {
  //       distancePopups.forEach((popup) => popup.setMap(map));
  //     }
  //   }
  // );
  google.maps.event.addListener(
    drawingManager,
    "overlaycomplete",
    function (event) {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        if (polygon) {
          polygon.setMap(null);
        }
        polygon = event.overlay;
      }
    }
  );
  google.maps.event.addListener(
    drawingManager,
    "polygoncomplete",
    function (polygon) {
      distancePopups.forEach((popup) => popup.setMap(null));
      distancePopups = [];
      let points = polygon.getPath();
      let length = points.getLength();
      for (let i = 0; i < length; ++i) {
        let distance = google.maps.geometry.spherical.computeDistanceBetween(
          points.getAt(i),
          points.getAt((i + 1) % length)
        );
        let heading = google.maps.geometry.spherical.computeHeading(
          points.getAt(i),
          points.getAt((i + 1) % length)
        );
        let perpendicularHeading = (heading - 90) % 360;
        let midPoint = google.maps.geometry.spherical.interpolate(
          points.getAt(i),
          points.getAt((i + 1) % length),
          0.5
        );
        let adjustedMidPoint = google.maps.geometry.spherical.computeOffset(
          midPoint,
          3,
          perpendicularHeading
        );
        let popup = new TextPopup(adjustedMidPoint, `${distance.toFixed(2)} m`);
        popup.setMap(map);
        distancePopups.push(popup);
      }
      fillSolarPanels(map, polygon);
    }
  );
  whenMapReady(map);
  clickToAddSolarPanel(map, drawingManager);
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
