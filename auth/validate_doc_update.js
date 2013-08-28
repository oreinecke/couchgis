function(newDoc, oldDoc, userCtx, secObj) {
// make your db read-only for everyone and grant
// write-access for normal documents to all users.
  if (userCtx.roles.indexOf("user")==-1)
    throw({unauthorized: 'Database is read-only for non-members!'});
// request some self-explanatory power
  var types=["Gemarkung", "FlurStk", "Adresse"];
  if (!newDoc._deleted && types.indexOf(newDoc.type)==-1)
    throw({forbidden: "doc.type must be set and one of "+types.join("/")});
}
