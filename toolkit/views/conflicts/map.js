// this might come in handy
function(doc) {
  if ('_conflicts' in doc)
    emit(doc._rev, doc._conflicts);
}
