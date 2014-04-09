// Associate GeoJSON id with document ids using it.

function(doc) {
  var id=doc["GeoJSON" in doc?"_id":"GeoJSON_clone"];
  if (id!=null) emit(id);
}
