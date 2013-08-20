// Lists type and then available fields. Fields are a simple string
// "field1/field2/..." because there is no inherent hierarchy between
// sets of fields of arbitrary order that could be used by group_level.

function(doc) {
  key = [];
  for (field in doc)
    if (["_id", "_rev", "type"].indexOf(field)==-1)
      key.push(field);
  emit([doc.type, key.sort().join('/')]);
}
