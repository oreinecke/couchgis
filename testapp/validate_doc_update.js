function(newDoc, oldDoc, userCtx, secObj) {
// make your db read-only for everyone and grant
// write-access for normal documents to all users.
  if (userCtx.roles.indexOf("user")===-1 && userCtx.roles.indexOf("_admin")===-1)
    throw({unauthorized: 'Database is read-only for non-members!'});
}
