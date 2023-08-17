import Geomertry from "./Geometry.class.js";
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


const BUILDING_HEIGHT = 15;
const obstacleHeight = 5;

function getExtrudePolygonMesh(boundry, overlay,color,height) {
  const material = new MeshBasicMaterial({
    opacity: 1,
    color,
  });
  let points = [];
  let path = boundry.getPath();
  path.forEach((latLng) => {
    points.push(
      overlay.latLngAltitudeToVector3({
        lat: latLng.lat(),
        lng: latLng.lng(),
      })
    );
  });
  const shape = new Shape();
  points.forEach((p, i) => {
    i === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y);
  });

  const geometry = new ExtrudeGeometry(shape, { depth:height });
  const mesh = new Mesh(geometry, material);
  return mesh;
}

function getExtrudeCircleMesh(cirle, overlay, color,height) {
  const material = new MeshBasicMaterial({
    opacity: 1,
    color,
  });
  let geometry = new CylinderGeometry(
    cirle.getRadius(),
    cirle.getRadius(),
    height,
    32
  );
  let mesh = new Mesh(geometry, material);
  overlay.latLngAltitudeToVector3(
    {
      lat: cirle.getCenter().lat(),
      lng: cirle.getCenter().lng(),
    },
    mesh.position
  );
  
  return mesh;
}

function getPlaneMesh(boundry,overlay,color){
  const material = new MeshBasicMaterial({
    opacity: 1,
    color,
  });
  let points = [];
  let path = boundry.getPath();
  path.forEach((latLng) => {
    points.push(
      overlay.latLngAltitudeToVector3({
        lat: latLng.lat(),
        lng: latLng.lng(),
      })
    );
  });
  let length=points[0].distanceTo(points[1]);
  let breath=points[1].distanceTo(points[2]);
  const geometry = new PlaneGeometry(length,breath);
  const mesh = new Mesh(geometry, material);
  return mesh;
}

