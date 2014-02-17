//document.write('<script type="text/javascript"'+
//               'src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false">'+
//               '</script>');

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

// It is very likely that the oftentimes inexperienced user clicks and
// scrolls the map like an ape (on adderall). Then, event handler callbacks
// will be fired all over the place and the interface probably won't react
// anymore. It should be smarter than that; It should wait a couple of
// seconds, then wait for the last ajax to complete, then do the next thing
// that needs to be done.
var call={
  now:null, next:null,
  this_one_next:function(what) {
    // We might as well do the closure here, because this
    // is used only for event handler registration anyway.
    return function() {
      if (call.now!==null) call.next=what;
      else (call.now=what)();
    }
  },
  that_last_one:function() {
    window.setTimeout(function() {
      call.now=call.next;
      call.next=null;
      if (call.now!==null) call.now();
    }, 500);
  },
  no_one:function() {
    call.now=null;
    call.next=null;
  }
};

// call _list/bbox-filter/<view> with some useful options
function list(list, options, success) {
  var keys=options.keys;
  delete options.keys;
  list+="?options="+encodeURIComponent(JSON.stringify(options));
  $.ajax("_list/"+list, {
    type:"POST",
    dataType:"json",
    data:JSON.stringify({keys:keys}),
    success:success,
    error:call.that_last_one
  });
}
// ok this also looks retarded but it keeps my stuff in one place at least
list.parts=window.location.pathname.split('/');
list.db=list.parts[1];
list.app=list.parts[3];
delete list.parts;

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
