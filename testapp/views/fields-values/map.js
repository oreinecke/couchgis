// Sample values of fields for auto-completion.

function(doc) {
  if (doc.type==null) return;
  for (var field in doc) {
    var val=doc[field];
    if (field[0].search(/[A-Z]/)!=0) continue;
    if (field.search(/^GeoJSON/)==0) continue;
    // store detailed field info in summary
    var summary={count:1,type:typeof(val)};
    if (typeof(val)==="number") {
      summary.min=val;
      summary.max=val;
      val=null;
    }
    emit([field, val, doc.type], summary);
  }
}
