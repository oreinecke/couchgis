// Lists type and available fields. Specials, lower-case
// fields, 'GeoJSON', and 'GeoJSON_clone' are ignored.

function(doc) {
  fields = [];
  for (var field in doc)
    if (field.search(/^[A-Z]/)!=-1 && field.search(/^GeoJSON/)==-1)
      fields.push(field);
  emit(doc.type, fields);
}
