function(doc) {
  var utils=require('views/lib/utils');
  if (!doc.GeoJSON) return;
  var GeoJSON=utils.clone(doc.GeoJSON);
  utils.toWGS84(GeoJSON);
  utils.bbox(GeoJSON);
  emit({type:"", coordinates:"", bbox:GeoJSON.bbox});
}
