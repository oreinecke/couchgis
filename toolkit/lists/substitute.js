// Tabulates over members of selected rows and 
// transcends into linked documents' structure.

function(head, req) {
  start({'headers':{'Content-Type':'text/plain'}});
  var tabs = [];
  var cuts = {};
  for (query in req.query)
    if (req.query[query]=="")
      tabs=tabs.concat(query.split(':'));
    else
      cuts[query]=req.query[query];
  var row={}, doc={}, id=null;
  while(row) {
    if (row) row=getRow();
    if (!row || id && id!=row.id) {
      for (cut in cuts) {
        fields=cut.split('.');
        var val=doc[id];
        for (f=0;f<fields.length;f++) {
          val=val[fields[f]];
          if (!val) break;
          if (val._id) val=doc[val._id];
        }
        if (val && val!=cuts[cut]) {
          doc={};
          break;
        }
      }
      if (!doc[id]) continue;
      fields=null;
      for (t=0;t<tabs.length;t++) {
        if (fields) send(' ');
        fields=tabs[t].split('.');
        var val=doc[id];
        for (f=0;f<fields.length;f++) {
          val=val[fields[f]];
          if (!val) break;
          if (val._id) val=doc[val._id];
        }
        if (val) send(JSON.stringify(val).replace(/^"|"$/g,''));
      }
      send("\n");
      doc={};
    }
    if (!row) continue;
    id=row.id;
    doc[row.doc._id]=row.doc;
  }
}
