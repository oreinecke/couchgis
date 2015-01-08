// Redirect to Futon for document editing.

function(doc, req) {
  return {
    code:301, headers:{
      Location:"/_utils/document.html?" + req.info.db_name + "/" + req.id
    }
  };
}
