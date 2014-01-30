// Searches document recursively for _id's and emits links.

function(doc) {
  var ids={};
  (function collect_ids(obj) {
    if (obj==null || typeof(obj)!="object") return;
    if (typeof(obj._id)=="string")
      ids[obj._id]=null;
    for (var prop in obj)
      collect_ids(obj[prop]);
  })(doc);
  for (var id in ids) emit(doc.type, {_id:id});
}
