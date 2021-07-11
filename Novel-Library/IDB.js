var dbErrorText = "";

if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB, which is required for most functions of this website. For the best support, please use the latest version of Chrome, Firefox, or Safari.");
}

else {
  //CAUTION: ALWAYS UPDATE recipeDB.js FIRST
  var dbVer = 4; //IDB Version (int only)
  var recipeObject; //instantiate global variable for module object import
  var recipeArray = []; //instantiate global array for module import
  var recipeDBver; //instantiate global variable for actual database version (TODO: implement version checking)
  var upgradeNeeded = false;
  var clearNeeded = false;

  var openRequest = indexedDB.open('itemDatabase'); //Open the IDB without updating
  console.log(openRequest);
  var initGlobalDB;

  setTimeout(requestTimeout, 2500);
  function requestTimeout() {
    //var db = openRequest.result;
    //db.close(); //Force request to close to prevent jamming.
    //console.log("IDB request closed; timeout reached.")
    if (clearNeeded == true) {

    }
  }

  console.log("IDB.js running");

  openRequest.onsuccess = function(e) {
    console.log('Running initial onSuccess');
    initGlobalDB = openRequest.result;

    console.log(openRequest);
    console.log(initGlobalDB.version);

    if (initGlobalDB.version == "" || initGlobalDB.version < dbVer) {
      dbErrorText += "Updating Database, please wait...<br>";
      loadModule();
      setTimeout(function() { location.reload(); }, 3000);
    }
  };

  openRequest.onerror = function(e) {
    console.log('Initial Open Request ERROR');
    dbErrorText += "IDB Open Request failed.<br>";
    console.dir(e);
  };


  async function loadModule() {

    var importObject = await import("/Novel-Library/itemDB.js");

    //TODO: remove debugging
    console.log('Module loaded');
    console.log(importObject);
    recipeObject = importObject.default;
    console.log(recipeObject);
    recipeDBver = recipeObject.recipeDBver;
    console.log(recipeDBver);
    if (recipeDBver < dbVer) {
      dbErrorText += "Database version mismatch; JSON version is newer than JS version. An update may be in progress. This error should self-correct soon.<br>";
    }
    else if (recipeDBver != dbVer) {
      dbErrorText += "Database version mismatch detected. Your database may be corrupted or outdated. This can be corrected by clearing your browser's cache for this website. If this message persists after clearing your cache, it's likely an issue on our end. Please contact Feril#6555 on Discord.";
    }
    recipeArray = recipeObject.recipeArray;
    console.log(recipeArray);

    upgradeNeeded = true;
    initGlobalDB.close();

    modifyIDB();
  }

  function modifyIDB() {

    var openRequest = indexedDB.open('itemDatabase', dbVer);

    openRequest.onupgradeneeded = function(e) {
      var db = e.target.result;

      console.log('Running onUpgradeNeeded');

      db.onerror = function(errorEvent) {
        console.log("onUpgradeNeeded ERROR");
        return;
      };


      if (!db.objectStoreNames.contains('novels')) {
        var storeOS = db.createObjectStore('novels', {keyPath: 'id'});
        storeOS.createIndex('name', 'name', { unique: false });
        storeOS.createIndex('type', 'type', { unique: false });
        storeOS.createIndex('subtype', 'subtype', { unique: false });
        storeOS.createIndex('tags', 'tags', { unique: false });
      }
      else {
        clearNeeded = true;
      }

    };

    openRequest.onsuccess = function(e) {
      console.log('Running onSuccess 2');

      console.log('IDB Upgrade Needed: ' + upgradeNeeded);
      console.log('IDB Clear Needed: ' + clearNeeded);
      db = e.target.result;
      if (clearNeeded == true) {
        clearData();
      }
      else if (upgradeNeeded == true) {
        for (var i = 0; i < recipeArray.length; i++) {
          addItem(recipeArray[i]);
        }
      }

    };

    openRequest.onerror = function(e) {
      console.log('Open Request 2 ERROR');
      dbErrorText += "IDB Open Request 2 Failed.<br>";
      console.dir(e);
    };


    function clearData() {

      var db = openRequest.result;

      var transaction = db.transaction(["novels"], "readwrite");

      var objectStore = transaction.objectStore("novels");

      var objectStoreRequest = objectStore.clear();

      objectStoreRequest.onerror = function(e) {
        console.log('Error clearing data. ', e.target.error.name);
        dbErrorText += "Error clearing data from IDB.<br>";
        console.dir(e);
      };

      objectStoreRequest.onsuccess = function(e) {
        console.log('Data cleared successfully.')
        for (var i = 0; i < recipeArray.length; i++) {
          addItem(recipeArray[i]);
        }
      };

    }

    function addItem(curItem) {
      var db = openRequest.result;
      var transaction = db.transaction(['novels'], 'readwrite');
      var store = transaction.objectStore('novels');
      var item = curItem;

      var request = store.add(item);

      request.onerror = function(e) {
        console.log('Error', e.target.error.name);
        dbErrorText += "An error occurred while updating your IDB. Your database may be corrupted. Please clear your cache and reload. If this problem persists, contact Feril#6555 on Discord.";
        console.dir(e);
      };
      request.onsuccess = function(e) {
        console.log('Item added: ' + curItem.name);
      };
    }

  }

}
