$(document).ready(function() {
  var log={
    success: function(resp) {
      if (resp.userCtx.name!==null || resp.userCtx.roles && resp.userCtx.roles.indexOf("_admin")>=0) {
        $("#logout").show();
        href=$("#logout a");
        // expect admin party if name==null
        href.text(resp.userCtx.name||"Administrator (keine Benutzer festgelegt)");
        // link to futon user doc
        if (resp.userCtx.name)
          href.attr({href:"/_utils/document.html?_users/org.couchdb.user:"+href.text()});
        else
          $("#logout :submit").hide();
        $("#login").hide();
        $("#login b").hide();
      } else {
        $("#login").show();
        $("#logout").hide();
      }
    }
  };
  $.couch.session(log);
  $("#login").submit(function(e) {
    e.preventDefault();
    var login={
      name:     $("#login :text").val(),
      password: $("#login :password").val(),
      success:function(resp) {
        log.success({userCtx:{name:this.name}});
      },
      error:function() {
        $("#login b").show();
      }
    };
    $.couch.login(login);
  });
  $("#logout").submit(function(e) {
    e.preventDefault();
    $.couch.logout();
    log.success({userCtx:{name:null}});
  });
});
