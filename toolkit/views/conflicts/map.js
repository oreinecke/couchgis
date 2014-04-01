function(doc) {
  if ('_conflicts' in doc)
    emit(doc._rev, doc._conflicts);
  if ('_deleted_conflicts' in doc)
    emit(doc._rev, doc._deleted_conflicts);
}
