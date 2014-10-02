// Count occurrences of strings
// or sample ranges of numbers.

function reduce(keys, values) {
  var result=values.pop();
  while (values.length) {
    var value=values.pop();
    result.count+=value.count;
    if (result.type==="number") {
      if (value.min<result.min) result.min=value.min;
      if (value.max>result.max) result.max=value.max;
    }
  }
  return result;
}
