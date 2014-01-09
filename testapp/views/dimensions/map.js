// Emits size as key and bbox for reduce.

function(doc) {
  var utils=require('views/lib/utils');
  var range=require('views/lib/range');
  if (doc.GeoJSON==null) return;
  var GeoJSON=utils.clone(doc.GeoJSON);
  utils.toWGS84(GeoJSON);
  utils.bbox(GeoJSON);
  utils.size(GeoJSON);
  emit(GeoJSON.size, {bbox:GeoJSON.bbox, range:range.toRange(doc.time)});
}
