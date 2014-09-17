// Associate GeoJSON id with document ids using it.

function(doc) {
  if (!doc.type) return;
  var ids=doc["GeoJSON" in doc?"_id":"GeoJSON_clone"];
  if (!ids) return;
  ids=ids.match(/[^\s,;&]+/g);
  while (ids.length) emit(ids.shift());
}
