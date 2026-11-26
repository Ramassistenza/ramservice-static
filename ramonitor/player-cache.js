(function () {
  "use strict";

  var BUCKET = "ramonitor-images";
  var STORAGE = "https://storage.googleapis.com/";
  var RETRY_MS = 5 * 60 * 1000;
  var objectUrls = window.URL || window.webkitURL;

  function openCache(done) {
    var completed = false;
    function finish(db) {
      if (completed) {
        if (db) db.close();
        return;
      }
      completed = true;
      window.clearTimeout(timer);
      done(db);
    }
    var timer = window.setTimeout(function () { finish(null); }, 1500);
    try {
      var request = window.indexedDB.open("ramonitor-media", 1);
      request.onupgradeneeded = function () {
        request.result.createObjectStore("images");
      };
      request.onsuccess = function () { finish(request.result); };
      request.onerror = request.onblocked = function () { finish(null); };
    } catch (_) {
      finish(null);
    }
  }

  function request(url, responseType, done) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      if (responseType) xhr.responseType = responseType;
      xhr.timeout = 10000;
      xhr.onload = function () {
        done(xhr.status === 200 ? (responseType ? xhr.response : xhr.responseText) : null);
      };
      xhr.onerror = xhr.ontimeout = xhr.onabort = function () { done(null); };
      xhr.send();
    } catch (_) {
      done(null);
    }
  }

  function parsePlaylist(text) {
    try {
      var list = JSON.parse(text);
      if (!Array.isArray(list) || list.some(function (name) {
        return typeof name !== "string" || !name || /[\\/\u0000-\u001f]/.test(name);
      })) return null;
      return list.filter(function (name, position) { return list.indexOf(name) === position; });
    } catch (_) {
      return null;
    }
  }

  function waitForImage(image, src, done) {
    var timer = window.setTimeout(function () { finish(false); }, 10000);
    function finish(ok) {
      window.clearTimeout(timer);
      image.onload = image.onerror = null;
      done(ok);
    }
    image.alt = "";
    image.onload = function () { finish(true); };
    image.onerror = function () { finish(false); };
    image.src = src;
  }

  window.startRAMonitor = function (options) {
    var prefix = "img/" + options.orientation + "/";
    var playlistKey = "ramonitor-playlist-" + options.orientation;
    var assets = Object.create(null);
    var playlist = [];
    var displayedName;
    var releaseDisplayed;
    var index = 0;
    var db;
    var busy = false;
    var refreshing = false;
    var canUseBlob = objectUrls && typeof objectUrls.createObjectURL === "function";

    function persist(mode, action) {
      if (!db) return false;
      try {
        action(db.transaction("images", mode).objectStore("images"));
        return true;
      } catch (_) {
        return false;
      }
    }

    function download(name, done) {
      var fallback = STORAGE + BUCKET + "/" + prefix + encodeURIComponent(name);
      function direct() {
        if (navigator.onLine === false) return done(null);
        var image = new Image();
        waitForImage(image, fallback, function (ok) {
          done(ok ? { image: image } : null);
        });
      }
      if (!canUseBlob) return direct();
      if (navigator.onLine === false) return done(null);
      var url = STORAGE + "storage/v1/b/" + BUCKET + "/o/" +
        encodeURIComponent(prefix + name) + "?alt=media";
      request(url, "blob", function (blob) {
        if (!blob || !blob.size || !/^image\//i.test(blob.type)) return direct();
        done({ blob: blob, fresh: true });
      });
    }

    function load(name, done) {
      var cached = assets[name];
      if (cached && cached.asset) return done(cached.asset);
      if (cached && Date.now() < cached.retryAt) return done(null);
      if (!persist("readonly", function (store) {
        var lookup = store.get(prefix + name);
        lookup.onsuccess = function () {
          if (lookup.result && lookup.result.size) done({ blob: lookup.result });
          else download(name, done);
        };
        lookup.onerror = function () { download(name, done); };
      })) download(name, done);
    }

    function showNext() {
      if (busy || !playlist.length) return;
      var name = playlist[index % playlist.length];
      index = (index + 1) % playlist.length;
      if (name === displayedName) return;
      busy = true;
      load(name, function (asset) {
        function show(image, release) {
          busy = false;
          if (playlist.indexOf(name) === -1) {
            if (release) release();
            return;
          }
          if (!image) {
            assets[name] = { retryAt: Date.now() + RETRY_MS };
            return;
          }
          if (asset.fresh) {
            persist("readwrite", function (store) { store.put(asset.blob, prefix + name); });
            asset.fresh = false;
          }
          assets[name] = { asset: asset };
          options.render(image);
          if (releaseDisplayed) window.setTimeout(releaseDisplayed, 750);
          releaseDisplayed = release;
          displayedName = name;
        }
        if (!asset) return show(null);
        if (asset.image) return show(asset.image);
        var localUrl;
        try {
          localUrl = objectUrls.createObjectURL(asset.blob);
        } catch (_) {
          return show(null);
        }
        function release() { objectUrls.revokeObjectURL(localUrl); }
        var image = new Image();
        waitForImage(image, localUrl, function (ok) {
          if (ok) return show(image, release);
          release();
          persist("readwrite", function (store) { store.delete(prefix + name); });
          show(null);
        });
      });
    }

    function refresh() {
      if (refreshing || navigator.onLine === false) return;
      refreshing = true;
      request(options.manifest + "?t=" + Date.now(), "", function (text) {
        refreshing = false;
        var updated = parsePlaylist(text);
        if (!updated || (!updated.length && options.keepOnEmpty)) return;
        if (JSON.stringify(updated) === JSON.stringify(playlist)) return;
        var previous = playlist;
        playlist = updated;
        index = 0;
        try { window.localStorage.setItem(playlistKey, JSON.stringify(updated)); } catch (_) {}
        previous.forEach(function (name) {
          if (updated.indexOf(name) !== -1) return;
          delete assets[name];
          persist("readwrite", function (store) { store.delete(prefix + name); });
        });
        if (!playlist.length) {
          options.clear();
          displayedName = null;
          if (releaseDisplayed) releaseDisplayed();
          releaseDisplayed = null;
        }
        showNext();
      });
    }

    openCache(function (connection) {
      db = connection;
      try { playlist = parsePlaylist(window.localStorage.getItem(playlistKey)) || []; } catch (_) {}
      showNext();
      refresh();
      window.setInterval(showNext, 7000);
      window.setInterval(refresh, options.refreshMs);
      window.addEventListener("online", function () {
        Object.keys(assets).forEach(function (name) {
          if (!assets[name].asset) delete assets[name];
        });
        refresh();
        showNext();
      });
    });
  };
}());
