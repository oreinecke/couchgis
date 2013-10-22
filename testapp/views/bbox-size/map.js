// Emits bbox, size and associated document ids.

function(doc) {
  var utils=require('views/lib/utils');
  var id=doc["GeoJSON" in doc?"_id":"GeoJSON_clone"];
  if (id==null) return;
  if (id===doc._id) {
    var GeoJSON=utils.clone(doc.GeoJSON);
    utils.toWGS84(GeoJSON);
    utils.bbox(GeoJSON);
    utils.size(GeoJSON);
    emit(id, {GeoJSON:{bbox:GeoJSON.bbox, size:GeoJSON.size}});
  };
  emit(id, {doc:{_id:doc._id, type:doc.type}});
}
