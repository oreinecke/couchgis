// Sample values of fields for auto-completion.

function(doc) {
  var path=require('views/lib/path');
  if (!doc.type) return;
  for (var field in doc) {
    if (!/^[A-ZÄÖÜ]/.test(field)) continue;
    if (/^GeoJSON/.test(field)) continue;
    (function flat_fields(obj, fields) {
      if (typeof obj!=="object")
        emit([path.encode(fields), doc.type, obj]);
      else if (Array.isArray(obj))
        for (var i=0;i<obj.length;i++)
          flat_fields(obj[i], fields);
      else for (var field in obj)
        flat_fields(obj[field], fields.concat([field]));
    }(doc[field], [field]));
  }
}
