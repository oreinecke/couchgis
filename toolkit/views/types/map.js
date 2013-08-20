// Lists type and then available fields. Fields are a simple
// string "field1/field2/..." because fields have arbitrary
// order and are therefore useless to group_level.

function(doc) {
  key = [];
  for (field in doc)
    if (["_id", "_rev", "type"].indexOf(field)==-1)
      key.push(field);
  emit([doc.type, key.sort().join('/')]);
}
