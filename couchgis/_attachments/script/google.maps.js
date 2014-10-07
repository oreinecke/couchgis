// stash frequently used objects here
var Maps=google.maps;
var LatLng=Maps.LatLng;
var LatLngBounds=Maps.LatLngBounds;
var Point=Maps.Marker;
var Polygon=Maps.Polygon;
var LineString=Maps.Polyline;

// add GeoJSON MultiLineString support
function MultiLineString(options) {
  var shapes=[];
  var paths=options.paths;
  delete options.paths;
  for (var p=0;p<paths.length;p++) {
    options.path=paths[p];
    shapes.push(new Maps.Polyline(options));
  }
  this.setOptions=function(options) {
    paths=options.paths;
    delete options.paths;
    for (var s=0;s<shapes.length;s++) {
      if (paths) options.path=paths[s];
      shapes[s].setOptions(options);
    }
  };
  this.setMap=function(map) {
    for (var s=0;s<shapes.length;s++)
      shapes[s].setMap(map);
  };
  this.addListener=function(name, handler) {
    var shape=this;
    for (var s=0;s<shapes.length;s++)
      shapes[s].addListener(name, function() { handler.apply(shape); });
  };
}

// add GeoJSON MultiPolygon support
function MultiPolygon(options) {
  var shapes=[];
  var paths=options.paths;
  for (var p=0;p<paths.length;p++) {
    options.paths=paths[p];
    shapes.push(new Maps.Polygon(options));
  }
  this.setOptions=function(options) {
    paths=options.paths;
    for (var s=0;s<shapes.length;s++) {
      if (paths) options.paths=paths[s];
      shapes[s].setOptions(options);
    }
  };
  this.setMap=function(map) {
    for (var s=0;s<shapes.length;s++)
      shapes[s].setMap(map);
  };
  this.addListener=function(name, handler) {
    var shape=this;
    for (var s=0;s<shapes.length;s++)
      shapes[s].addListener(name, function() { handler.apply(shape); });
  };
}

// Replace all 2-element arrays inside GeoJSON.coordinates with
// LatLngs; This is written with extra-ugly comma operators and
// multiple vars inside the for loop to increase performance.
function expand_options(options) {
  var c=options.coordinates;
  delete options.coordinates;
  if (typeof(c[0])==="number")
    options.position=new LatLng(c[1],c[0]);
  else if (typeof(c[0][0])==="number") {
    for (var i=0, ci; ci=c[i], i<c.length; i++) c[i]=new LatLng(ci[1],ci[0]);
    options.path=c;
  } else if (typeof(c[0][0][0])==="number") {
    for (var i=0, ci; ci=c[i], i<c.length; i++)
    for (var j=0, cij; cij=ci[j], j<ci.length; j++) ci[j]=new LatLng(cij[1],cij[0]);
    options.paths=c;
  } else if (typeof(c[0][0][0][0])==="number") {
    for (var i=0, ci; ci=c[i], i<c.length; i++)
    for (var j=0, cij; cij=ci[j], j<ci.length; j++)
    for (var k=0, cijk; cijk=cij[k], k<cij.length; k++) cij[k]=new LatLng(cijk[1],cijk[0]);
    options.paths=c;
  }
  if (options.fillOpacity==null) options.fillOpacity=0.25;
  if (options.icon==null) options.icon="svg/marker.svg";
  return options;
}

function create_shape(type, options) {
  if (type==="Point") return new Point(options);
  if (type==="Polygon") return new Polygon(options);
  if (type==="LineString") return new LineString(options);
  if (type==="MultiPolygon") return new MultiPolygon(options);
  if (type==="MultiLineString") return new MultiLineString(options);
  // remind myself that this needs work!!!
  alert("OH NO POKEY AN UNKNOWN GEOJSON TYPE!!!");
}
