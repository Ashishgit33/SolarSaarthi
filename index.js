let map, marker;
let locationForm = document.querySelector(".location-form");
let confirmApiBtn = document.getElementById("confirm-key");
let drawPolygonBtn = document.querySelector(".draw-polygon");
let Map, AdvancedMarkerElement;
let drawingManager;
let polygon;
let solarPanels = [];
let distancePopups = [];

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

function initMap() {
  navigator.geolocation.getCurrentPosition(async (position) => {
    let pos = { lat: position.coords.latitude, lng: position.coords.longitude };

    class Popup extends google.maps.OverlayView {
      position;
      containerDiv;
      constructor(position, content) {
        super();
        this.position = position;
        const contentContainer = document.createElement("div");
        contentContainer.innerHTML = content;
        contentContainer.classList.add("popup-bubble");
        // This zero-height div is positioned at the bottom of the bubble.
        const bubbleAnchor = document.createElement("div");

        bubbleAnchor.classList.add("popup-bubble-anchor");
        bubbleAnchor.appendChild(contentContainer);
        // This zero-height div is positioned at the bottom of the tip.
        this.containerDiv = document.createElement("div");
        this.containerDiv.classList.add("popup-container");
        this.containerDiv.appendChild(bubbleAnchor);

        // Optionally stop clicks, etc., from bubbling up to the map.
        Popup.preventMapHitsAndGesturesFrom(this.containerDiv);
      }
      /** Called when the popup is added to the map. */
      onAdd() {
        this.getPanes().floatPane.appendChild(this.containerDiv);
      }
      /** Called when the popup is removed from the map. */
      onRemove() {
        if (this.containerDiv.parentElement) {
          this.containerDiv.parentElement.removeChild(this.containerDiv);
        }
      }
      /** Called each frame when the popup needs to draw itself. */
      draw() {
        const divPosition = this.getProjection().fromLatLngToDivPixel(
          this.position
        );
        // Hide the popup when it is far out of view.
        const display =
          Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
            ? "block"
            : "none";

        if (display === "block") {
          this.containerDiv.style.left = divPosition.x + "px";
          this.containerDiv.style.top = divPosition.y + "px";
        }

        if (this.containerDiv.style.display !== display) {
          this.containerDiv.style.display = display;
        }
      }
    }
    map = new google.maps.Map(document.getElementById("map"), {
      center: pos,
      zoom: 20,
      mapTypeControl: false,
      streetViewControl: false,
      mapTypeId: "satellite",
    });
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(locationForm);
    locationForm.style.display = "flex";
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
    });
    drawingManager.setMap(map);
    google.maps.event.addListener(
      drawingManager,
      "drawingmode_changed",
      function () {
        if(drawingManager.getDrawingMode()==null){
          distancePopups.forEach((popup) => popup.setMap(null));
        }else{
          distancePopups.forEach((popup) => popup.setMap(map));
        }
      }
    );
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
          // console.log(midPoint.toString());
          let popup = new Popup(adjustedMidPoint, `${distance.toFixed(2)} m`);
          popup.setMap(map);
          distancePopups.push(popup);
        }
      }
    );
    map.addListener("click", (event) => {
      let topleft = event.latLng;
      let topright = google.maps.geometry.spherical.computeOffset(
        topleft,
        1,
        180
      );
      let bottomright = google.maps.geometry.spherical.computeOffset(
        topright,
        1.7,
        90
      );
      let bottomleft = google.maps.geometry.spherical.computeOffset(
        bottomright,
        1,
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
function loadMapScript() {
  let key = document.getElementById("api-key").value;
  if (!key) return;
  console.log(key);
  let mapScriptSrc = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=drawing,geometry&callback=initMap`;
  console.log(mapScriptSrc);
  let script = document.createElement("script", mapScriptSrc);
  script.type = "text/javascript";
  script.setAttribute("src", mapScriptSrc);
  document.head.appendChild(script);
  document.body.removeChild(document.body.querySelector(".api-form"));
}

confirmApiBtn.addEventListener("click", loadMapScript);
window.initMap = initMap;
