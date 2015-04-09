// For group_level=2, forward 1st of all identical keys as
// typed document that can be evaluated by _list/tabulate.

function (keys, values, rereduce) {
  if (rereduce) return values[0];
  var value=keys[0][0][2];
  if (typeof value==="string" && value.length>200)
    value=value.slice(0,196)+" ...";
  var doc={ type:keys[0][0][1] };
  doc[keys[0][0][0]]=value;
  return { doc:doc };
}
