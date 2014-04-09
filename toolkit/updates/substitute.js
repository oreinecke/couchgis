// Applies regexp substitution to stringified doc. Syntax
// reads /substitute/<doc>?/<pattern>/<flags>=<replacement>.

function(doc, req) {
  if (req.userCtx.roles.indexOf("_admin")==-1)
    return[null, 'Only admins are allowed to use /_update/substitute!\n'];
  if (!doc)
    return[null, 'Document must be specified and existing!\n'];
  // keep doc._id and exclude from substitution
  var id=doc._id;
  delete doc._id;
  delete doc._rev;
  doc=JSON.stringify(doc);
  var changed=false;
  for (var q in req.query) {
    var flags=q.match(/\/[^/]*$/);
    var pattern;
    try {
      pattern=new RegExp(q.substring(1,flags.index), flags[0].substring(1));
    } catch(err) {
      return[null, "RegExp error: "+err.message+'\n'];
    }
    var oldDoc=doc
    doc=doc.replace(pattern, req.query[q]);
    changed|=(oldDoc!=doc);
  }
  try {
    doc=JSON.parse(doc);
  } catch(err) {
    return[null, "Invalid JSON by bad substitution\n"];
  }
  doc._id=id;
  // avoid new revisions if no apparent changes
  if (changed) return[doc, 'Substituted '+doc._id+'\n'];
  else return[null, 'Unchanged '+doc._id+'\n'];
}
