import Geomertry from "./Geometry.class.js";
import SolarBoundry from "./SolarBoundry.class.js";
import { ThreeJSOverlayView } from "@googlemaps/three";
import {
  Mesh,
  MeshStandardMaterial,
  Vector3,
  PerspectiveCamera,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  CylinderGeometry,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
  Matrix4,
  AmbientLight,
  AxesHelper,
  ShapeGeometry,
} from "three";

export default function solarBoundryEventsHandler(
  map,
  drawingManagerForBoundry,
  drawingManagerForObstacle,
  pos
) {
  let solarBoundries = [];
  let activeSolarBoundry = null;
  let setpanelForm = document.querySelector(".setpanel-form");
  let boundryCount = 0;
  let [lengthInput, breathInput, horizontalMarginInput, verticalMarginInput] =
    setpanelForm.querySelectorAll(".solar-panel-config .input-group>input");
  let drawFormBoundry = document.querySelector("#draw-boundry-form>select");
  let drawFormObstacle = document.querySelector("#draw-obstacle-form>select");

  let overlay3d = new ThreeJSOverlayView({
    anchor: { ...pos, altitude: 0 },
  });
  document.getElementById("view3d").addEventListener("click", (event) => {
    if (event.target.checked) {
      
      map.setTilt(45);
      solarBoundries.forEach((boundry) => {
        boundry.view2d(false);

        boundry.init3dScene(overlay3d);
      });
      overlay3d.setMap(map);
      overlay3d.onDraw = () => {
        overlay3d.requestRedraw();
      };
    } else {
      overlay3d.setMap(null);
      map.setTilt(0);
      solarBoundries.forEach((boundry) => {
        boundry.view2d(true);
      });
    }
  });
  drawFormBoundry.addEventListener("change", () => {
    drawingManagerForObstacle.setDrawMode(null);
    drawingManagerForBoundry.setDrawMode(drawFormBoundry.value);
  });
  drawFormObstacle.addEventListener("change", () => {
    console.log(drawFormObstacle.value);
    if (!activeSolarBoundry) return;
    drawingManagerForBoundry.setDrawMode(null);
    drawingManagerForObstacle.setDrawMode(drawFormObstacle.value);
  });
  document.addEventListener("toggle-active", (event) => {
    if (activeSolarBoundry) {
      activeSolarBoundry.toggleFocus();
    }
    activeSolarBoundry = event.detail;
    window.activeSolarBoundry = event.detail;
    activeSolarBoundry.toggleFocus();
    lengthInput.value = activeSolarBoundry.solarPanelConfig.length;
    breathInput.value = activeSolarBoundry.solarPanelConfig.breath;
    horizontalMarginInput.value =
      activeSolarBoundry.solarPanelConfig.verticalMargin;
    verticalMarginInput.value =
      activeSolarBoundry.solarPanelConfig.horizontalMargin;
    setpanelForm.querySelector(
      "#boundry-id"
    ).textContent = `#${activeSolarBoundry.id}`;
    setpanelForm.style.display = "flex";
  });
  setpanelForm.querySelector(".delete-btn").addEventListener("click", () => {
    if (!activeSolarBoundry) return;
    activeSolarBoundry.destruct();
    solarBoundries = solarBoundries.filter(
      (boundry) => boundry !== activeSolarBoundry
    );
    activeSolarBoundry = null;
    setpanelForm.style.display = "none";
  });
  setpanelForm.querySelector(".close-form").addEventListener("click", () => {
    if (activeSolarBoundry) {
      activeSolarBoundry.toggleFocus();
      activeSolarBoundry = null;
    }
    setpanelForm.style.display = "none";
  });
  setpanelForm.querySelector(".setpanel-btn").addEventListener("click", () => {
    activeSolarBoundry.setSolarPanelConfig({
      length: lengthInput.value,
      breath: breathInput.value,
      verticalMargin: horizontalMarginInput.value,
      horizontalMargin: verticalMarginInput.value,
    });
    activeSolarBoundry.fillSolarPanels();
  });
  setpanelForm
    .querySelector(".clearpanel-btn")
    .addEventListener("click", () => {
      if (activeSolarBoundry) activeSolarBoundry.clearPanels();
    });
  setpanelForm
    .querySelector("#show-distance")
    .addEventListener("click", (event) => {
      if (!activeSolarBoundry) return;
      activeSolarBoundry.toggleDistance();
    });
  function addSolarBoundry(polygon, sideMarkers) {
    let isIntersecting = solarBoundries.reduce((acc, solarBoundry) => {
      acc = acc || Geomertry.isIntersecting(polygon, solarBoundry.boundry);
      return acc;
    }, false);
    if (isIntersecting) return;
    boundryCount += 1;
    let newBoundry = new SolarBoundry(map, polygon, sideMarkers, boundryCount);
    solarBoundries.push(newBoundry);
  }

  function addObstacle(obstacle, sideMarkers) {
    if (Geomertry.isIntersecting(obstacle, activeSolarBoundry.boundry)) {
      activeSolarBoundry.setObstacle(obstacle, sideMarkers);
    }
  }
  google.maps.event.addListener(
    drawingManagerForBoundry,
    "shapeComplete",
    (info) => {
      info.shape.setMap(null);
      info.textMarkers.forEach((textMarker) => textMarker.setMap(null));
      if (info.shapeType == "polygon") {
        addSolarBoundry(info.shape, info.textMarkers);
      }
      if (info.shapeType == "rectangle") {
        let polygon = Geomertry.convertRectangleToPolygon(info.shape);
        addSolarBoundry(polygon, info.textMarkers);
      }
      drawingManagerForBoundry.setDrawMode(null);
      drawFormBoundry.value = "none";
    }
  );
  google.maps.event.addListener(
    drawingManagerForObstacle,
    "shapeComplete",
    (info) => {
      info.shape.setMap(null);
      info.textMarkers.forEach((textMarker) => textMarker.setMap(null));
      if (info.shapeType == "rectangle") {
        let polygon = Geomertry.convertRectangleToPolygon(info.shape);
        addObstacle(polygon, info.textMarkers);
      } else {
        addObstacle(info.shape, info.textMarkers);
      }
      drawingManagerForObstacle.setDrawMode(null);
      drawFormObstacle.value = "none";
    }
  );
  overlay3d.scene.add(new AxesHelper(1000, 1000, 1000));
}
