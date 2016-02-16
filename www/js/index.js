//global firebase syntax parser (strings)
function ps(str) {
  str = str.replace('_', ' ');
  if (str == "empty") {
    str = "-------";
  }
  return str;
}

//global firebase syntax parser (dates)
function pd(dt) {
  if (dt == "empty") {
    return "-------";
  } else {
    dt = new Date(dt);
    return (dt.getMonth() + 1) + "/" + dt.getDate() + "/" + dt.getFullYear().toString().substr(2,2);
  }
}

//capitalization function
String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};
$('#scan-btn').click(function () {
  bootbox.alert('<ul><li>Please find the booklet\'s barcode (located on its back) and press OK.</li><br><li>Then place the barcode under the scanner.</li></ul>', function () {

    cordova.plugins.barcodeScanner.scan(
    function (result) {

       if (result.cancelled || result.format != 'DATA_MATRIX') {
         bootbox.alert('That barcode isn\'t correct. Are you sure you scanned the booklet\'s code?');
       } else {
         bootbox.prompt({
           title: "What is your full name?",
           value: localStorage.getItem("name"),
           callback: function(name){
             name = name.trim();
             if (name != null && name != "") {
               localStorage.setItem("name", name);
               var firebase = new Firebase('https://t905-libraries.firebaseio.com/books/').child((result.text + '').capitalize());
               var today = new Date();
               var due_by = new Date(today.getFullYear(),today.getMonth(),today.getDate()+21); //due in 21 days (3 weeks)
               firebase.set({holder: name, checked_out: today.toString(), due: due_by.toString()}, function (err) {
                 if (err) {
                   bootbox.alert('An error has occured: ' + error);
                 } else {
                   var history_fb = new Firebase('https://t905-libraries.firebaseio.com/history').child((result.text + '').capitalize()).child(name);
                   history_fb.set({checked_out: today.toString()});
                   cordova.plugins.notification.local.schedule({
                     id: 1,
                     title: 'Merit Badge Book Coming Due',
                     text: 'The ' + (result.text + '').capitalize() + ' T905 book is due by ' + pd(due_by),
                     every: 'day',
                     at: new Date(due_by.getFullYear(), due_by.getMonth(), due_by.getDate()-7) //starts reminding the week of
                  }, function () {
                    bootbox.alert('Checkout successful. Your book is due by ' + due_by.toDateString() + ' (3 weeks)', function () {
                      window.location.replace('./index.html');
                    });

                  });
                 }
               });
             }
           }
         });
       }

    },
    function (error) {
       bootbox.alert("Scanning failed: " + error);
    }
    );
  });

});

$('#return-btn').click(function () {
  bootbox.alert('<ul><li>You must be in the Scout Shack to return a book.</li><br><li>Please locate the T905 Library Shelf.</li><br><li>Then hit OK and scan the barcode located on its front.</li></ul>', function () {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        if (result.cancelled || result.format != 'QR_CODE' || result.text != 'return_qr_code') {
          bootbox.alert('That barcode isn\'t correct. Are you sure you scanned the library\'s barcode?');
        } else {
          //success, scan book
          bootbox.alert('<ul><li>Please find the booklet\'s barcode (located on its back) and press OK.</li><br> <li>Then place the barcode under the scanner.</li></ul>', function () {
            cordova.plugins.barcodeScanner.scan(
              function (result) {
                if (result.cancelled || result.format != 'DATA_MATRIX') {
                  bootbox.alert('That barcode isn\'t correct. Are you sure you scanned the book\'s barcode?');
                } else {
                  //success, return the book in firebase
                  var firebase = new Firebase('https://t905-libraries.firebaseio.com/books/').child((result.text + '').capitalize());
                  firebase.set({holder: 'empty', due: 'empty', checked_out: 'empty'});
                  var history_fb = new Firebase('https://t905-libraries.firebaseio.com/history/').child((result.text + '').capitalize()).child(localStorage.name);
                  history_fb.set({returned: new Date().toString()});
                  cordova.plugins.notification.local.clear(1, function() {
                    console.log('INF: cleared book reminder notification');
                    bootbox.alert('Done! Your ' + return_booklet + ' booklet has been returned!', function () {
                      window.location.replace('./index.html');
                    });
                  });
                }
              },
              function (error) {
                  bootbox.alert("Scanning failed: " + error);
              }
           );
          });
        }
      },
      function (error) {
          bootbox.alert("Scanning failed: " + error);
      }
   );
  });

});

var return_code = false;
var return_booklet = '';

$('#scan_book_btn').click(function () {
  cordova.plugins.barcodeScanner.scan(
    function (result) {
      if (result.cancelled || result.format != 'DATA_MATRIX') {
        bootbox.alert('ERR: Invalid Barcode');
      } else {
        $('#scan_book_chk').attr('checked', 'checked');
        return_booklet = (result.text + '').capitalize();

        if (return_code) {
          $('#return_booklet_btn').prop('disabled', false);
        }
      }
    },
    function (error) {
        bootbox.alert("Scanning failed: " + error);
    }
 );
});

$('#scan_return_btn').click(function () {
  cordova.plugins.barcodeScanner.scan(
    function (result) {
      if (result.cancelled || result.format != 'QR_CODE' || result.text != 'return_qr_code') {
        bootbox.alert('ERR: Invalid Barcode');
      } else {
        $('#scan_return_chk').attr('checked', 'checked');
        return_code = true;

        if (return_booklet != '') {
          $('#return_booklet_btn').prop('disabled', false);
        }
      }
    },
    function (error) {
        bootbox.alert("Scanning failed: " + error);
    }
 );
});

$('#return_booklet_btn').click(function () {
  var firebase = new Firebase('https://t905-libraries.firebaseio.com/books/').child(return_booklet);
  firebase.set({holder: 'empty', due: 'empty', checked_out: 'empty'});
  var history_fb = new Firebase('https://t905-libraries.firebaseio.com/history/').child(return_booklet).child(localStorage.name);
  history_fb.set({returned: new Date().toString()});
  cordova.plugins.notification.local.clear(1, function() {
    console.log('INF: cleared book reminder notification');
    bootbox.alert('Done! Your ' + return_booklet + ' booklet has been returned!', function () {
      window.location.replace('./index.html');
    });
  });
});

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
      var firebase = new Firebase('https://t905-libraries.firebaseio.com/books/');

      firebase.once("value", function(snapshot) {
        var books = snapshot.val();
        console.log(books);
//        var i = 0;
        var lstkey ;
        snapshot.forEach(function (childSnapshot) {
          var key = childSnapshot.key();
          var value = childSnapshot.val();
          $('.scrollable').append('<tr><td>' + ps(key) + '</td><td>' + ps(value.holder) + '</td><td>' + pd(value.checked_out) + '</td><td>' + pd(value.due) + '</td></tr>');
//          i++;
          lstkey = key;
        });
//        $('.scrollable').append('<tr><td>Exited!!' + i + ' ' + ps(key) + '</td><td>' + ps(value.holder) + '</td><td>' + pd(value.checked_out) + '</td><td>' + pd(value.due) + '</td></tr>');
        //console.log('lstkey: ' + key);
        //console.log('...done reading entries');
        /*$.each(books, function(key, value) {
          $('.scrollable').append('<tr><td>' + ps(key) + '</td><td>' + ps(value.holder) + '</td><td>' + pd(value.checked_out) + '</td><td>' + pd(value.due) + '</td></tr>');
        });*/

      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
    }
};

app.initialize();
