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

var firebase = new Firebase('https://t905-libraries.firebaseio.com/books/');

firebase.on("value", function(snapshot) {
  var books = snapshot.val();
  console.log(books);

  $.each(books, function(key, value) {
    $('.scrollable').append('<tr><td>' + ps(key) + '</td><td>' + ps(value.holder) + '</td><td>' + pd(value.checked_out) + '</td><td>' + pd(value.due) + '</td></tr>');
  });

}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});

$('#add').click(function () {
  bootbox.prompt('What is the name of the booklet you wish to add?', function (name) {
    if (name === null) {
      //dismissed
    } else {
      firebase.child(name.capitalize().trim()).once('value', function(snap){
        if (snap == null) {
          var copy = bootbox.confirm('Book already exists in the app! Add another book copy?', function(res){
            if (res) {
              firebase.child(name.capitalize().trim() + ' 2').set({holder: 'empty', due: 'empty', checked_out: 'empty'});
              window.location.replace('./index.html');
            }
          });
        } else {
          firebase.child(name.capitalize().trim()).set({holder: 'empty', due: 'empty', checked_out: 'empty'});
          window.location.replace('./index.html');
        }
      });

    }
  })
});

$('#set').click(function () {
  bootbox.prompt('What is the name of the book you will modify?', function (book) {
    if (book != null) {
      book = book.capitalize().trim();
      bootbox.dialog({
        message: 'What would you like to change ' + book + '\'s status to?',
        title: book + '\'s status',
        buttons: {
          checked_out: {
            label: 'Checked out to:',
            className: 'btn-info',
            callback: function() {
              bootbox.prompt('Who will ' + book + ' be checked out to? (Note that phone reminders will not show for them)', function (holder) {
                var today = new Date();
                var due_by = new Date(today.getFullYear(),today.getMonth(),today.getDate()+21); //due in 21 days (3 weeks)
                firebase.child(book).set({holder: holder.trim(), checked_out: today.toString(), due: due_by.toString()});
                bootbox.alert('Done! The ' + book + ' booklet has been checked out to ' + holder.trim(), function () {
                  window.location.replace('./index.html');
                });
              });
            }
          },
          returned: {
            label: 'Returned',
            className: 'btn-info',
            callback: function() {
              firebase.child(book).set({holder: 'empty', due: 'empty', checked_out: 'empty'});
              bootbox.alert('Done! The ' + book + ' booklet has been returned!', function () {
                window.location.replace('./index.html');
              });
            }
          }
        }
      });
    }
  });
});

$('#remove').click(function () {
  bootbox.prompt('Type the name of the book you wish to remove:', function (name) {
    if (name === null) {
      //dismissed
    } else {
      name = name.capitalize().trim();
      bootbox.confirm('Do you really want to remove ' + name + '?', function (res) {
        if (res == true) {
          firebase.child(name.capitalize().trim()).remove();
          window.location.replace('./index.html');
        }
      });
    }
  });
});
