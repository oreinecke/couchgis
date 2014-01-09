// Unifies bboxes for viewport initialization.
// Also unifies time ranges as general info.

function(keys, values, rereduce) {
  ;function lesser(a, b) {
    // Do not expand to -infinity, because
    // these are covered by any range anyway.
    if (!a.length) return b;
    if (!b.length) return a;
    for (var d=0;d<3;d++) {
      if (d==a.length) return a;
      if (d==b.length) return b;
      if (a[d]<b[d]) return a;
      if (a[d]>b[d]) return b;
    }
    return a;
  }
  ;function greater(a, b) {
    if (!a.length) return b;
    if (!b.length) return a;
    for (var d=0;d<3;d++) {
      if (d==a.length) return a;
      if (d==b.length) return b;
      if (a[d]>b[d]) return a;
      if (a[d]<b[d]) return b;
    }
    return a;
  }
  var bbox=values[0].bbox;
  var range=values[0].range;
  for (var v=1;v<values.length;v++) {
    var bbox2=values[v].bbox;
    bbox[0]=(bbox[0]<bbox2[0])?bbox[0]:bbox2[0];
    bbox[1]=(bbox[1]<bbox2[1])?bbox[1]:bbox2[1];
    bbox[2]=(bbox[2]>bbox2[2])?bbox[2]:bbox2[2];
    bbox[3]=(bbox[3]>bbox2[3])?bbox[3]:bbox2[3];
    var range2=values[v].range;
    range.begin=lesser(range.begin,range2.begin);
    range.end=greater(range.end,range2.end);
  }
  return {bbox:bbox, range:range};
}
