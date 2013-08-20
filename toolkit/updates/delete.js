// removes the entire document without the need 
// to specify the revision as in DELETE /db/doc
function(doc, req) {
  if (req.userCtx.roles.indexOf("_admin")==-1) 
    return[null, 'Only admins are allowed to use /_update/delete!'];
  if (!doc)
    return[null, 'Document must be specified and existing!'];
  doc._deleted=true;
  return[doc, 'Deleted '+doc._id];
}
