export default class Geomertry {
  static isInsideBoundry(polygon, boundry) {
    let value = true;
    polygon.getPath().forEach((currPoint) => {
      value =
        value && google.maps.geometry.poly.containsLocation(currPoint, boundry);
    });
    return value;
  }
  static isIntersecting(boundry1, boundry2) {
    let value = false;
    boundry1.getPath().forEach((currPoint) => {
      value =
        value ||
        google.maps.geometry.poly.containsLocation(currPoint, boundry2);
    });
    boundry2.getPath().forEach((currPoint) => {
      value =
        value ||
        google.maps.geometry.poly.containsLocation(currPoint, boundry1);
    });
    return value;
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
}
