if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB, which is required for most functions of this website. For the best support, please use the latest version of Chrome, Firefox, or Safari.");
}

else {
  //CAUTION: ALWAYS UPDATE recipeDB.js FIRST
  var dbVer = 3; //IDB Version (int only)
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
      loadModule();
    }
  };

  openRequest.onerror = function(e) {
    console.log('Initial Open Request ERROR');
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
      console.log("Database version mismatch; JSON version is newer than JS version. An update may be in progress. This error should self-correct.");
    }
    else if (recipeDBver != dbVer) {
      alert("Database version mismatch detected. Your database may be corrupted or outdated. This can be corrected by clearing your browser's cache for this website.\nIf this message persists after clearing your cache, it's likely an issue on our end. Please contact Feril#6555 on Discord.");
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
      console.dir(e);
    };


    function clearData() {

      var db = openRequest.result;

      var transaction = db.transaction(["novels"], "readwrite");

      var objectStore = transaction.objectStore("novels");

      var objectStoreRequest = objectStore.clear();

      objectStoreRequest.onerror = function(e) {
        console.log('Error clearing data. ', e.target.error.name);
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
        console.dir(e);
      };
      request.onsuccess = function(e) {
        console.log('Item added: ' + curItem.name);
      };
    }

  }

}



/*
var request = window.indexedDB.open('databaseTest', 1);

request.onerror = function (event) {
  console.log('An IDB error occurred.');
  console.log(event);
};

var db;

request.onsuccess = function (event) {
  db = request.result;

  console.log('IDB successfully opened.');
  console.log(db);
};

request.onupgradeneeded = function (event) {
  db = event.target.result;
  console.log(">>DB RESULT");
  console.log(db);

  db.onerror = function(event) {
     console.log("IDB error");
     console.log(event);
     return;
  };
  db.onsuccess = function(event) {
     console.log(">>IDB SUCCESS");
     console.log(event);
  };

  var objectStore;
  if (!db.objectStoreNames.contains('drink')) {
    objectStore = db.createObjectStore('drink', {keyPath: 'id', autoIncrement: true});
    objectStore.createIndex('name', 'name', { unique: true });
    objectStore.createIndex('type', 'type', { unique: false });
    objectStore.createIndex('tags', 'tags', { unique: false });
  }
}


function add() {
  var request = db.transaction(['drink'], 'readwrite')
    .objectStore('drink')
    .add({ id: 1, name: 'Pumpkin Spice', type: 'hot', tags: 'test' });

  request.onsuccess = function (event) {
    console.log('IDB data written successfully.');
  };

  request.onerror = function (event) {
    console.log('IDB data failed to write.');
  }
}


function read() {
   var transaction = db.transaction(['drink']);
   var objectStore = transaction.objectStore('drink');
   var request = objectStore.get(1);

   request.onerror = function(event) {
     console.log('Transaction failed');
   };

   request.onsuccess = function( event) {
      if (request.result) {
        console.log('Drink: ' + request.result.drink);
        console.log('Type: ' + request.result.type);
        console.log('Tags: ' + request.result.tags);
      } else {
        console.log('No data record');
      }
   };
}
*/
