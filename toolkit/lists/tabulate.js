// Tabulates over members of selected rows and
// transcends into linked documents' structure
// if indicated by the _id member. This was
// originally part of COBRA's 'meta4re' design doc.

function(head, req) {
  start({'headers':{'Content-Type':'text/plain'}});
  var tabs = [];
  var cuts = {};
  for (var query in req.query)
    if (req.query[query]=="")
      tabs=tabs.concat(query.split(':'));
    else
      // ignore _view API query arguments
      if (query.search(/^(key\.|(value|doc)($|\.))/)>=0)
        cuts[query]=req.query[query];
  var row={}, doc={}, last_row=null;
  while (row) {
    if (row) row=getRow();
    if (!row || last_row && last_row.id!=row.id) {
      for (var cut in cuts) {
        fields=cut.split('.');
        var val=last_row;
        for (var f=0;f<fields.length;f++) {
          val=val[fields[f]];
          if (val==undefined) break;
          // dive into linked docs if the are available
          if ('id' in val && val._id in doc) val=doc[val._id];
        }
        if (val!=cuts[cut]) {
          last_row=null;
          break;
        }
      }
      if (!last_row) continue;
      fields=null;
      for (var t=0;t<tabs.length;t++) {
        if (fields) send(' ');
        fields=tabs[t].split('.');
        var val=last_row;
        for (var f=0;f<fields.length;f++) {
          val=val[fields[f]];
          if (val==null) break;
          // dive into linked docs if the are available
          if ('id' in val && val._id in doc) val=doc[val._id];
        }
        if (val!=null)
          send(JSON.stringify(val).replace(/^"|"$/g,''));
      }
      send("\n");
      doc={};
    }
    if (!row) continue;
    last_row=row;
    // store linked docs for later use
    if ('doc' in row) doc[row.doc._id]=row.doc;
    // always start from the unlinked doc
    if (row.id in doc) last_row.doc=doc[row.id];
  }
}