export default class SolarBoundry {
  #boundry;
  constructor(map, polygon, distancePopups, id) {
    this.map = map;
    this.#boundry = polygon;
    this.distancePopups = distancePopups;
    this.#boundry.addListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("toggle-active", {
          detail: this,
        })
      );
    });
    this.id = id;
    this.isActive = false;
    this.solarPanels = [];
    this.solarPanelConfig = {
      length: null,
      breath: null,
      horizontalMargin: null,
      verticalMargin: null,
      power: null,
    };
    this.obstacles = [];
    this.objects3d=[];
    document.dispatchEvent(
      new CustomEvent("toggle-active", {
        detail: this,
      })
    );
    this.init3dScene
    this.view2d(true);
  }

  init3dScene(overlay) {
    
    const scene = overlay.scene;
    let buildlingMesh=getExtrudePolygonMesh(this.boundry, overlay,0xc0c0c0,BUILDING_HEIGHT);
    scene.add(buildlingMesh);
    
    this.obstacles.forEach(({ obstacle }) => {
      let obstacleMesh;
      if (obstacle instanceof google.maps.Polygon)
        obstacleMesh=getExtrudePolygonMesh(obstacle, overlay,0x808080,obstacleHeight);
      if (obstacle instanceof google.maps.Circle){
        obstacleMesh=getExtrudeCircleMesh(obstacle, overlay,0x808080,obstacleHeight);
        obstacleMesh.rotation.x=Math.PI/2;
        obstacleMesh.position.z+=obstacleHeight/2;
      }
      obstacleMesh.position.z+=BUILDING_HEIGHT;
      scene.add(obstacleMesh);
    });
    this.solarPanels.forEach(panel=>{
      let panelMesh=getPlaneMesh(panel,overlay,0x000080);
      panelMesh.rotation.x+=Math.PI/6;
      let pos=Geomertry.getPolyCenter(panel);
      console.log(pos);
      let altitude=BUILDING_HEIGHT+(this.solarPanelConfig.length*0.5*Math.cos(Math.PI/6));
      overlay.latLngAltitudeToVector3({lat:pos.lat(),lng:pos.lng(),altitude},panelMesh.position);
      scene.add(panelMesh);
    })
    
  }
  // view3d(overlay){
  //   this.objects3d.forEach((object)=>{
  //     overlay.scene.add(ov)
  //   })
  // }
  view2d(boolVal) {
    let map=boolVal?this.map:null;
    this.#boundry.setMap(map);
    this.distancePopups.forEach((popup) => popup.setMap(map));
    this.solarPanels.forEach((panel)=>panel.setMap(map));
    this.obstacles.forEach(({obstacle,sideMarkers})=>{
      obstacle.setMap(map);
      sideMarkers.forEach((sideMarker)=>sideMarker.setMap(map));
    });
  }
  
  set boundry(polygon) {
    if (!(polygon instanceof google.maps.Polygon)) {
      this.#boundry = null;
      return;
    }
    this.#boundry = polygon;
  }
  get boundry() {
    return new google.maps.Polygon({
      path: this.#boundry.getPath(),
    });
  }
  setObstacle(obstacle, sideMarkers) {
    this.obstacles.push({
      obstacle,
      sideMarkers,
    });
    obstacle.setOptions({
      fillColor: "#ff0000",
      fillOpacity: 0.2,
      zIndex: 1,
    });
    obstacle.setMap(this.map);
    sideMarkers.forEach((sideMarker) => sideMarker.setMap(this.map));
    this.solarPanels = this.solarPanels.filter((panel) => {
      if (Geomertry.isIntersecting(panel, obstacle)) {
        panel.setMap(null);
        return false;
      }
      return true;
    });
  }
  clearObstacles() {
    this.obstacles.forEach(({ obstacle, sideMarkers }) => {
      obstacle.setMap(null);
      sideMarkers.forEach((sideMarker) => sideMarker.setMap(null));
    });
  }
  setSolarPanelConfig(config) {
    this.solarPanelConfig.length = parseFloat(config.length);
    this.solarPanelConfig.breath = parseFloat(config.breath);
    this.solarPanelConfig.verticalMargin = parseFloat(config.horizontalMargin);
    this.solarPanelConfig.horizontalMargin = parseFloat(config.verticalMargin);
  }
  toggleFocus() {
    this.isActive = !this.isActive;
    this.#boundry.setOptions({
      strokeColor: this.isActive ? "#00ffff" : "#313131",
      fillColor: this.isActive ? "#00ffff" : "#313131",
      fillOpacity: this.isActive ? 0.2 : 0.5,
    });
    this.#boundry.setOptions({
      clickable: !this.isActive,
    });
    this.solarPanels.forEach((solarPanel) =>
      solarPanel.setOptions({ clickable: this.isActive })
    );
  }
  toggleDistance() {
    this.distancePopups.forEach((popup) => {
      if (popup.getMap()) popup.setMap(null);
      else popup.setMap(this.map);
    });
  }
  setSolarPanel(latLng) {
    let { length, breath } = this.solarPanelConfig;
    const solarPanel = Geomertry.getRectangle(latLng, length, breath);
    solarPanel.setOptions({
      strokeColor: "#000080",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#000080",
      fillOpacity: 0.75,
      clickable: false,
      draggable: true,
      zIndex: 1,
    });
    solarPanel.setMap(this.map);
    this.solarPanels.push(solarPanel);
    // solarPanel.addListener("dblclick", () => {
    //   solarPanel.setMap(null);
    //   this.solarPanels = this.solarPanels.filter((item) => item !== solarPanel);
    // });
    // let dragStartPos = null;
    // solarPanel.addListener("dragstart", (event) => {
    //   dragStartPos = solarPanel.getPath().getAt(0);
    // });
    // solarPanel.addListener("dragend", (event) => {
    //   if (Geomertry.isInsideBoundry(solarPanel, this.boundry)) return;
    //   solarPanel.setMap(null);
    //   this.solarPanels = this.solarPanels.filter((item) => item !== solarPanel);
    //   this.setSolarPanel(dragStartPos);
    // });
  }
  clearPanels() {
    this.solarPanels.forEach((panel) => {
      panel.setMap(null);
    });
    this.solarPanels = [];
  }
  fillSolarPanels() {
    this.clearPanels();
    console.time("fill panels");
    let points = this.boundry.getPath();
    let bounds = new google.maps.LatLngBounds();
    let { length, breath, horizontalMargin, verticalMargin } =
      this.solarPanelConfig;
    points.forEach(function (coord) {
      bounds.extend(coord);
    });
    let isIntersectingWithObstacles = (panel) => {
      let value = false;
      this.obstacles.forEach(({ obstacle }) => {
        value = value || Geomertry.isIntersecting(obstacle, panel);
      });
      return value;
    };
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
        let totalSpaceNeed = Geomertry.getRectangle(colLatlng, length, breath);

        if (
          Geomertry.isInsideBoundry(totalSpaceNeed, this.boundry) &&
          !isIntersectingWithObstacles(totalSpaceNeed)
        ) {
          this.setSolarPanel(colLatlng);
        }
      }
    }
    console.log(this.solarPanels);
    console.timeEnd("fill panels");
  }
  destruct() {
    this.clearPanels();
    this.clearObstacles();
    this.distancePopups.forEach((popup) => {
      popup.setMap(null);
    });
    
    this.distancePopups = null;
    console.log(this.#boundry.getPath());
    this.#boundry.setMap(null);
  }
}
