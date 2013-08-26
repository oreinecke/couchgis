function(doc) {
  if (doc.type!="Gemarkung") return;
  emit([doc.Bundesland, doc.Landkreis, doc.Gemeinde, doc.Gemarkung])
}