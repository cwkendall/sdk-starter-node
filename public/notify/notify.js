function ready(callback) {
  // in case the document is already rendered
  if (document.readyState != "loading") callback();
  // modern browsers
  else if (document.addEventListener) document.addEventListener("DOMContentLoaded", callback);
  // IE <= 8
  else
    document.attachEvent("onreadystatechange", function() {
      if (document.readyState == "complete") callback();
    });
}

function updateBindings() {
  $.getJSON("/bindings", data => {
    var header = $("#users").find("thead");
    header.empty();
    $(data.fields).each((i, f) => {
      header.append($("<th>").html(f));
    });
    var body = $("#users").find("tbody:last");
    body.empty();
    data.bindings.forEach(b => {
      var row = $("<tr>");
      $(b).each((i, f) => {
        row.append($("<td>").html(new Array(f).join("<p>")));
      });
      body.append(row);
    });
  }).always(function() {
    setTimeout(updateBindings, 5000);
  });
}

ready(function() {
  setTimeout(updateBindings, 1000);
});

$(function() {
  $("#clearBindingsButton").on("click", function() {
    $.get("/clear-bindings", function(response) {
      $("#history").append(response.message + "\n");
      console.log(response);
    });
  });
  $("#addBindingsButton").on("click", function() {
    const list = $("#bindingsList")
      .val()
      .split(/[\r\n]+/);
    for (let val of list) {
      let parts = val.split(",");
      let address = parts[0].split(":");
      let tags = parts.slice(1);
      let data = {
        identity: address[0],
        address: address[0],
        bindingType: "sms",
        tag: tags
      };
      if (address.length > 1) {
        data = {
          identity: address[1],
          address: address[1],
          bindingType: address[0],
          tag: tags
        };
      }
      $.post("/register", data, function(response) {
        $("#bindingsList").val("");
        $("#history").append("POST[bindings]: " + response.message + "\n");
        console.log(response);
      });
    }
  });
  $("#sendNotificationButton").on("click", function() {
    var data = $.extend(
      {},
      {
        identity: $("#identityInput").val()
          ? $("#identityInput")
              .val()
              .split(",")
          : undefined,
        segment: $("#segmentInput").val()
          ? $("#segmentInput")
              .val()
              .split(",")
          : undefined,
        tag: $("#tagInput").val()
          ? $("#tagInput")
              .val()
              .split(",")
          : undefined,
        title: $("#titleInput").val(),
        body: $("#bodyText").val()
      }
    );
    $("#history").append("POST: " + JSON.stringify(data) + "\n");
    $.post("/send-notification", data, function(response) {
      $("#identityInput").val("");
      $("#segmentInput").val("");
      $("#tagInput").val("");
      $("#titleInput").val("");
      $("#bodyText").val("");
      $("#history").append(response.message + "\n");
      console.log(response);
    });
  });
});
