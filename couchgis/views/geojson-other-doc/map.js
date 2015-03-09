// Associate GeoJSON id with document ids using it.

function(doc) {
  if (!doc.type) return;
  var ids=doc[ doc.GeoJSON ? "_id" : "GeoJSON_clone" ], id;
  if (!ids) return;
  ids=ids.replace(/[#%].*($)/gm, '$1');
  ids=ids.match(/[^\s,;&]+/g);
  while ( id=ids.pop() )
    if (id!==doc._id) emit(id);
}
