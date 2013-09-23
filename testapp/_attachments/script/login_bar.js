$(document).ready(function() {
  var log={
    success: function(resp) {
      if (resp.userCtx.name!==null || resp.userCtx.roles && resp.userCtx.roles.indexOf("_admin")>=0) {
        $("#logout").show();
        href=$("#logout .username");
        // expect admin party if name==null
        href.text(resp.userCtx.name||"Administrator (keine Benutzer festgelegt)");
        // link to futon user doc
        if (resp.userCtx.name)
          href.attr({href:"/_utils/document.html?_users/org.couchdb.user:"+href.text()});
        else
          $("#logout input").hide();
        $("#login").hide();
        $("#login .error").hide();
      } else {
        $("#login").show();
        $("#logout").hide();
      }
    }
  };
  $.couch.session(log);
  $("#login form").submit(function(e) {
    e.preventDefault();
    var login={
      name:     $("#login .username").val(),
      password: $("#login .password").val(),
      success:function(resp) {
        log.success({userCtx:{name:this.name}});
      },
      error:function() {
        $("#login .error").show();
      }
    };
    $.couch.login(login);
  });
  $("#logout form").submit(function(e) {
    e.preventDefault();
    $.couch.logout();
    log.success({userCtx:{name:null}});
  });
});
