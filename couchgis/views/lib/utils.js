// Apply action to every [[x1,y1],..].

exports.eachCoords=function(GeoJSON, action) {
  var fields=["geometries", "features", "geometry"];
  (function apply_action(obj) {
    if (typeof(obj)!=="object") return;
    // ignore sets of unconnected points
    if (obj.type==="Point" || obj.type==="MultiPoint") return;
    if (obj.coordinates) {
      var c=obj.coordinates;
      // LineString
      if (typeof(c[0][0])==="number") action(c, obj.type);
      // Polygon/MultiLineString
      else if (typeof(c[0][0][0])==="number")
        for (var i=0;i<c.length;i++) action(c[i], obj.type);
      // MultiPolygon
      else if (typeof(c[0][0][0][0])==="number")
        for (var i=0;i<c.length;i++)
        for (var j=0;j<c[i].length;j++) action(c[i][j], obj.type);
    } else for (var field in obj) {
      if (fields.indexOf(field)!==-1)
        apply_action(obj[field]);
      if (field.search(/^[0-9]+$/)>=0)
        apply_action(obj[field]);
    }
  })(GeoJSON);
};

// Apply action to every [x,y].

exports.eachPoint=function(GeoJSON, action) {
  var fields=["geometries", "coordinates", "features", "geometry"];
  (function apply_action(obj) {
    if (typeof(obj)!=="object") return;
    if (typeof(obj[0])==="number")
      action(obj);
    else for (var field in obj) {
      if (fields.indexOf(field)!==-1)
        apply_action(obj[field]);
      if (field.search(/^[0-9]+$/)>=0)
        apply_action(obj[field]);
    }
  })(GeoJSON);
};

// Clone GeoJSON and handle arrays properly.

exports.clone=function(GeoJSON) {
  if (GeoJSON==null || typeof(GeoJSON)!=="object")
    return GeoJSON;
  if (Array.isArray(GeoJSON)) {
    var array=[];
    for (var i=0;i<GeoJSON.length;i++)
      array.push(exports.clone(GeoJSON[i]));
    return array;
  }
  var object={};
  for (var prop in GeoJSON)
    object[prop]=exports.clone(GeoJSON[prop]);
  return object;
}

// Calculate bounding box and add it to GeoJSON.

exports.bbox=function(GeoJSON) {
  var bbox=GeoJSON.bbox=[Infinity,Infinity,-Infinity,-Infinity];
  exports.eachPoint(GeoJSON, function(coord) {
    bbox[0]=(bbox[0]<coord[0])?bbox[0]:coord[0];
    bbox[1]=(bbox[1]<coord[1])?bbox[1]:coord[1];
    bbox[2]=(bbox[2]>coord[0])?bbox[2]:coord[0];
    bbox[3]=(bbox[3]>coord[1])?bbox[3]:coord[1];
  });
  return GeoJSON;
};

// Also define some kind of 'importance' here to choose
// what items to draw first. We use the bbox circumfence
// and we'll see how this goes.

exports.size=function(GeoJSON) {
  GeoJSON.size=(GeoJSON.bbox[2]-GeoJSON.bbox[0])+(GeoJSON.bbox[3]-GeoJSON.bbox[1]);
  return GeoJSON;
};

// Export some EPSG definitions.

exports.EPSG={
  3396:"+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=4499998.5 +y_0=65 +ellps=bessel +units=m +no_defs",
  3397:"+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4499998.5 +y_0=65 +ellps=bessel +units=m +no_defs",
  31467:"+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=4499998.5 +y_0=65 +ellps=bessel "
       +"+towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs",
  31468:"+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4499879 +y_0=-139 +ellps=bessel "
       +"+towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs",
  31469:"+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5499873 +y_0=-133 +ellps=bessel "
       +"+towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs"
};

// Transform to WGS84.

exports.toWGS84=function(GeoJSON) {
  try {
    var target="urn:ogc:def:crs:OGC:1.3:CRS84";
    var source=GeoJSON.crs.properties.name;
    if (source===target) return GeoJSON;
    var EPSG=source.match(/EPSG:+([0-9]+)/)[1];
    var projector=require('./proj4')(exports.EPSG[EPSG]);
    exports.eachPoint(GeoJSON, function(coord) {
      var newCoord=projector.inverse(coord);
      coord[0]=newCoord[0];
      coord[1]=newCoord[1];
    });
    // write crs according to GeoJSON spec
    GeoJSON.crs.properties.name=target;
  } catch(e) {
    GeoJSON.crs=e;
  }
  return GeoJSON;
};

// Strip last coord from each Polygon/MultiPolygon.

exports.stripLastCoord=function(GeoJSON) {
  exports.eachCoords(GeoJSON, function(coords, type) {
    if (type==="Polygon" || type==="MultiPolygon") {
      var first=coords[0], last=coords[coords.length-1];
      if (first[0]===last[0] && first[1]===last[1])
        coords.pop();
    }
  });
  return GeoJSON;
}

// Simplify LineStrings and Polygons for a given maximum
// deviation and store the actual error as GeoJSON.error.

exports.simplify=function(GeoJSON, error) {
  GeoJSON.error=0;
  if (error===0) return GeoJSON;
  // some vector algebra
  ;function dot(u,v) { return u[0]*v[0]+u[1]*v[1]; }
  ;function mul(u,m) { return [u[0]*m, u[1]*m]; }
  ;function add(u,v) { return [u[0]+v[0],u[1]+v[1]]; }
  ;function sub(u,v) { return [u[0]-v[0],u[1]-v[1]]; }
  exports.eachCoords(GeoJSON, function(coords) {
    // http://en.wikipedia.org/wiki/Ramer–Douglas–Peucker_algorithm
    ;function bisect_or_remove(i, k) {
      if (i+1==k) return;
      // Return index and distance of furthest point.
      // Return no index if distance is below error.
      var J={error:0};
      var a=coords[i];
      var c=coords[k];
      var d=sub(c,a);
      for (var j=i+1;j<k;j++) {
        var b=coords[j], e;
        var a_b=dot(sub(b,a),d);
        var b_c=dot(sub(c,b),d);
        // check if b falls outside the line segment a-c.
        // an aquidistant line then looks like this:
        //  ____b___
        // /        \ I.e. draw circles with the same
        // | a -- c | radius at a,b and join them with
        // \________/ tangent lines. Ignore arcs within.
        if (a_b<=0) e=sub(b,a);
        else if (b_c<=0) e=sub(c,b);
        // e = b - (a*((b-a)*(c-a))+c*((b-a)*(c-a)))/(d*d);
        // if we had operator overloading in JS (luckily we don't)
        else e=sub(b, mul(add(mul(a,b_c),
                              mul(c,a_b)), 1.0/dot(d,d)) );
        var e2=dot(e,e);
        if (e2>J.error*J.error) {
          J.error=Math.sqrt(e2);
          if (J.error>error) J.index=j;
          // avoid di-angles in a non-elegant fashion
          if (i===0 && k===coords.length-1 && dot(d,d)===0)
            J.index=j;
        }
      }
      if (J.index==null) {
        if (J.error>GeoJSON.error)
          GeoJSON.error=J.error;
        for (var j=i+1;j<k;j++) coords[j]=null;
      } else {
        bisect_or_remove(i, J.index);
        bisect_or_remove(J.index, k);
      }
    }
    if (coords.length<=2) return;
    bisect_or_remove(0, coords.length-1);
    // remove nulls from coords
    for (var j; (j=coords.indexOf(null))!==-1; coords.splice(j,1));
  });
  return GeoJSON;
};
