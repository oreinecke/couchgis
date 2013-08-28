function(newDoc, oldDoc, userCtx, secObj) {
// make your db read-only for everyone and grant
// write-access for normal documents to all users.
  if (userCtx.roles.indexOf("user")==-1)
    throw({unauthorized: 'Database is read-only for non-members!'});
// don't apply any design restrictions to deleted docs
  if (newDoc._deleted) return;
// request some self-explanatory power
  var types=["Gemarkung", "FlurStk", "Adresse"];
  if (types.indexOf(newDoc.type)==-1)
    throw({forbidden: "doc.type must be set and one of "+types.join("/")});
// linked documents should look like "link:{_id:id}"
// and 'link' itself has to be on of 'types' because
// we have to know what we're linking to
  var inspect_ids=function(obj) {
    if (typeof(obj)!="array" && typeof(obj)!="object")
      return;
    for (key in obj) {
      var prop=obj[key];
      // because typeof(null)=="object"
      if (!prop) continue;
      if (obj!==newDoc && obj._id!==undefined && key!="_id")
        throw({forbidden: "Link objects must consist of _id only"});
      if (typeof(prop)=="object" && prop._id!==undefined) {
        if (typeof(prop._id)!="string") throw({forbidden: "Linked document ID "+prop._id+" must be a string"});
        if (types.indexOf(key)==-1) throw({forbidden: "Property "+key+" must indicate known type"});
      }
      inspect_ids(prop);
    }
  };
  inspect_ids(newDoc);
}
