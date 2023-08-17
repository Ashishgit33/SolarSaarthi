export default class Geomertry {
  static isInsideBoundry(polygon, boundry) {
    let value = true;
    polygon.getPath().forEach((currPoint) => {
      value =
        value && google.maps.geometry.poly.containsLocation(currPoint, boundry);
    });
    return value;
  }
  static isIntersectingCircles(circle1,circle2){
    let center1=circle1.getCenter();
    let center2=circle2.getCenter();
    let radius1=circle1.getRadius(),radius2=center2.getRadius();
    return google.maps.geometry.spherical.computeDistanceBetween(center1,center2)<=radius1+radius2;
  }
  static isIntersectingCirlePolygon(circle,polygon){
    let value=false;
    value=google.maps.geometry.poly.containsLocation(circle.getCenter(), polygon);
    polygon.getPath().forEach((point)=>{
      value=value||google.maps.geometry.spherical.computeDistanceBetween(point,circle.getCenter())<=circle.getRadius();
    });
    return value;
  }
  static isIntersectingPolygons(polygon1,polygon2){
    let value = false;
    polygon1.getPath().forEach((currPoint) => {
      value =
        value ||
        google.maps.geometry.poly.containsLocation(currPoint, polygon2);
    });
    polygon2.getPath().forEach((currPoint) => {
      value =
        value ||
        google.maps.geometry.poly.containsLocation(currPoint, polygon1);
    });
    return value;
  }
  static isIntersecting(boundry1, boundry2) {
    if(boundry1 instanceof google.maps.Circle && boundry2 instanceof google.maps.Circle){
      return Geomertry.isIntersectingCircles(boundry1,boundry2);
    }
    if(boundry1 instanceof google.maps.Circle && boundry2 instanceof google.maps.Polygon){
      return Geomertry.isIntersectingCirlePolygon(boundry1,boundry2);
    }
    if(boundry1 instanceof google.maps.Polygon && boundry2 instanceof google.maps.Circle){
      return Geomertry.isIntersectingCirlePolygon(boundry2,boundry1);
    }
    if(boundry1 instanceof google.maps.Polygon && boundry2 instanceof google.maps.Polygon){
      return Geomertry.isIntersectingPolygons(boundry1,boundry2);
    }
    throw Error('Cannot find intersection between given boundries');
  }
  static getPolyCenter(polygon) {
    let bounds = new google.maps.LatLngBounds();
    polygon.getPath().forEach((currPoint) => {
      bounds.extend(currPoint);
    });
    return bounds.getCenter();
  }
  static getRectangle(latLng, length, breath) {
    let topleft = latLng;
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
    return new google.maps.Polygon({
      path: [topleft, topright, bottomright, bottomleft],
    });
  }
  static getHeading(from, to) {
    let heading = google.maps.geometry.spherical.computeHeading(from, to);
    if (heading < 0) return 360 + heading;
    return heading;
  }
  static getHeadingAtAngle(heading, angle) {
    return (heading+angle)%360
  }
  static getPerpendicularHeading(heading) {
    return Geomertry.getHeadingsAtAngle(heading, 90);
  }
  static getAngleBetweenHeading(heading1, heading2) {
    return Math.min(
      Math.abs(heading1 - heading2),
      360 - Math.abs(heading1 - heading2)
    );
  }
  static getLineAtAngle(point,line,angle){
    let lineHeading=google.maps.geometry.spherical.computeHeading(line[0], line[1]);
    let angleHeading=Geomertry.getHeadingAtAngle(lineHeading,angle)
    return [point,google.maps.geometry.spherical.computeOffset(point,1,angleHeading)];
  }
  static getProjectionOnLine(line1, line2) {
    let lengthLine1 = google.maps.geometry.spherical.computeDistanceBetween(
      line1[0],
      line1[1]
    );
    let headingLine1 = Geomertry.getHeading(line1[0], line1[1]);
    let headingLine2 = Geomertry.getHeading(line2[0], line2[1]);
    let angleDiff = Geomertry.getAngleBetweenHeading(headingLine1, headingLine2);
    let projection = google.maps.geometry.spherical.computeOffset(
      line2[0],
      lengthLine1*Math.cos(angleDiff* Math.PI / 180),
      headingLine2
    );
    return projection;
  }
  static convertRectangleToPolygon(rectangle){
    if(!rectangle instanceof google.maps.Rectangle) return;
    let { north, south, east, west } = rectangle.getBounds().toJSON();
    let topLeft=new google.maps.LatLng(north,west),
    topRight=new google.maps.LatLng(north,east),
    bottomright=new google.maps.LatLng(south,east),
    bottomleft=new google.maps.LatLng(south,west);
    let path=[topLeft,topRight,bottomright,bottomleft]
    return new google.maps.Polygon({
      path,
      strokeWeight:rectangle.strokeWeight,
      strokeColor:rectangle.strokeColor,
    });
  }
}
