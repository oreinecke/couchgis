// Sample values of fields for auto-completion.

function(doc) {
  var path=require('views/lib/path');
  if (!doc.type) return;
  for (var field in doc) {
    if (!/^[A-ZÄÖÜ]/.test(field)) continue;
    if (/^GeoJSON/.test(field)) continue;
    (function flat_fields(obj, fields) {
      if (!obj || typeof obj!=="object")
        emit([path.encode(fields), doc.type, obj]);
      else for (var field in obj)
        flat_fields(obj[field], fields.concat([field]));
    }(doc[field], [field]));
  }
}
