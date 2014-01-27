// Emits chars 1-26 of doc._id.

function(doc) {
  emit(doc._id.substr(0,26));
}
