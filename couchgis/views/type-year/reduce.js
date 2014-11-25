// Find the smallest range that covers at least one
// range, and the largest range that covers all ranges.

function(keys, values, rereduce) {
  for (var v=0; !rereduce && v<values.length; v++) {
    var ranges=values[v].doc.ranges;
    values[v]={
      all: ranges.slice(),
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
  ;function intersection(a, b) {
    ;function not(relates, a, b) { return relates(a,b) === a ? b : a; }
    var a0=a.pop();
    var b0=b.pop();
    var result=[];
    while (a0 && b0) {
      var begin=not(lesser, a0.begin, b0.begin);
      var end=not(greater, a0.end, b0.end);
      for (var d=0;d<=3;d++) {
        if (d===begin.length || d===end.length || begin[d]<end[d])
          result.push({ begin:begin, end:end });
        if (d===begin.length || d===end.length || begin[d]!==end[d])
          break;
      }
      var l=lesser(a0.begin, b0.begin);
      if (l!==a0.begin) a0=a.pop();
      if (l!==b0.begin) b0=b.pop();
    }
    return result.reverse();
  }
  var value=values.pop();
  var one=value.one[0];
  var all=value.all;
  while ( value=values.pop() ) {
    var one2=value.one[0];
    one.begin=lesser(one.begin, one2.begin) || one.begin;
    one.end=greater(one.end, one2.end) || one.end;
    all=intersection(all, value.all);
  }
  return { one:[one], all:all };
}
