// Sample values of fields for auto-completion.

function(doc) {
  var type=doc.type;
  if (type==null) return;
  for (var field in doc) {
    var val=doc[field];
    if (field[0].search(/[A-Z]/)!=0) continue;
    if (field.search(/^GeoJSON/)==0) continue;
    if (typeof(val)!=="string") val=typeof(val);
    emit([type, field, val]);
  }
}
