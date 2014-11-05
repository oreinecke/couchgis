// For group_level=2, forward 1st of all identical keys as
// document value that can be evaluated by _list/tabulate.

function reduce(keys, values, rereduce) {
  if (rereduce) return values.pop();
  var key=keys.pop()[0];
  var doc={type:key[0]};
  doc[key[1]]=key[2];
  return {doc:doc};
}
