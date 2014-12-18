// If the Google Maps API has been loaded successfully, shorthand
// google.maps to Maps. Otherwise revert Maps to 'offline-mode' API.
var Maps = window.google && google.maps || {offline:true};
// Constructors of geojson primitives can be looked up here.
var Primitives={
  Point:      Maps.Marker,
  Polygon:    Maps.Polygon,
  LineString: Maps.Polyline
};

var LatLng = Maps.LatLng;

// add GeoJSON MultiLineString support
Primitives.MultiLineString=function(options) {
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
};

// add GeoJSON MultiPolygon support
Primitives.MultiPolygon=function(options) {
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
};

// Tag two-dimensional primitives.
if (!Maps.offline) {
  Primitives.Polygon.prototype.solid=true;
  Primitives.MultiPolygon.prototype.solid=true;
}

// Replace all 2-element arrays of
// GeoJSON.coordinates with LatLngs.
function expand_options(options) {
  var c=options.coordinates, ci, cij, cijk;
  delete options.coordinates;
  if (typeof(c[0])==="number")
    options.position=new LatLng(c[1],c[0]);
  else if (typeof(c[0][0])==="number") {
    for (var i=0; ci=c[i]; i++) c[i]=new LatLng(ci[1],ci[0]);
    options.path=c;
  } else if (typeof(c[0][0][0])==="number") {
    for (var i=0; ci=c[i]; i++)
    for (var j=0; cij=ci[j]; j++) ci[j]=new LatLng(cij[1],cij[0]);
    options.paths=c;
  } else if (typeof(c[0][0][0][0])==="number") {
    for (var i=0; ci=c[i]; i++)
    for (var j=0; cij=ci[j]; j++)
    for (var k=0; cijk=cij[k]; k++) cij[k]=new LatLng(cijk[1],cijk[0]);
    options.paths=c;
  }
  if (options.fillOpacity==null) options.fillOpacity=0.25;
  if (options.icon==null) options.icon="svg/marker.svg";
  return options;
}

function create_shape(type, options) {
  var Primitive=Primitives[type] || function() {
    alert("OH NO POKEY AN UNKNOWN GEOJSON TYPE!!!");
  };
  return new Primitive(options);
}

// Provide offline Google Maps API look-and-feel.
if (Maps.offline) {
  // Offline Maps API does nothing all the time.
  function nothing(){};
  // The Offline map canvas extends over the
  // entire planet and does nothing else.
  Maps.Map=function() {
    this.setCenter=nothing;
    this.getBounds=function() {
      return {
        getNorthEast:function() {
          return {
            lat:function() {return 90;},
            lng:function() {return 360;}
          };
        },
        getSouthWest:function() {
          return {
            lat:function() {return 0;},
            lng:function() {return 0;}
          };
        }
      };
    };
  };
  // Offline maps supports undefined map types.
  Maps.MapTypeId={};
  // Use nothing() as an empty constructor.
  LatLng = nothing;
  for (var type in Primitives)
    Primitives[type]=nothing;
  // The map page attaches a single handler to 'bounds_changed'.
  // It uses no other event types or maps. This allows me to
  // ignore instance, eventName, and multiple handlers.
  Maps.event={
    handler:nothing,
    addListener:function(instance, eventName, handler) {
      this.handler=handler;
    },
    addListenerOnce:function(instance, eventName, handler) {
      handler();
    },
    trigger:function() { this.handler(); },
    clearListeners:function() { this.handler=nothing; }
  };
  // Offline maps supports invisible shapes.
  create_shape=function() {
    return {
      setOptions:nothing,
      addListener:nothing,
      setMap:nothing
    };
  };
}
