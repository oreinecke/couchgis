// For group_level=2, forward 1st of all identical keys as
// document value that can be evaluated by _list/tabulate.

function(keys, values, rereduce) {
  if (rereduce) return values.pop();
  var key=keys.pop()[0];
  return {doc:{type:key[0], ranges:key[1] || undefined}};
}
