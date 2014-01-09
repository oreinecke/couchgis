// Unifies bboxes for viewport initialization.
// Also unifies time ranges as general info.

function(keys, values, rereduce) {
  ;function less_or_equal(a, b) {
    for (var d=0;d<3;d++) {
      if (d==a.length) return true;
      if (d==b.length) return false;
      if (a[d]<b[d]) return true;
      if (a[d]>b[d]) return false;
    }
    return true;
  }
  ;function greater_or_equal(a, b) {
    for (var d=0;d<3;d++) {
      if (d==a.length) return true;
      if (d==b.length) return false;
      if (a[d]>b[d]) return true;
      if (a[d]<b[d]) return false;
    }
    return true;
  }
  ;function expand(a,b) {
    var a1=a.begin, a2=a.end;
    var b1=b.begin, b2=b.end;
    var result={
      begin:(less_or_equal(a1,b1)?a1:b1),
      end:(greater_or_equal(a2,b2)?a2:b2)
    };
    if (!a1.length) result.begin=b1;
    if (!b1.length) result.begin=a1;
    if (!a2.length) result.end=b2;
    if (!b2.length) result.end=a2;
    return result;
  }
  var bbox=values[0].bbox;
  var range=values[0].range;
  for (var v=1;v<values.length;v++) {
    var bbox2=values[v].bbox;
    bbox[0]=(bbox[0]<bbox2[0])?bbox[0]:bbox2[0];
    bbox[1]=(bbox[1]<bbox2[1])?bbox[1]:bbox2[1];
    bbox[2]=(bbox[2]>bbox2[2])?bbox[2]:bbox2[2];
    bbox[3]=(bbox[3]>bbox2[3])?bbox[3]:bbox2[3];
    range=expand(range, values[v].range);
  }
  return {bbox:bbox, range:range};
}
