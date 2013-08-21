// Tabulates over members of selected rows. This was
// originally part of COBRA's 'meta4re' design doc.

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
    for (cut in cuts) {
      fields=cut.split('.');
      var val=row;
      for (f=0;f<fields.length;f++) {
        val=val[fields[f]];
        if (!val) break;
      }
      if (val && val!=cuts[cut]) {
        row=null;
        break;
      }
    }
    fields=null;
    if (!row) continue;
    for (t=0;t<tabs.length;t++) {
      if (fields) send(' ');
      fields=tabs[t].split('.');
      var val=row;
      for (f=0;f<fields.length;f++) {
        val=val[fields[f]];
        if (!val) break;
      }
      if (val) send(JSON.stringify(val).replace(/^"|"$/g,''));
    }
    send("\n");
  }
}
