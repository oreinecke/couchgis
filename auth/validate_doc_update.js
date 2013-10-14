function(newDoc, oldDoc, userCtx, secObj) {
// make your db read-only for everyone and grant
// write-access for normal documents to all users.
  if (userCtx.roles.indexOf("user")==-1 && userCtx.roles.indexOf("_admin")==-1)
    throw({unauthorized: 'Database is read-only for non-members!'});
// don't apply any design restrictions to deleted docs
  if (newDoc._deleted) return;
// request some self-explanatory power
  var types=["Gemarkung", "FlurStk", "Flurstück", "Adresse", "Schlag"];
  if (types.indexOf(newDoc.type)==-1)
    throw({forbidden: "doc.type must be set and one of "+types.join("/")});
// linked documents should look like "link:{_id:id}"
// and 'link' itself has to be on of 'types' because
// we have to know what we're linking to
  ;function inspect_ids(obj, addr) {
    if (typeof(obj)!="object")
      return;
    for (var key in obj) {
      if (obj!==newDoc && obj._id!==undefined && key!="_id")
        throw({forbidden: "Link object "+addr+" must consist of _id only"});
      var obj2=obj[key];
      // because typeof(null)=="object"
      if (obj2===null) continue;
      var addr2=addr+"."+key;
      if (typeof(obj2)=="object" && '_id' in obj2) {
        if (typeof(obj2._id)!="string") throw({forbidden: "Link "+addr2+"._id must be a string"});
        if (types.indexOf(key)==-1) throw({forbidden: "Link object "+addr2+" must indicate known type"});
      }
      inspect_ids(obj2, addr2);
    }
  };
  inspect_ids(newDoc, "doc");
// allow either GeoJSON or GeoJSON_clone but not both
  if ("GeoJSON" in newDoc && "GeoJSON_clone" in newDoc)
    throw({forbidden: "Either set doc.GeoJSON or doc.GeoJSON_clone"});
}
