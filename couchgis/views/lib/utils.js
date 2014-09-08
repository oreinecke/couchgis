// Apply action to every [[x1,y1],..].

exports.eachCoords=function(GeoJSON, action) {
  function apply_action(geometry) {
    var t=geometry.type;
    // ignore sets of unconnected points
    if (t==="Point" || t==="MultiPoint") return;
    var c=geometry.coordinates;
    // LineString
    if (typeof(c[0][0])==="number") action(c, t);
    // Polygon/MultiLineString
    else if (typeof(c[0][0][0])==="number")
      for (var i=c.length-1; i!==-1; i--) action(c[i], t);
    // MultiPolygon
    else if (typeof(c[0][0][0][0])==="number")
      for (var i=c.length-1, ci; ci=c[i], i!==-1; i--)
      for (var j=ci.length-1; j!==-1; j--) action(ci[j], t);
  }
  if (GeoJSON.type==="GeometryCollection")
    for (var g=0;g<GeoJSON.geometries.length;g++)
      apply_action(GeoJSON.geometries[g]);
  else if (GeoJSON.type==="FeatureCollection")
    for (var f=0;f<GeoJSON.features.length;f++)
      apply_action(GeoJSON.features[f].geometry);
  else apply_action(GeoJSON.geometry || GeoJSON);
  return GeoJSON;
};

// Apply action to every [x,y].

exports.eachPoint=function(GeoJSON, action) {
  function apply_action(geometry) {
    var c=geometry.coordinates;
    var t=geometry.type;
    // Point
    if (typeof(c[0])==="number") action(c);
    // MultiPoint/LineString
    else if (typeof(c[0][0])==="number")
      for (var i=c.length-1; i!==-1; i--) action(c[i], t);
    // Polygon/MultiLineString
    else if (typeof(c[0][0][0])==="number")
      for (var i=c.length-1, ci; ci=c[i], i!==-1; i--)
      for (var j=ci.length-1; j!==-1; j--) action(ci[j], t);
    // MultiPolygon
    else if (typeof(c[0][0][0][0])==="number")
      for (var i=c.length-1, ci; ci=c[i], i!==-1; i--)
      for (var j=ci.length-1, cij; cij=ci[j], j!==-1; j--)
      for (var k=cij.length-1; k!==-1; k--) action(cij[k], t);
  }
  if (GeoJSON.type==="GeometryCollection")
    for (var g=0;g<GeoJSON.geometries.length;g++)
      apply_action(GeoJSON.geometries[g]);
  else if (GeoJSON.type==="FeatureCollection")
    for (var f=0;f<GeoJSON.features.length;f++)
      apply_action(GeoJSON.features[f].geometry);
  else apply_action(GeoJSON.geometry || GeoJSON);
  return GeoJSON;
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
};

// Calculate bounding box and add it to GeoJSON.

exports.bbox=function(GeoJSON) {
  var bbox=GeoJSON.bbox=[Infinity,Infinity,-Infinity,-Infinity];
  return exports.eachPoint(GeoJSON, function(coord) {
    bbox[0]=(bbox[0]<coord[0]?bbox:coord)[0];
    bbox[1]=(bbox[1]<coord[1]?bbox:coord)[1];
    bbox[2]=(bbox[2]>coord[0])?bbox[2]:coord[0];
    bbox[3]=(bbox[3]>coord[1])?bbox[3]:coord[1];
  });
};

// Also define some kind of 'importance' here to choose
// what items to draw first. We use the bbox circumfence
// and we'll see how this goes.

exports.size=function(GeoJSON) {
  GeoJSON.size=(GeoJSON.bbox[2]-GeoJSON.bbox[0])+(GeoJSON.bbox[3]-GeoJSON.bbox[1]);
  return GeoJSON;
};

// Export projection definitions for some EPSG numbers.

exports.projection={
  4326: "+proj=longlat +datum=WGS84 +ellps=WGS84 +nodefs",
  3396: "+proj=tmerc +lat_0=0 +lon_0=9  +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +units=m +no_defs"
       +"+towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7",
  3397: "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +units=m +no_defs"
       +"+towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7",
  31469:"+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel +units=m +no_defs"
       +"+towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7"
};
exports.projection[31468] = exports.projection[3397];
exports.projection[31467] = exports.projection[3396];
exports.projection[31494] = exports.projection[3397];
exports.projection[31495] = exports.projection[31469];

