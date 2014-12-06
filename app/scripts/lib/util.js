(function($) {
  $.QueryString = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=');
        if (p.length != 2) continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
  })(window.location.search.substr(1).split('&'))
})(jQuery);

(function(rx) {
  rx.Observable.delayEach = function (array, dueTime, scheduler) {
    scheduler || (scheduler = rx.Scheduler.timeout);
    return rx.Observable.create(function (observer) {
      var count = 0, len = array.length;
      return scheduler.scheduleRecursiveWithRelative(dueTime, function (self) {
        if (count < len) {
            observer.onNext(array[count++]);
            self(dueTime);
        } else {
            observer.onCompleted();
        }
      });
    });
  };
})(Rx);

(function($, d3) {
  $.getDataFromFile = function(filename) {
    var arraydata = null;
    $.ajax({
      type: "GET",
      url: filename,
      dataType: "text",
      async: false,
      success: function(csv) { arraydata = d3.csv.parseRows(csv); }
    });
    return arraydata;
  };
})(jQuery, d3);
