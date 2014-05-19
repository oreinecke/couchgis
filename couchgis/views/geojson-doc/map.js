// Associate GeoJSON id with document ids using it.

function(doc) {
  var ids=doc["GeoJSON" in doc?"_id":"GeoJSON_clone"];
  if (!ids) return;
  ids=ids.split(/[\s,;&]+/);
  while (ids.length) emit(ids.shift());
}
