/* global DAVLib */

'use strict';

var App = function App() {

  var store = null;
  var info = null;
  var fillButton, resetButton;

  var init = function init() {
    info = document.getElementById('info');
    fillButton = document.getElementById('fillDS');
    resetButton = document.getElementById('resetDS');

    fillButton.addEventListener('click', handleEvent);
    resetButton.addEventListener('click', handleEvent);
  };

  function handleEvent(evt) {
    var btn = evt.target.id;
    var accountData = {
      url: document.getElementById('url').value,
      user: document.getElementById('user').value,
      password: document.getElementById('passwd').value
    };

    switch (btn) {
      case 'fillDS':
        fillButton.disabled = true;

        var openedDAVConnection = jsDAVlib.getConnection(accountData);
        openedDAVConnection.onready = function() {
          console.log('connectionInfo: ' +
            JSON.stringify(openedDAVConnection.getInfo()));

          openedDAVConnection.getResource(null, function(res, error) {
            if (error) {
              console.log('Error getting main resource - ' + error);
              return;
            }

            var openedDAVMainResource = res;

            var contactsList = openedDAVMainResource.get().data;
            var contactsResource = [];
            for (var i = 0; i < contactsList.length; i++) {
              openedDAVConnection.getResource(contactsList[i].href, function(res, e) {
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
                saving.onsuccess = function() {
                  console.log('new contact saved');
                };
                saving.onerror = function(err) {
                  console.error(err);
                };
              });
            }
          });
        };

        break;
      case 'resetDS':
        var q = confirm("Remove ALL the contacts from ? Be careful!!! There is no way back!");
        if (q) {
          var req = navigator.mozContacts.clear();
          req.onsuccess = function() {
            alert('All contacts have been removed.');
          };
          req.onerror = function() {
            alert('[error] No contacts were removed.');
          };
        }
        break;
      default:
        break;
    }
  }

  function initDS() {
    function storeError() {
      info.textContent = 'Error getting store';
    }

    if (!navigator.getDataStores) {
      info.textContent = 'NO DataStore API!';
      return;
    }

    navigator.getDataStores(DS_NAME).then(function(ds) {
      if (!ds || ds.length < 1) {
        storeError();
        return;
      }
      ds.forEach(function onDs(datastore) {
        if (datastore.owner.indexOf('provider3')) {
          store = datastore;
          console.log('Got store ' + store.owner);
        }
      });

      store.getLength().then(function(count) {
        info.textContent = count + ' elements';
      });
    }, function() {
      storeError();
    });
  }

  return {
    init: init
  };

}();

App.init();
