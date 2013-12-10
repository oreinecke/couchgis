// Lists type and then available fields. Fields are a simple
// string "field1/field2/..." because fields have arbitrary
// order and are henceforth useless to group_level.
// Specials, 'type', 'GeoJSON', and 'GeoJSON_clone' are ignored.

function(doc) {
  key = [];
  for (var field in doc)
    if (field.search(/^[A-Z]/)!=-1 && field.search(/^GeoJSON/)==-1)
      key.push(field);
  emit([doc.type, key.join('/')]);
}
