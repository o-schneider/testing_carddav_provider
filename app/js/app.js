/* global DAVLib */

'use strict';

function App() {
  console.log("Starting app");
  var self = this;

  var info = document.getElementById('info');
  var fillButton = document.getElementById('import');
  var dialog = document.getElementById('importing-screen');
  var progress = document.getElementById('progress');

  fillButton.addEventListener('click', function() {
    console.log("clicked !");
    self.importContacts();
  });

  self.reset = function() {
    var q = confirm("Remove ALL the contacts from ? Be careful!!! There is no way back!");
    if (q) {
      var req = navigator.mozContacts.clear();
      req.onsuccess = function () {
        alert('All contacts have been removed.');
      };
      req.onerror = function () {
        alert('[error] No contacts were removed.');
      };
    }
  };

  self.importContacts = function() {
    console.log('Importing');
    var accountData = {
      url: document.getElementById('url').value,
      user: document.getElementById('user').value,
      password: document.getElementById('passwd').value
    };

    //fillButton.disabled = true;

    var openedDAVConnection = jsDAVlib.getConnection(accountData);

    openedDAVConnection.onready = function () {
      console.log('connectionInfo: ' +
      JSON.stringify(openedDAVConnection.getInfo()));

      openedDAVConnection.getResource(null, function (res, error) {
        if (error) {
          console.log('Error getting main resource - ' + error);
          return;
        }

        dialog.style.display = "block";

        var contactsList = res.get().data;
        var progressStatus = document.getElementById('progress-status');
        var contactsNb = contactsList.length;
        var contactsDone = 0;

        progress.max = contactsNb;
        progress.value = contactsDone;
        progressStatus.innerHTML = String(contactsDone)+"/"+String(contactsNb);
        progress.style.display = "block";

        for (var i = 0; i < contactsNb; i++) {
          openedDAVConnection.getResource(contactsList[i].href, function (res, e) {
            var vcard = res.contents.split('\r\n');
            var contact = new mozContact();
            for (var j = 0; j < vcard.length; j++) {
              if (/^N:/.test(vcard[j])) {
                var name = vcard[j].split(':')[1].split(';');
                contact.familyName = [name[0]];
                contact.givenName = [name[1]];
                contact.additionalName = [name[2]];
                contact.honorificPrefix = [name[3]];
                contact.honorificSuffix = [name[4]];
              } else if (/^FN:/.test(vcard[j])) {
                var name = vcard[j].split(':');
                contact.name = [name[1]];
              } else if (/^TEL;/.test(vcard[j])) {
                var allTel = vcard[j].split(';');
                var tel = allTel[1].split(':');
                contact.tel = [{
                  type: [tel[0].split('=')[1]],
                  value: tel[1]
                }];
              }
            }

            var saving = navigator.mozContacts.save(contact);
            saving.onsuccess = function () {
              contactsDone += 1;
              progressStatus.innerHTML = String(contactsDone)+"/"+String(contactsNb);
              progress.value = contactsDone;
              if(contactsDone === contactsNb) {
                dialog.style.display = "none";
                var status = document.getElementById("import-done");
                status.classList.add("show");
                setTimeout(function() {
                  status.classList.remove("show");
                }, 5000);
              }

              console.log('new contact saved');
            };
            saving.onerror = function (err) {
              console.error(err);
            };
          });
        }
      });
    };
  };

  console.log("App ready");
}

var app = new App();