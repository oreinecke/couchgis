// Sample values of fields for auto-completion.

function(doc) {
  if (doc.type==null) return;
  for (var field in doc) {
    var val=doc[field];
    if (!/^[A-ZÄÖÜ]/.test(field) continue;
    if (/^GeoJSON/.test(field)) continue;
    // store detailed field info in summary
    var summary={count:1,type:typeof(val)};
    if (typeof(val)==="number") {
      summary.min=val;
      summary.max=val;
      val=null;
    }
    emit([doc.type, field, val], summary);
  }
}
