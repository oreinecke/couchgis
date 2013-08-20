// Tabulates over members if include_docs is given.
// This was originally part of COBRA's 'meta4re' design doc.

function(head, req) {
  start({'headers':{'Content-Type':'text/plain'}});
  var tabs = [];
  var cuts = {};
  for (query in req.query)
    if (req.query[query]=="")
      tabs=tabs.concat(query.split(':'));
    else
      cuts[query]=req.query[query];
  while(row=getRow()) {
    if (!row.doc) throw({invalid: "No document supplied to view"});
    for (cut in cuts) {
      fields=cut.split('.');
      var val=row.doc;
      for (field in fields) {
        val=val[fields[field]];
        if (!val) break;
      }
      if (val && val!=cuts[cut]) {
        row=null;
        break;
      }
    }
    fields=null;
    if (!row) continue;
    for (tab in tabs) {
      if (fields) send(' ');
      fields=tabs[tab].split('.');
      var val=row.doc;
      for (field in fields) {
        val=val[fields[field]];
        if (!val) break;
      }
      if (val) send(JSON.stringify(val).replace(/^"|"$/g,''));
    }
    send("\n");
  }
}
