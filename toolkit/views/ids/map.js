// Searches document recursively for _id's and emits links.

function(doc) {
  var ids={};
  // erica only pushes anonymous functions
  var collect_ids=function(obj) {
    if (typeof(obj)=="object" && typeof(obj._id)=="string")
      ids[obj._id]=null;
    if (typeof(obj)=="array" || typeof(obj)=="object")
      for (prop in obj)
        collect_ids(obj[prop]);
  }
  collect_ids(doc);
  for (id in ids) emit(doc.type, {_id:id});
}
