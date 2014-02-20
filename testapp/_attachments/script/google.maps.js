// stash frequently used objects here
var Maps=google.maps;
var LatLng=Maps.LatLng;
var LatLngBounds=Maps.LatLngBounds;

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
    for (var s=0;s<shapes.length;s++)
      shapes[s].addListener(name, handler);
  };
}

// add GeoJSON MultiPolygon support
function MultiPolygon(options) {
  var shapes=[];
  var paths=options.paths;
  delete options.paths;
  for (var p=0;p<paths.length;p++) {
    options.path=paths[p];
    shapes.push(new Maps.Polygon(options));
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
    for (var s=0;s<shapes.length;s++)
      shapes[s].addListener(name, handler);
  };
}

// correct for small shift in Google Maps aerials of unknown reason
var offset=[-0.00178,-0.00121];

// Replace all 2-element arrays inside GeoJSON.coordinates with
// LatLngs; This is written with extra-ugly comma operators and
// multiple vars inside the for loop to increase performance.
function create_options(c) {
  var ofs0=offset[0], ofs1=offset[1];
  if (typeof(c[0])=="number") c=new LatLng(c[1]+ofs1,c[0]+ofs0);
  else if (typeof(c[0][0])=="number")
    for (var i=0, ci; ci=c[i], i<c.length; i++) c[i]=new LatLng(ci[1]+ofs1,ci[0]+ofs0);
  else if (typeof(c[0][0][0])=="number")
    for (var i=0, ci; ci=c[i], i<c.length; i++)
    for (var j=0, cij; cij=ci[j], j<ci.length; j++) ci[j]=new LatLng(cij[1]+ofs1,cij[0]+ofs0);
  else if (typeof(c[0][0][0][0])=="number")
    for (var i=0, ci; ci=c[i], i<c.length; i++)
    for (var j=0, cij; cij=ci[j], j<ci.length; j++)
    for (var k=0, cijk; cijk=cij[k], k<cij.length; k++) cij[k]=new LatLng(cijk[1]+ofs1,cijk[0]+ofs0);
  return {
    position:c, path:c, paths:c,
    fillOpacity: 0.25,
    icon:"svg/marker.svg"
  };
}

function create_shape(type, options) {
  if (type=="Point") return new Maps.Marker(options);
  if (type=="Polygon") return new Maps.Polygon(options);
  if (type=="LineString") return new Maps.Polyline(options);
  if (type=="MultiPolygon") return new MultiPolygon(options);
  if (type=="MultiLineString") return new MultiLineString(options);
  // remind myself that this needs work!!!
  alert("OH NO POKEY AN UNKNOWN GEOJSON TYPE!!!");
}
