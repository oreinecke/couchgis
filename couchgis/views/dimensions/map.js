// Emit size as key and bbox for reduce.

function(doc) {
  var utils=require('views/lib/utils');
  var ranges=require('views/lib/ranges')(doc.time);
  if (doc.GeoJSON==null) {
    emit(null, {ranges:ranges});
    return;
  }
  var GeoJSON=utils.clone(doc.GeoJSON);
  utils.toWGS84(GeoJSON);
  utils.bbox(GeoJSON);
  utils.size(GeoJSON);
  emit(GeoJSON.size, {bbox:GeoJSON.bbox, ranges:ranges});
}
