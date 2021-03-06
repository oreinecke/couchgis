// Emit bounding box and geometry
// errors indexed by document id.

function(doc) {
  var utils=require('views/lib/utils');
  if (!doc.GeoJSON) return;
  var GeoJSON=utils.clone(doc.GeoJSON);
  utils.toWGS84(GeoJSON);
  utils.bbox(GeoJSON);
  var errors=[];
  // Provide list of simplified geometry errors as in _view/geojson.
  for (var error=Infinity;error>0;error=error*0.5) {
    error*=(error>=5e-6);
    var simplified_GeoJSON=utils.stripLastCoord(utils.simplify(utils.clone(GeoJSON),error));
    errors.push(+simplified_GeoJSON.error.toExponential(1));
    error=simplified_GeoJSON.error;
  }
  emit(doc._id, {GeoJSON:{bbox:GeoJSON.bbox, errors:errors}});
}
