// Emits size as key and bbox for reduce.

function(doc) {
  var utils=require('views/lib/utils');
  var ranges=require('views/lib/ranges');
  if (doc.GeoJSON==null) {
    emit(null, {ranges:ranges.toRange(doc.time)});
    return;
  }
  var GeoJSON=utils.clone(doc.GeoJSON);
  utils.toWGS84(GeoJSON);
  utils.bbox(GeoJSON);
  utils.size(GeoJSON);
  emit(GeoJSON.size, {bbox:GeoJSON.bbox, ranges:ranges.toRange(doc.time)});
}
