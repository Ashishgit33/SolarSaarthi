import Geomertry from "./Geometry.class.js";
export default class CustomDrawingManager {
  #drawMode;
  #unchangableOptions;
  constructor(map, configrations) {
    this.map = map;
    this.configrations = configrations;
    console.log(configrations)
    this.defaultOptions = {
      strokeColor: "#00ffff",
      strokeOpacity: 1,
      strokeWeight: 1.5,
      fillOpacity: 0,
    };
    this.#unchangableOptions = {
      map: this.map,
      geodesic: true,
      clickable: false,
      zIndex: 0,
    };
    this.#drawMode = null;
  }
  getTextMarker() {
    let rectangleWidth = 32,
      rectangleHeight = 14;
    const rectangleSvgPath = `
    M ${-rectangleWidth / 2} ${-rectangleHeight / 2} 
    L ${rectangleWidth / 2} ${-rectangleHeight / 2} 
    L ${rectangleWidth / 2} ${rectangleHeight / 2} 
    L ${-rectangleWidth / 2} ${rectangleHeight / 2} Z
  `;

    // console.log(rectangleSvgPath);
    return new google.maps.Marker({
      map: this.map,
      zIndex: 0,
      icon: {
        path: rectangleSvgPath,
        strokeWeight: 0,
        fillOpacity: 1,
        fillColor: "wheat",
        scale: 1,
      },
      clickable:false
    });
  }
  getTextLabel(text) {
    return {
      text,
      color: "black",
      fontWeight: "bold",
      fontSize: "8px",
    };
  }
  setDrawMode(drawMode) {
    if (this.#drawMode == drawMode) return;
    this.map.setOptions({ draggableCursor: "crosshair" });
    google.maps.event.trigger(this, "modeChanged", {
      drawMode,
    });
    if (drawMode == "polygon") {
      this.#drawPolygon();
    }
    if (drawMode == "rectangle") {
      this.#drawRectangle();
    }
    if (drawMode == "circle") {
      this.#drawCircle();
    }
    if (drawMode == null) {
      this.map.setOptions({ draggableCursor: "" });
    }
    this.#drawMode = drawMode;
  }
  #drawPolygon() {
    let scaleEnabled = false;
    let sideMarkers = [];
    let currMarker = null;
    let polygon = new google.maps.Polyline({
      ...this.defaultOptions,
      ...(this.configrations.polygonOptions || null),
      ...this.#unchangableOptions,
    });
    let drawLine = new google.maps.Polyline({
      path: [],
      clickable: false,
      strokeColor: polygon.strokeColor,
      strokeOpacity: 1,
      strokeWeight: 1.5,
      zIndex: 0,
      map: this.map,
    });
    var startPoint = new google.maps.Marker({
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        strokeColor: "#0000ff",
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: "#0000ff",
        fillOpacity: 1,
        scale: 3,
      },
      map: this.map,
    });
    let scaleListener = window.addEventListener("keypress", (event) => {
      if (event.keyCode != 32) return;
      if (scaleEnabled) scaleEnabled = false;
      else {
        if (polygon.getPath().getLength() > 1) scaleEnabled = true;
      }
    });
    let moveListener = this.map.addListener("mousemove", (event) => {
      let path = polygon.getPath();
      let drawPath = drawLine.getPath();
      let len = path.getLength();
      if (len == 0) return;
      let nextPoint;
      if (scaleEnabled) {
        let line = [path.getAt(len - 2), path.getAt(len - 1)];
        let perpendicularLine = Geomertry.getLineAtAngle(
          path.getAt(len - 1),
          line,
          90
        );
        let currLine = [path.getAt(len - 1), event.latLng];
        nextPoint = Geomertry.getProjectionOnLine(currLine, perpendicularLine);
      } else {
        nextPoint = event.latLng;
      }
      let length = google.maps.geometry.spherical.computeDistanceBetween(
        path.getAt(len - 1),
        nextPoint
      );
      let midPoint = google.maps.geometry.spherical.interpolate(
        path.getAt(len - 1),
        nextPoint,
        0.5
      );
      currMarker.setPosition(midPoint);
      currMarker.setLabel(this.getTextLabel(`${length.toFixed(2)}m`));
      drawPath.pop();
      drawPath.push(nextPoint);
    });
    let clickListener = this.map.addListener("click", (event) => {
      let path = polygon.getPath();
      let drawPath = drawLine.getPath();
      let len = path.getLength();
      if (len == 0) {
        drawLine.setPath([event.latLng, event.latLng]);
        path.push(event.latLng);
        startPoint.setPosition(event.latLng);
      } else {
        drawLine.setPath([drawPath.getAt(1), drawPath.getAt(1)]);
        path.push(drawPath.getAt(1));
      }
      if (scaleEnabled) scaleEnabled = false;
      currMarker = this.getTextMarker();
      sideMarkers.push(currMarker);
    });
    let polygonEndListener = startPoint.addListener("click", () => {
      destruct();
      let path = polygon.getPath();
      polygon = new google.maps.Polygon({
        ...this.defaultOptions,
        ...(this.configrations.polygonOptions || {}),
        ...this.#unchangableOptions,
        path,
        map: null,
      });
      this.#shapeComplete(polygon, "polygon", sideMarkers);
    });
    let modeChangeListener = google.maps.event.addListener(
      this,
      "modeChanged",
      (info) => {
        if (info.drawMode != "polygon") {
          destruct();
        }
      }
    );
    let destruct = () => {
      moveListener.remove();
      clickListener.remove();
      modeChangeListener.remove();
      polygonEndListener.remove();
      window.removeEventListener("keypress", scaleListener);
      drawLine.setMap(null);
      startPoint.setMap(null);
      polygon.setMap(null);
      sideMarkers.forEach((sideMarker) => sideMarker.setMap(null));
    };
  }
  #drawRectangle() {
    let topLeft = null,
      topRight = null;
    let lengthMarker = this.getTextMarker();
    let breathMarker = this.getTextMarker();
    let rectangle = new google.maps.Rectangle({
      ...this.defaultOptions,
      ...(this.configrations.polygonOptions || null),
      ...this.#unchangableOptions,
    });
    let moveListener = this.map.addListener("mousemove", (event) => {
      if (!topLeft) return;
      topRight = event.latLng;
      let bounds = new google.maps.LatLngBounds();
      bounds.extend(topLeft);
      bounds.extend(topRight);
      rectangle.setBounds(bounds);
      let { north, south, east, west } = bounds.toJSON();
      let breath = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(north, west),
        new google.maps.LatLng(north, east)
      );
      let length = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(south, west),
        new google.maps.LatLng(north, west)
      );
      let midLengthPoint = google.maps.geometry.spherical.computeOffset(
        new google.maps.LatLng(north, west),
        length / 2,
        180
      );
      let midBreathPoint = google.maps.geometry.spherical.computeOffset(
        new google.maps.LatLng(north, west),
        breath / 2,
        90
      );
      lengthMarker.setPosition(midLengthPoint);
      breathMarker.setPosition(midBreathPoint);
      lengthMarker.setLabel(this.getTextLabel(`${length.toFixed(2)}m`));
      breathMarker.setLabel(this.getTextLabel(`${breath.toFixed(2)}m`));
    });
    let clickListener = this.map.addListener("click", (event) => {
      if (!topLeft) {
        topLeft = event.latLng;
        return;
      } else {
        destruct();
        this.#shapeComplete(rectangle, "rectangle", [
          lengthMarker,
          breathMarker,
        ]);
      }
    });
    let modeChangeListener = google.maps.event.addListener(
      this,
      "modeChanged",
      (info) => {
        if (info.drawMode != "rectangle") {
          destruct();
        }
      }
    );
    let destruct = () => {
      clickListener.remove();
      moveListener.remove();
      modeChangeListener.remove();
      lengthMarker.setMap(null);
      breathMarker.setMap(null);
      rectangle.setMap(null);
    };
  }
  #drawCircle() {
    let center = null,
      radius;
    let radiusMarker = this.getTextMarker();
    let circle = new google.maps.Circle({
      ...this.defaultOptions,
      ...(this.configrations.polygonOptions || null),
      ...this.#unchangableOptions,
    });
    let clickListener = this.map.addListener("click", (event) => {
      if (!center) {
        center = event.latLng;
        radiusMarker.setPosition(center);
        circle.setCenter(center);
        return;
      } else {
        destruct();
        this.#shapeComplete(circle, "circle", [radiusMarker]);
      }
    });
    let moveListener = this.map.addListener("mousemove", (event) => {
      if (!center) return;
      let currPoint = event.latLng;
      radius = google.maps.geometry.spherical.computeDistanceBetween(
        currPoint,
        center
      );
      radiusMarker.setLabel(this.getTextLabel(`${radius.toFixed(2)}m`));
      circle.setRadius(radius);
    });
    let modeChangeListener = google.maps.event.addListener(
      this,
      "modeChanged",
      (info) => {
        if (info.drawMode != "circle") {
          destruct();
        }
      }
    );
    let destruct = () => {
      clickListener.remove();
      moveListener.remove();
      modeChangeListener.remove();
      radiusMarker.setMap(null);
      circle.setMap(null);
    };
  }
  #shapeComplete(shape, shapeType, textMarkers) {
    console.log("shape complete", shapeType);

    shape.setMap(this.map);
    textMarkers.forEach((textMarker) => textMarker.setMap(this.map));

    this.setDrawMode(null);
    this.setDrawMode(shapeType);
    google.maps.event.trigger(this, "shapeComplete", {
      shape,
      shapeType,
      textMarkers,
    });
  }
}
