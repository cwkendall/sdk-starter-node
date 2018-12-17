function ready(callback){
    // in case the document is already rendered
    if (document.readyState!='loading') callback();
    // modern browsers
    else if (document.addEventListener) document.addEventListener('DOMContentLoaded', callback);
    // IE <= 8
    else document.attachEvent('onreadystatechange', function(){
        if (document.readyState=='complete') callback();
    });
}

function updateBindings() {
  $.getJSON('/bindings', (data) => {
    var header = $('#users').find('thead');
    header.empty();
    $(data.fields).each((i, f) => {
      header.append($('<th>').html(f))
    });
    var body = $('#users').find('tbody:last');
    body.empty();
    data.bindings.forEach((b) => {
      var row = $('<tr>')
      $(b).each((i, f) => {
        row.append($('<td>').html(f))
      })
      body.append(row);
    });
  }).always(function() {
    setTimeout(updateBindings, 1000);
  });
}

ready(function(){
    setTimeout(updateBindings, 1000);
});


$(function() {
  $('#sendNotificationButton').on('click', function() {
    var data = $.extend({}, {
        identity: $('#identityInput').val() ? $('#identityInput').val().split(',') : undefined,
        segment: $('#segmentInput').val() ? $('#segmentInput').val().split(',') : undefined,
        tag: $('#tagInput').val() ? $('#tagInput').val().split(',') : undefined,
        title: $('#titleInput').val(),
        body: $('#bodyText').val()
    });
    $('#history').append('POST: '+ JSON.stringify(data) + '\n')
    $.post('/send-notification', data, function(response) {
      $('#identityInput').val('');
      $('#segmentInput').val('');
      $('#tagInput').val('');
      $('#titleInput').val('');
      $('#bodyText').val('');
      $('#history').append(response.message + '\n');
      console.log(response);
    });
  });
});
