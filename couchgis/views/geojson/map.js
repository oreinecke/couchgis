// Emit GeoJSON, simplified GeoJSON for
// faster drawing, and associated properties.

function(doc) {
  var utils=require('views/lib/utils');
  if (doc.GeoJSON) {
    // I need a copy that can be modified.
    var GeoJSON=utils.clone(doc.GeoJSON);
    // Keep CRS name of source geometry.
    var crs=GeoJSON.crs;
    utils.toWGS84(GeoJSON);
    utils.bbox(GeoJSON);
    // Provide a neat set of reduced polygons: we allow an infinite error at
    // the beginning, and then set the new error limit to half the accuracy of
    // the last simplification. If error is zero, no reduction was done and the
    // list is complete.
    for (var error=Infinity;error>0;error=error*0.5) {
      // In google maps, we are unable to zoom way below this level;
      // we still need the unabreviated geometry for geojson export.
      error*=(error>=5e-6);
      var simplified_GeoJSON=utils.stripLastCoord(utils.simplify(utils.clone(GeoJSON),error));
      // Store EPSG used to transform coordinates from source geometry.
      if (simplified_GeoJSON.error===0) simplified_GeoJSON.EPSG=utils.EPSG({crs:crs});
      emit([doc._id,+simplified_GeoJSON.error.toExponential(1)], {GeoJSON:simplified_GeoJSON});
      error=simplified_GeoJSON.error;
    }
  }
  if (!doc.type) return;
  var ids=doc[ doc.GeoJSON ? "_id" : "GeoJSON_clone" ];
  if (!ids) return;
  var val={doc:{
    _id:doc._id,
    _rev:doc._rev,
    type:doc.type,
    time:doc.time,
    ranges:require('views/lib/ranges')(doc.time),
    info:doc.info && '_show/edit/'+doc.info,
    GeoJSON_clone:doc.GeoJSON_clone
  }};
  for (var field in doc) {
    // fields with lowecase letters are english and kind of 'internal'
    if (!/^[A-ZÄÖÜ]/.test(field)) continue;
    if (/^GeoJSON/.test(field)) continue;
    val.doc[field]=doc[field];
  }
  ids=ids.replace(/[#%].*($)/gm, '$1');
  ids=ids.match(/[^\s,;&]+/g);
  while (ids.length) emit([ids.shift(),doc._id], val);
}
