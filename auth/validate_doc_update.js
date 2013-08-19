function(newDoc, oldDoc, userCtx, secObj) {
// make your db read-only for everyone and grant
// write-access for normal documents to all users.
  if (userCtx.roles.indexOf("user")==-1)
    throw({forbidden: 'Database is read-only for non-members!'});
// request some self-explanatory power
  let types=["Gemarkung", "FlurStk"];
  if (types.indexOf(newDoc.type)==-1)
    throw({invalid: "doc.type must be set and one of "+types.join(", ")});
}
