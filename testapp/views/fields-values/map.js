// Sample values of fields for auto-completion.

function(doc) {
  if (doc.type==null) return;
  for (var field in doc) {
    if (!/^[A-ZÄÖÜ]/.test(field)) continue;
    if (/^GeoJSON/.test(field)) continue;
    (function flat_fields(obj, fields) {
      if (obj && typeof obj==="object") {
        for (var field in obj) {
          var obj2=obj[field];
          if (/\./.test(field)) field="'"+field+"'";
          flat_fields(obj2, fields.concat([field]));
        }
        return;
      }
      var summary={count:1,type:typeof obj};
      if (typeof obj==="number") {
        summary.min=obj;
        summary.max=obj;
        obj=null;
      }
      emit([doc.type, fields.join('.'), obj], summary);
    })(doc[field], [field]);
  }
}
