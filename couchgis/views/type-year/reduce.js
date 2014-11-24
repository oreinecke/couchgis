// Find the smallest range that covers at least one
// range, and the largest range that covers all ranges.

function(keys, values, rereduce) {
  for (var v=0; !rereduce && v<values.length; v++) {
    var ranges=values[v].doc.ranges;
    values[v]={
      one: [{ begin:ranges[0].begin, end:ranges.pop().end }]
    };
  }
  ;function lesser(a, b) {
    for (var d=0;d<3;d++) {
      if (d===a.length && d===b.length) return;
      if (d===a.length) return a;
      if (d===b.length) return b;
      if (a[d]<b[d]) return a;
      if (a[d]>b[d]) return b;
    }
  }
  ;function greater(a, b) {
    for (var d=0;d<3;d++) {
      if (d===a.length && d===b.length) return;
      if (d===a.length) return a;
      if (d===b.length) return b;
      if (a[d]>b[d]) return a;
      if (a[d]<b[d]) return b;
    }
  }
  }
  var value=values.pop();
  var one=value.one[0];
  while ( value=values.pop() ) {
    var one2=value.one[0];
    one.begin=lesser(one.begin, one2.begin) || one.begin;
    one.end=greater(one.end, one2.end) || one.end;
  }
  return { one:[one] };
}
