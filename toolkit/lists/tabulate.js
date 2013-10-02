// Tabulates over members of selected rows and
// transcends into linked documents' structure
// if indicated by the _id member. This was
// originally part of COBRA's 'meta4re' design doc.

function(head, req) {
  start({'headers':{'Content-Type':'text/plain;charset=utf-8'}});
  send('\n');
  var tabs = [];
  var cuts = [];
  var expr = [];
  for (var query in req.query)
    if (req.query[query]=="")
      // interpret /<match-expr>/<flags>
      if (query[0]=='/') {
        var flags=query.match(/\/[^/]*$/);
        try {
          expr.push(new RegExp(query.substring(1,flags.index), flags[0].substring(1)));
        } catch(err) {
          send("RegExp error: "+err.message+'\n');
          return;
        }
      // and anything else as field
      } else tabs=tabs.concat(query.split(':'));
    // ignore _view API query arguments
    else if (query.search(/^(key\.|(value|doc)($|\.))/)>=0)
      cuts.push({fields:query.split('.'), val:req.query[query]});
  // stash split fields in tabs
  for (var t=0;t<tabs.length;t++) tabs[t]=tabs[t].split('.');
  var row={}, doc={}, last_row=null;
  while (row) {
    if (row) row=getRow();
    if (last_row && (row==null||!row.id||last_row.id!=row.id)) {
      var s=(expr.length?JSON.stringify(last_row):undefined);
      for (var e=0;e<expr.length;e++)
        if (s.search(expr[e])==-1) {
          last_row=null;
          break;
        }
      for (var c=0;last_row&&c<cuts.length;c++) {
        var fields=cuts[c].fields;
        var val=last_row;
        for (var f=0;f<fields.length;f++) {
          val=val[fields[f]];
          if (val==null) break;
          // dive into linked docs if available
          if (val._id in doc) val=doc[val._id];
        }
        if (val!=cuts[c].val) {
          last_row=null;
          break;
        }
      }
      fields=null;
      for (var t=0;last_row&&t<tabs.length;t++) {
        if (fields) send(' ');
        fields=tabs[t];
        var val=last_row;
        for (var f=0;f<fields.length;f++) {
          val=val[fields[f]];
          if (val==null) break;
          // dive into linked docs if the are available
          if (val._id in doc) val=doc[val._id];
        }
        if (val!=null)
          send(JSON.stringify(val).replace(/^"|"$/g,''));
      }
      if (fields) send("\n");
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
