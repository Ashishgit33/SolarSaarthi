import Geomertry from "./Geometry.class.js";
import SolarBoundry from "./SolarBoundry.class.js";


export default function solarBoundryEventsHandler(map,drawingManagerForBoundry,drawingManagerForObstacle){
    let solarBoundries=[]
    let activeSolarBoundry=null;
    let setpanelForm=document.querySelector(".setpanel-form");
    let boundryCount=0;
    let [lengthInput,breathInput,horizontalMarginInput,verticalMarginInput]=setpanelForm.querySelectorAll(".solar-panel-config .input-group>input");
    let drawFormBoundry=document.querySelector("#draw-boundry-form>select");
    let drawFormObstacle=document.querySelector("#draw-obstacle-form>select");
    drawFormBoundry.addEventListener("change",()=>{
      drawingManagerForObstacle.setDrawMode(null)
      drawingManagerForBoundry.setDrawMode(drawFormBoundry.value)
    })
    drawFormObstacle.addEventListener("change",()=>{
      console.log(drawFormObstacle.value)
      if(!activeSolarBoundry) return;
      drawingManagerForBoundry.setDrawMode(null);
      drawingManagerForObstacle.setDrawMode(drawFormObstacle.value);
    })
    document.addEventListener('toggle-active',(event)=>{
      if(activeSolarBoundry){
        activeSolarBoundry.toggleFocus();
      }
      activeSolarBoundry=event.detail;
      activeSolarBoundry.toggleFocus();
      lengthInput.value=activeSolarBoundry.solarPanelConfig.length;
      breathInput.value=activeSolarBoundry.solarPanelConfig.breath;
      horizontalMarginInput.value=activeSolarBoundry.solarPanelConfig.verticalMargin;
      verticalMarginInput.value=activeSolarBoundry.solarPanelConfig.horizontalMargin;
      setpanelForm.querySelector("#boundry-id").textContent=`#${activeSolarBoundry.id}`;
      setpanelForm.style.display="flex";
    })
    setpanelForm.querySelector('.delete-btn').addEventListener('click',()=>{
      if(!activeSolarBoundry) return;
      activeSolarBoundry.destruct()
      solarBoundries=solarBoundries.filter((boundry)=>boundry!==activeSolarBoundry)
      activeSolarBoundry=null;
      setpanelForm.style.display="none";
    })
    setpanelForm.querySelector(".close-form").addEventListener("click",()=>{
      if(activeSolarBoundry){
        activeSolarBoundry.toggleFocus();
        activeSolarBoundry=null;
      }
      setpanelForm.style.display="none";
    })
    setpanelForm.querySelector(".setpanel-btn").addEventListener('click',()=>{
      activeSolarBoundry.setSolarPanelConfig({
        length:lengthInput.value,
        breath:breathInput.value,
        verticalMargin:horizontalMarginInput.value,
        horizontalMargin:verticalMarginInput.value,
      })
      activeSolarBoundry.fillSolarPanels();
    })
    setpanelForm.querySelector(".clearpanel-btn").addEventListener("click",()=>{
      if(activeSolarBoundry)
        activeSolarBoundry.clearPanels();
    })
    setpanelForm.querySelector("#show-distance").addEventListener("click",(event)=>{
      if(!activeSolarBoundry) return;
      activeSolarBoundry.toggleDistance();
    })
    function addSolarBoundry(polygon,sideMarkers){
      let isIntersecting=solarBoundries.reduce((acc,solarBoundry)=>{
        acc=acc||Geomertry.isIntersecting(polygon,solarBoundry.boundry);
        return acc; 
      },false);                           
      if(isIntersecting)
        return
      boundryCount+=1;
      let newBoundry=new SolarBoundry(map,polygon,sideMarkers,boundryCount);
      solarBoundries.push(newBoundry);
    }
    function addObstacle(obstacle,sideMarkers){
      if(Geomertry.isIntersecting(obstacle,activeSolarBoundry.boundry)){
        activeSolarBoundry.setObstacle(obstacle,sideMarkers);
      }
    }
    google.maps.event.addListener(drawingManagerForBoundry,"shapeComplete",(info)=>{
      info.shape.setMap(null);
      info.textMarkers.forEach((textMarker)=>textMarker.setMap(null));
      if(info.shapeType=="polygon"){
        addSolarBoundry(info.shape,info.textMarkers)
      }
      if(info.shapeType=="rectangle"){
        let polygon=Geomertry.convertRectangleToPolygon(info.shape);
        addSolarBoundry(polygon,info.textMarkers);
      }
      drawingManagerForBoundry.setDrawMode(null);
      drawFormBoundry.value='none';
    })
    google.maps.event.addListener(drawingManagerForObstacle,"shapeComplete",(info)=>{
      info.shape.setMap(null);
      info.textMarkers.forEach((textMarker)=>textMarker.setMap(null));
      if(info.shapeType=="rectangle"){
        let polygon=Geomertry.convertRectangleToPolygon(info.shape);
        addObstacle(polygon,info.textMarkers);
      }else{
        addObstacle(info.shape,info.textMarkers);
      }
      drawingManagerForObstacle.setDrawMode(null);
      drawFormObstacle.value='none';
    })
  }