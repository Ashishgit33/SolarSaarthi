import Geomertry from "./Geometry.class.js";
export default class SolarBoundry {
  constructor(map, polygon) {
    this.map = map;
    this.boundry = polygon;
    this.boundry.setMap(map);
    this.boundry.addListener("click", (event) => {
      if (!this.isActive) return;
      let { length, breath } = this.solarPanelConfig;
      let solarPanel = Geomertry.getRectangle(event.latLng, length, breath);
      if (!Geomertry.isInsideBoundry(solarPanel, this.boundry)) return;
      this.setSolarPanel(event.latLng);
    });
    this.boundry.addListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("toggle-active", {
          detail: this,
        })
      );
    });
    this.isActive = false;
    this.solarPanels = [];
    this.distancePopups = [];
    this.solarPanelConfig = {
      length: null,
      breath: null,
      horizontalMargin: null,
      verticalMargin: null,
      power: null,
    };
    this.addDistancePopup();
    document.dispatchEvent(
      new CustomEvent("toggle-active", {
        detail: this,
      })
    );
    this.fillSolarPanels();
  }
  async addDistancePopup() {
    let points = this.boundry.getPath();
    let length = points.getLength();
    let TextPopup = (await import("./TextPopup.class.js")).default;
    for (let i = 0; i < length; ++i) {
      let distance = google.maps.geometry.spherical.computeDistanceBetween(
        points.getAt(i),
        points.getAt((i + 1) % length)
      );
      let heading = google.maps.geometry.spherical.computeHeading(
        points.getAt(i),
        points.getAt((i + 1) % length)
      );
      let perpendicularHeading = (heading + 90) % 360;
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
      popup.setMap(this.map);
      this.distancePopups.push(popup);
    }
  }
  toggleFocus() {
    this.isActive = !this.isActive;
    this.boundry.setOptions({
      strokeColor: this.isActive ? "#00ffff" : "#313131",
      fillColor: this.isActive ? "#00ffff" : "#313131",
      fillOpacity: this.isActive ? 0.2 : 0.5,
    });
    this.solarPanels.forEach((solarPanel) =>
      solarPanel.setOptions({ clickable: this.isActive })
    );
  }
  setSolarPanel(latLng) {
    let { length, breath } = this.solarPanelConfig;
    (length = 2), (breath = 1);
    const solarPanel = Geomertry.getRectangle(latLng, length, breath);
    solarPanel.setOptions({
      strokeColor: "#000080",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#000080",
      fillOpacity: 0.75,
      clickable: true,
      draggable: true,
      zIndex: 1,
    });
    solarPanel.setMap(this.map);
    this.solarPanels.push(solarPanel);
    solarPanel.addListener("dblclick", () => {
      solarPanel.setMap(null);
      this.solarPanels = this.solarPanels.filter((item) => item !== solarPanel);
    });
    let dragStartPos = null;
    solarPanel.addListener("dragstart", (event) => {
      dragStartPos = solarPanel.getPath().getAt(0);
    });
    solarPanel.addListener("dragend", (event) => {
      if (Geomertry.isInsideBoundry(solarPanel, this.boundry)) return;
      solarPanel.setMap(null);
      this.solarPanels = this.solarPanels.filter((item) => item !== solarPanel);
      this.setSolarPanel(dragStartPos);
    });
  }
  fillSolarPanels() {
    let points = this.boundry.getPath();
    let bounds = new google.maps.LatLngBounds();
    let { length, breath, horizontalMargin, verticalMargin } =
      this.solarPanelConfig;
    (length = 2), (breath = 1), (horizontalMargin = 0.5), (verticalMargin = 1);
    points.forEach(function (coord) {
      bounds.extend(coord);
    });
    for (
      let rowLatlng = bounds.getSouthWest();
      bounds.contains(rowLatlng);
      rowLatlng = google.maps.geometry.spherical.computeOffset(
        rowLatlng,
        length + verticalMargin,
        0
      )
    ) {
      for (
        let colLatlng = rowLatlng;
        bounds.contains(colLatlng);
        colLatlng = google.maps.geometry.spherical.computeOffset(
          colLatlng,
          breath + horizontalMargin,
          90
        )
      ) {
        let totalSpaceNeed = Geomertry.getRectangle(
          colLatlng,
          length + verticalMargin,
          breath + horizontalMargin
        );
        if (Geomertry.isInsideBoundry(totalSpaceNeed, this.boundry)) {
          this.setSolarPanel(colLatlng);
        }
      }
    }
  }
}
