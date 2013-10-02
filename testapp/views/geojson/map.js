// Emits GeoJSON w/bbox and associated properties.

function(doc) {
  var utils=require('views/lib/utils');
  var id=doc["GeoJSON" in doc?"_id":"GeoJSON_clone"];
  // abort if no GeoJSON is set at all
  if (id==null) return;
  if (id===doc._id) {
//  I need a copy that can be modified
    var GeoJSON=JSON.parse(JSON.stringify(doc.GeoJSON));
    GeoJSON.bbox=util.bbox(GeoJSON);
    emit(id, {GeoJSON: GeoJSON, size: util.size(GeoJSON.bbox)});
  };
  var properties={_id:doc._id, type:doc.type};
  for (field in doc) {
    // fields with lowecase letters are english and kind of 'internal'
    if (field.search(/^[A-Z]/)==-1) continue;
    if (field.search("GeoJSON")!=-1) continue;
    properties[field]=doc[field];
  }
  emit(id, {doc:properties});
}
