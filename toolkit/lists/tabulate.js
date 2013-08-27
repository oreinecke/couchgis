// Tabulates over members of selected rows and
// transcends into linked documents' structure
// if indicated by the _id member. This was
// originally part of COBRA's 'meta4re' design doc.

function(head, req) {
  start({'headers':{'Content-Type':'text/plain'}});
  var tabs = [];
  var cuts = {};
  for (query in req.query)
    if (req.query[query]=="")
      tabs=tabs.concat(query.split(':'));
    else
      // ignore _view API query arguments
      if (query.match(/^(key\.|(value|doc)($|\.))/)) cuts[query]=req.query[query];
  var row={}, doc={}, last_row=null;
  while(row) {
    if (row) row=getRow();
    if (!row || last_row && (!last_row.id || last_row.id!=row.id)) {
      for (cut in cuts) {
        fields=cut.split('.');
        var val=last_row;
        for (f=0;f<fields.length;f++) {
          val=val[fields[f]];
          if (!val) break;
          // dive into linked docs if the are available
          if (val._id && doc[val._id]) val=doc[val._id];
        }
        if (val && val!=cuts[cut]) {
          last_row=null;
          break;
        }
      }
      if (!last_row) continue;
      fields=null;
      for (t=0;t<tabs.length;t++) {
        if (fields) send(' ');
        fields=tabs[t].split('.');
        var val=last_row;
        for (f=0;f<fields.length;f++) {
          val=val[fields[f]];
          if (!val) break;
          // dive into linked docs if the are available
          if (val._id && doc[val._id]) val=doc[val._id];
        }
        if (val) send(JSON.stringify(val).replace(/^"|"$/g,''));
      }
      send("\n");
      doc={};
    }
    if (!row) continue;
    last_row=row;
    // store linked docs for later use
    if (row.doc) doc[row.doc._id]=row.doc;
    // always start from the unlinked doc
    if (doc[row.id]) last_row.doc=doc[row.id];
  }
}
