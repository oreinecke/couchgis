// For group_level=2, forward 1st of all identical keys as
// typed document that can be evaluated by _list/tabulate.

function (keys, values, rereduce) {
  return rereduce ? values[0] : { doc:{ type: keys[0][0][1] } };
}