// Acquire EPSG numbers from GeoJSON.crs.

exports.EPSG=function(GeoJSON) {
  if (!GeoJSON.crs) return 4326;
  var name=GeoJSON.crs.properties.name;
  if (name==="urn:ogc:def:crs:OGC:1.3:CRS84") return 4326;
  return +GeoJSON.crs.properties.name.match(/EPSG:+(\d+)/)[1];
};

// Transform coordinates with proj4js, and correct a
// small discrepancy between aerials of Google Maps
// and Geographischer Informationsdienst Sachsen.

exports.proj4=function(projection) {
  var offset=[13.2e-5, 7.5e-5];
  var proj4=require('./proj4').apply(this, arguments);
  if (!proj4.forward || !proj4.inverse)
    return proj4;
  function forward(c) {
    return proj4.forward([c[0]-offset[0], c[1]-offset[1]]);
  }
  function inverse(c) {
    c=proj4.inverse(c);
    return [c[0]+offset[0], c[1]+offset[1]];
  }
  return { forward:forward, inverse:inverse };
};

// Transform to WGS84.

exports.toWGS84=function(GeoJSON) {
  try {
    var proj4=exports.proj4(exports.projection[exports.EPSG(GeoJSON)]);
    exports.eachPoint(GeoJSON, function(coord) {
      var newCoord=proj4.inverse(coord);
      coord[0]=newCoord[0];
      coord[1]=newCoord[1];
    });
    // CRS defaults to WGS84 if none acquired.
    delete GeoJSON.crs;
  } catch(err) {
    GeoJSON.crs={
      type:"error", properties: {error:err}
    };
  }
  return GeoJSON;
};

// Re-Append first coord from each Polygon/MultiPolygon.

exports.unstripLastCoord=function(GeoJSON) {
  return exports.eachCoords(GeoJSON, function(coords, type) {
    if (type!=="Polygon" && type!=="MultiPolygon")
      return;
    var first=coords[0], last=coords[coords.length-1];
    if (first[0]!==last[0] || first[1]!==last[1])
      coords.push(first);
  });
};

// Strip last coord from each Polygon/MultiPolygon.

exports.stripLastCoord=function(GeoJSON) {
  return exports.eachCoords(GeoJSON, function(coords, type) {
    if (type!=="Polygon" && type!=="MultiPolygon")
      return;
    var first=coords[0], last=coords[coords.length-1];
    if (first[0]===last[0] && first[1]===last[1])
      coords.pop();
  });
};

// Simplify LineStrings and Polygons for a given maximum
// deviation and store the actual error as GeoJSON.error.

exports.simplify=function(GeoJSON, error) {
  GeoJSON.error=0;
  if (error===0) return GeoJSON;
  exports.unstripLastCoord(GeoJSON);
  var planar=function(coord) {return coord;};
  if (exports.EPSG(GeoJSON)===4326) {
    // For WGS84, I factor in the overall longitude
    // of the geometry when calculating distances.
    var aspect=Math.cos(Math.PI*(GeoJSON.bbox[1]+GeoJSON.bbox[3])/360);
    planar=function(coord) {
      return [aspect*coord[0], coord[1]];
    };
  }
  // some vector algebra
  function dot(u,v) { return u[0]*v[0]+u[1]*v[1]; }
  function mul(u,m) { return [u[0]*m, u[1]*m]; }
  function add(u,v) { return [u[0]+v[0],u[1]+v[1]]; }
  function sub(u,v) { return [u[0]-v[0],u[1]-v[1]]; }
  return exports.eachCoords(GeoJSON, function(coords) {
    var first=coords[0], last=coords[coords.length-1];
    // Remember number of nested function calls for linear rings.
    var depth = first[0]===last[0] && first[1]===last[1] ? 1 : Infinity;
    // http://en.wikipedia.org/wiki/Ramer–Douglas–Peucker_algorithm
    function bisect_or_remove(i, k) {
      if (i+1==k) return;
      // Return index and distance of furthest point.
      // Return no index if distance is below error.
      var J={error:0};
      var a=planar(coords[i]);
      var c=planar(coords[k]);
      var d=sub(c,a);
      for (var j=i+1;j<k;j++) {
        var b=planar(coords[j]), e;
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
          if (J.error>error || depth<=2 ) J.index=j;
        }
      }
      if (J.index==null) {
        if (J.error>GeoJSON.error)
          GeoJSON.error=J.error;
        for (var j=i+1;j<k;j++) coords[j]=null;
      } else {
        depth++;
        bisect_or_remove(i, J.index);
        bisect_or_remove(J.index, k);
        depth--;
      }
    }
    if (coords.length<=2) return;
    bisect_or_remove(0, coords.length-1);
    // remove nulls from coords
    for (var j; (j=coords.indexOf(null))!==-1; coords.splice(j,1));
  });
};

