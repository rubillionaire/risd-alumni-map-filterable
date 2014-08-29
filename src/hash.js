module.exports = function Hash () {

    var map;
    var lastHash;
    var isListening = false;
    var movingMap = false;
    var changeDefer = 100;
    var changeTimeout = null;
    var hashChangeInterval = null;
    var selection_input;

    function self (m) {
        if (m) {
            map = m;
            self.init();
        }
    }

    self.init = function () {
        lastHash = null;
        self.initializeMapAndInput();
        if (!isListening) {
            startListening();
        }
        return self;
    };

    self.input = function(x) {
        if (!arguments.length) return selection_input;
        selection_input = x;
        return self;
    };

    self.removeFrom = function (m) {
        if (changeTimeout) {
            clearTimeout(changeTimeout);
        }
        if (isListening) {
            stopListening();
        }
        map = null;
        return self;
    };

    self.initializeMapAndInput = function () {
        if (movingMap) return false;

        var hash = self.parseHash(location.hash);
        if (hash) {
            selection_input.property('value', deslugify(hash.query));
            lastHash = self.formatHash(map);
        }
        return self;
    };

    self.onMapMove = function () {
        if (movingMap || !map._loaded) {
            return false;
        }

        var hash = self.formatHash(map);
        if (lastHash != hash) {
            location.replace(hash);
            lastHash = hash;
        }
        return self;
    };

    self.onInputChange = function () {
        var hash = self.formatHash(map);
        if (lastHash != hash) {
            location.replace(hash);
            lastHash = hash;
        }
        return self;
    };

    self.update = function () {
        var hash = location.hash;
        if (hash === lastHash) {
            return;
        }
        var parsed = self.parseHash(hash);
        if (parsed) {
            movingMap = true;
            map.setView(parsed.center, parsed.zoom);
            movingMap = false;
        } else {
            self.onMapMove(map);
            
        }
        return self;
    };

    self.onHashChange = function () {
        if (!changeTimeout) {
            changeTimeout = setTimeout(function () {
                self.update();
                changeTimeout = null;
            }, changeDefer);
        }
        return self;
    };

    self.parseHash = function (hash) {
        if (hash.indexOf('#') === 0) {
            hash = hash.substr(1);
        }
        var args = hash.split("/");
        if (args.length  === 3 | args.length === 4) {
            var zoom = parseInt(args[0], 10);
            var lat = parseFloat(args[1]);
            var lon = parseFloat(args[2]);
            var query = "";
            if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
                return false;
            }
            if (args.length === 4) {
                query = deslugify(args[3]);
                return {
                    center: new L.LatLng(lat, lon),
                    zoom: zoom,
                    query: query
                };
            } else {
                return {
                    center: new L.LatLng(lat, lon),
                    zoom: zoom,
                    query: query
                };
            }
        } else {
            return false;
        }
    };
    self.formatHash = function (map) {
        var center = map.getCenter();
        var zoom = map.getZoom();
        var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        var query = slugify(selection_input.property('value'));
        return "#" + [zoom,
            center.lat.toFixed(precision),
            center.lng.toFixed(precision),
            query].join("/");
    };

    function startListening () {
        map.on("moveend", self.onMapMove, self);
        selection_input.on('keyup.hash', self.onInputChange);
        window.onhashchange = self.onHashChange;
        isListening = true;
    }
    function stopListening () {
        map.off("moveend", self.onMapMove, self);
        window.onhashchange = null;
        selection_input.on('keyup.hash', null);
        isListening = false;
    }

    function slugify (str) {
        return str.replace(/ /g, "-").replace(/\//g, "--");
    }
    function deslugify (slug) {
        return slug.replace(/--/g, "/").replace(/-/g, " ");
    }

    return self;
};