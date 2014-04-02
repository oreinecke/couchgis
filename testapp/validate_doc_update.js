function(newDoc, oldDoc, userCtx, secObj) {
  // Make database read-only for everyone and grant
  // write-access for regular documents to all users.
  if (userCtx.roles.indexOf("user")===-1 && userCtx.roles.indexOf("_admin")===-1)
    throw({unauthorized: 'Database is read-only for non-members.'});
  // Prevent database from writing an unchanged document (_revisions
  // are taken out of the comparison because they differ all the time).
  delete newDoc._revisions;
  if (oldDoc) delete oldDoc._revisions;
  if (JSON.stringify(newDoc)===JSON.stringify(oldDoc))
    throw({forbidden: 'Uploaded document must differ from existing one.'});
}