// Returns boolish true if point is inside GeoJSON. A point with known
// inside-ness is also accepted as third and forth argument. These will
// then be used to bypass remote line segments.

exports.pointInPolygon=function(GeoJSON, point, known_point, inside) {
  var on_boundary={message:"Point on polygon boundary."};
  var abs=Math.abs;
  var p_u=point[0], p_v=point[1];
  try {
    if (known_point) {
      var q_u=known_point[0], q_v=known_point[1];
      var bbox_0=(p_u<q_u?p_u:q_u)-5e-7;
      var bbox_1=(p_v<q_v?p_v:q_v)-5e-7;
      var bbox_2=(p_u>q_u?p_u:q_u)+5e-7;
      var bbox_3=(p_v>q_v?p_v:q_v)+5e-7;
      var qp_u=q_u-p_u;
      var qp_v=q_v-p_v;
      exports.eachCoords(GeoJSON, function(coords, type) {
        if (type!=="Polygon" && type!=="MultiPolygon")
          return;
        var a=coords[0], b=coords[1];
        for (var c=1; c<coords.length; a=b, b=coords[++c]) {
          var a_u=a[0], a_v=a[1];
          var b_u=b[0], b_v=b[1];
          // Bypass line segments outside pq's bounding box.
          if (a_u<bbox_0 && b_u<bbox_0 || a_u>bbox_2 && b_u>bbox_2 ||
              a_v<bbox_1 && b_v<bbox_1 || a_v>bbox_3 && b_v>bbox_3) continue;
          var pa_u=p_u-a_u, pa_v=p_v-a_v;
          // On boundary if p is close to a.
          if (abs(pa_u)<5e-7 && abs(pa_v)<5e-7) throw on_boundary;
          var ba_u=b_u-a_u, ba_v=b_v-a_v;
          var A=ba_u*pa_v-ba_v*pa_u;
          // Throw on_boundary if p is close to a-b.
          if (abs(A)<(abs(ba_u)+abs(ba_v))*5e-7) throw on_boundary;
          var qb_u=q_u-b_u, qb_v=q_v-b_v;
          // No intersection if p and q are on the same side of a-b.
          if ( (ba_u*qb_v>=ba_v*qb_u) === (A>=0) ) continue;
          // No intersection if a and b are on the same side of p-q.
          if ( (pa_u*qp_v>=pa_v*qp_u) === (qb_u*qp_v>=qb_v*qp_u) ) continue;
          inside^=1;
        }
      });
    } else exports.eachCoords(GeoJSON, function(coords, type) {
      if (type!=="Polygon" && type!=="MultiPolygon")
        return;
      var a=coords[0], b=coords[1];
      for (var c=1; c<coords.length; a=b, b=coords[++c]) {
        // notation: ^ v
        //     x a   |
        //      \     -> u
        //  p x--c------ +Infinity
        //        \
        //       b x
        var pa_u=p_u-a[0], pa_v=p_v-a[1];
        if (abs(pa_u)<5e-7 && abs(pa_v)<5e-7) throw on_boundary;
        var bp_u=b[0]-p_u, bp_v=b[1]-p_v;
        // a and b are either both below or above p
        if (pa_v>0 ^ bp_v>0) continue;
        // a and b are both to the left of p
        if (pa_u>0 && bp_u<0) continue;
        // a and be are both to the right of p
        if (pa_u<0 && bp_u>0) inside^=1;
        else {
          var A=bp_u*pa_v-bp_v*pa_u;
          var ba_u=b[0]-a[0], ba_v=b[1]-a[1];
          // Throw on_boundary if p is close to a-b.
          if (abs(A)<(abs(ba_u)+abs(ba_v))*5e-7) throw on_boundary;
          // Check if (c-p)u >= 0 if everything else fails.
          inside ^= ba_v<0 ^ A>0;
        }
      }
    });
  } catch(err) {
    if (err===on_boundary) return 0.5;
    throw(err);
  }
  return inside;
};
