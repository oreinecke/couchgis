// Emit size as key and tag hidden documents.

function(doc) {
  var utils=require('views/lib/utils');
  var ranges=require('views/lib/ranges')(doc.time);
  if (!doc.GeoJSON) return;
  var GeoJSON=utils.clone(doc.GeoJSON);
  utils.toWGS84(GeoJSON);
  utils.bbox(GeoJSON);
  utils.size(GeoJSON);
  emit(GeoJSON.size, {deleted: !doc.type || undefined});
}
