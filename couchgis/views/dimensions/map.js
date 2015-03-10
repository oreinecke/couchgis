// Emit bbox and time for unification.

function(doc) {
  var value={ ranges:require('views/lib/ranges')(doc.time) };
  if (doc.GeoJSON) {
    var utils=require('views/lib/utils');
    var GeoJSON=utils.clone(doc.GeoJSON);
    utils.toWGS84(GeoJSON);
    utils.bbox(GeoJSON);
    value.bbox=GeoJSON.bbox;
  }
  emit(null, value);
}
