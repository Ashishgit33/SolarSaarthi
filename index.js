let map, marker;
let locate = document.querySelector(".locate-btn");
let drawPolygonBtn = document.querySelector(".draw-polygon");
let Map, AdvancedMarkerElement;
let drawingManager;
let polygon;
let solarPanels=[]


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
  const position = { lat:parsedLatitude, lng:parsedLongitude};
  map.setCenter(position);
}






function initMap() {
  navigator.geolocation.getCurrentPosition(async (position) => {
    let pos = { lat: position.coords.latitude, lng: position.coords.longitude };

    map = new google.maps.Map(document.getElementById("map"), {
      center: pos,
      zoom: 20,
      mapTypeControl:false,
      streetViewControl:false,
      mapTypeId:'satellite',

    });
    // let div=document.createElement('div')
    // div.appendChild(document.querySelector('.location-form'))
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(document.querySelector('.location-form'));
    drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        editable: false,
        draggable:true,
        clickable:false,
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
    google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
      polygon.getPath().forEach((latlng)=>{
        console.log(latlng.toString())
      })
    });
    map.addListener('click',(event)=>{
      let topleft=event.latLng;
      let topright=google.maps.geometry.spherical.computeOffset(topleft, 1.7, 180);
      let bottomright=google.maps.geometry.spherical.computeOffset(topright,1,90);
      let bottomleft=google.maps.geometry.spherical.computeOffset(bottomright,1.7,0);
      console.log(topleft.toString())
      const solarPanel = new google.maps.Polygon({
        path:[topleft,topright,bottomright,bottomleft],
        strokeColor: "#000080",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#000080",
        fillOpacity: 0.75,
        draggable:true,
      });
      solarPanels.push(solarPanel)
      solarPanel.addListener('dblclick',(event)=>{
        solarPanel.setMap(null);
        solarPanels=solarPanels.filter(item=>item!==solarPanel)
      })
      solarPanel.addListener('dragend',(event)=>{
        
      })
      solarPanel.setMap(map);
    })
  });
}


locate.addEventListener("click", changeLocation);
window.initMap = initMap;
