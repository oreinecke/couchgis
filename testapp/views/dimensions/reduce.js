// Unify bboxes for viewport initialization.

function(keys, values, rereduce) {
  var bbox=values[0].bbox;
  for (var v=1;v<values.length;v++) {
    var bbox2=values[v].bbox;
    bbox[0]=(bbox[0]<bbox2[0])?bbox[0]:bbox2[0];
    bbox[1]=(bbox[1]<bbox2[1])?bbox[1]:bbox2[1];
    bbox[2]=(bbox[2]>bbox2[2])?bbox[2]:bbox2[2];
    bbox[3]=(bbox[3]>bbox2[3])?bbox[3]:bbox2[3];
  }
  return {bbox:bbox};
}
