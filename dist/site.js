(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/bindPopup.js":[function(require,module,exports){
var build_div = d3.select('body')
    .append('div')
    .style('display', 'none');

module.exports = function bindPopup (layer) {
    var keys_to_not_include =['id',
        'marker-color',
        'marker-size',
        'marker-symbol'];

    var all_keys = Object.keys(layer.feature.properties);
    var popup_content_data = [];

    all_keys.forEach(function (k) {
        if (keys_to_not_include.indexOf(k) === -1) {
            popup_content_data.push({
                label: k,
                value: layer.feature.properties[k]
            });
        }
    });

    build_div.html('');
    build_div.selectAll('.metadata')
        .data(popup_content_data)
        .enter()
        .append('div')
        .attr('class', 'metadata')
        .call(popup_structure);

    var content = build_div.html();

    layer.bindPopup(content);

    function popup_structure (sel) {
        sel.append('p')
            .attr('class', 'metadata-label')
            .html(function (d) {
                return toTitleCase(d.label);
            });
        sel.append('p')
            .attr('class', 'metadata-value')
            .html(function (d) {
                return d.value;
            });
    }
};

function toTitleCase(str) {
    return str.replace(/\w\S*/g,
        function(txt){
            return txt.charAt(0)
                      .toUpperCase() +
                   txt.substr(1).toLowerCase();
        });
}
},{}],"/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/filter.js":[function(require,module,exports){
var bindPopup = require('./bindPopup');

module.exports = function Filter () {
    var selection_input;
    var filter_string;
    var featureLayer;
    var feature_count = 0;

    var changeDefer = 100;
    var changeTimeout = null;

    var self = function () {
        if (!changeTimeout) {
            changeTimeout = setTimeout(function () {
                self.dispatch.filterStartCount(feature_count);
                feature_count = 0;

                filter_string = selection_input.property('value').toLowerCase();
                featureLayer.setFilter(show_title_industry);
                featureLayer.eachLayer(bindPopup);

                self.dispatch.filterEndCount(feature_count);

                changeTimeout = null;
            }, changeDefer);
        }
    };

    self.dispatch = d3.dispatch('filterStartCount', 'filterEndCount');

    self.input = function (x) {
        if (!arguments.length) return selection_input;
        selection_input = x;
        selection_input.on('keyup.filter', self);
        return self;
    };
    self.featureLayer = function (x) {
        if (!arguments.length) return featureLayer;
        featureLayer = x;
        return self;
    };

    function show_title_industry(feature) {
        var bool = false;

        try {
            if ('Industry sector' in feature.properties &
                feature.properties['Industry sector']
                    .toLowerCase()
                    .indexOf(filter_string) !== -1) {
                bool = true;
                feature_count += 1;
                return bool;
            }
            if ("title" in feature.properties &
                feature.properties.title
                    .toLowerCase()
                    .indexOf(filter_string) !== -1) {
                bool = true;
                feature_count += 1;
                return bool;
            }
        } catch (error) {
            // Property to filter does not exist. And thats fine. Return false;
        }

        return bool;
    }

    return self;
};
},{"./bindPopup":"/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/bindPopup.js"}],"/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/hash.js":[function(require,module,exports){
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
    };

    self.initializeMapAndInput = function () {
        if (movingMap) return false;

        var hash = self.parseHash(location.hash);
        selection_input.property('value', deslugify(hash.query));
        lastHash = self.formatHash(map);
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
    };

    self.onInputChange = function () {
        var hash = self.formatHash(map);
        if (lastHash != hash) {
            location.replace(hash);
            lastHash = hash;
        }
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
    };

    self.onHashChange = function () {
        if (!changeTimeout) {
            changeTimeout = setTimeout(function () {
                self.update();
                changeTimeout = null;
            }, changeDefer);
        }
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
        return str.replace(/ /g, "-");
    }
    function deslugify (slug) {
        return slug.replace(/-/g, " ");
    }

    return self;
};
},{}],"/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/index.js":[function(require,module,exports){
var api_url = 'https://api.github.com/gists/';
var gist_id = '87c31d2a43a704b4c443';

L.mapbox.accessToken =
    "pk.eyJ1IjoiY29tbXVuaXR5LXJpc2QiLCJhIjoiUm" +
    "9wa25IRSJ9.cE0tYhyS-mr3Df3oyW11vQ";


var Filter = require('./filter.js');
var Hash = require('./hash.js')();

var map = L.mapbox.map('map', 'community-risd.i87e2i5o')
    .setView([41.796, -71.801], 8);

// hash setting/watching based on
// the map movement, and keyup
// on the input selection
Hash.input(d3.select('#filter-map-input'))(map);

d3.json(api_url + gist_id, function (gist) {
    var geojson = JSON.parse(gist.files['map.geojson'].content);

    var alumni = L.mapbox
        .featureLayer(geojson);

    alumni.addTo(map);

    // filter
    var el_filter_results_output = document.getElementById('results-output');
    var filter = Filter().input(d3.select('#filter-map-input')).featureLayer(alumni);

    filter.dispatch.on('filterEndCount', function (count) {
        if (count === 0) {
            el_filter_results_output.innerHTML = " No businesses.";
        } else if (count === 1) {
            el_filter_results_output.innerHTML = " 1 business.";
        } else {
            el_filter_results_output.innerHTML = count + " businesses.";
        }
    });

    // initial filter
    filter();

    // zoom to extents
    var el_results_row = document.getElementById('results-row');
    el_results_row.onclick = function () {
        map.fitBounds(alumni.getBounds());
    };

});

// interaction with input
var el_filter_row = d3.select('#filter-row');
var el_input = document.getElementById('filter-map-input');
el_input.onfocus = function () {
    el_filter_row.classed('active', true);
};
el_input.onblur = function () {
    el_filter_row.classed('active', false);
};
},{"./filter.js":"/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/filter.js","./hash.js":"/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/hash.js"}]},{},["/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ydWJlbnJvZHJpZ3Vlei9Eb2N1bWVudHMvY29tbWlzaW9ucy9yaXNkX21lZGlhL3Jpc2QtYWx1bW5pLW1hcC1maWx0ZXJhYmxlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcnViZW5yb2RyaWd1ZXovRG9jdW1lbnRzL2NvbW1pc2lvbnMvcmlzZF9tZWRpYS9yaXNkLWFsdW1uaS1tYXAtZmlsdGVyYWJsZS9zcmMvYmluZFBvcHVwLmpzIiwiL1VzZXJzL3J1YmVucm9kcmlndWV6L0RvY3VtZW50cy9jb21taXNpb25zL3Jpc2RfbWVkaWEvcmlzZC1hbHVtbmktbWFwLWZpbHRlcmFibGUvc3JjL2ZpbHRlci5qcyIsIi9Vc2Vycy9ydWJlbnJvZHJpZ3Vlei9Eb2N1bWVudHMvY29tbWlzaW9ucy9yaXNkX21lZGlhL3Jpc2QtYWx1bW5pLW1hcC1maWx0ZXJhYmxlL3NyYy9oYXNoLmpzIiwiL1VzZXJzL3J1YmVucm9kcmlndWV6L0RvY3VtZW50cy9jb21taXNpb25zL3Jpc2RfbWVkaWEvcmlzZC1hbHVtbmktbWFwLWZpbHRlcmFibGUvc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYnVpbGRfZGl2ID0gZDMuc2VsZWN0KCdib2R5JylcbiAgICAuYXBwZW5kKCdkaXYnKVxuICAgIC5zdHlsZSgnZGlzcGxheScsICdub25lJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmluZFBvcHVwIChsYXllcikge1xuICAgIHZhciBrZXlzX3RvX25vdF9pbmNsdWRlID1bJ2lkJyxcbiAgICAgICAgJ21hcmtlci1jb2xvcicsXG4gICAgICAgICdtYXJrZXItc2l6ZScsXG4gICAgICAgICdtYXJrZXItc3ltYm9sJ107XG5cbiAgICB2YXIgYWxsX2tleXMgPSBPYmplY3Qua2V5cyhsYXllci5mZWF0dXJlLnByb3BlcnRpZXMpO1xuICAgIHZhciBwb3B1cF9jb250ZW50X2RhdGEgPSBbXTtcblxuICAgIGFsbF9rZXlzLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgICAgaWYgKGtleXNfdG9fbm90X2luY2x1ZGUuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHBvcHVwX2NvbnRlbnRfZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICBsYWJlbDogayxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbGF5ZXIuZmVhdHVyZS5wcm9wZXJ0aWVzW2tdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgYnVpbGRfZGl2Lmh0bWwoJycpO1xuICAgIGJ1aWxkX2Rpdi5zZWxlY3RBbGwoJy5tZXRhZGF0YScpXG4gICAgICAgIC5kYXRhKHBvcHVwX2NvbnRlbnRfZGF0YSlcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldGFkYXRhJylcbiAgICAgICAgLmNhbGwocG9wdXBfc3RydWN0dXJlKTtcblxuICAgIHZhciBjb250ZW50ID0gYnVpbGRfZGl2Lmh0bWwoKTtcblxuICAgIGxheWVyLmJpbmRQb3B1cChjb250ZW50KTtcblxuICAgIGZ1bmN0aW9uIHBvcHVwX3N0cnVjdHVyZSAoc2VsKSB7XG4gICAgICAgIHNlbC5hcHBlbmQoJ3AnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldGFkYXRhLWxhYmVsJylcbiAgICAgICAgICAgIC5odG1sKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvVGl0bGVDYXNlKGQubGFiZWwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHNlbC5hcHBlbmQoJ3AnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldGFkYXRhLXZhbHVlJylcbiAgICAgICAgICAgIC5odG1sKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQudmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiB0b1RpdGxlQ2FzZShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcd1xcUyovZyxcbiAgICAgICAgZnVuY3Rpb24odHh0KXtcbiAgICAgICAgICAgIHJldHVybiB0eHQuY2hhckF0KDApXG4gICAgICAgICAgICAgICAgICAgICAgLnRvVXBwZXJDYXNlKCkgK1xuICAgICAgICAgICAgICAgICAgIHR4dC5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSk7XG59IiwidmFyIGJpbmRQb3B1cCA9IHJlcXVpcmUoJy4vYmluZFBvcHVwJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRmlsdGVyICgpIHtcbiAgICB2YXIgc2VsZWN0aW9uX2lucHV0O1xuICAgIHZhciBmaWx0ZXJfc3RyaW5nO1xuICAgIHZhciBmZWF0dXJlTGF5ZXI7XG4gICAgdmFyIGZlYXR1cmVfY291bnQgPSAwO1xuXG4gICAgdmFyIGNoYW5nZURlZmVyID0gMTAwO1xuICAgIHZhciBjaGFuZ2VUaW1lb3V0ID0gbnVsbDtcblxuICAgIHZhciBzZWxmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWNoYW5nZVRpbWVvdXQpIHtcbiAgICAgICAgICAgIGNoYW5nZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmRpc3BhdGNoLmZpbHRlclN0YXJ0Q291bnQoZmVhdHVyZV9jb3VudCk7XG4gICAgICAgICAgICAgICAgZmVhdHVyZV9jb3VudCA9IDA7XG5cbiAgICAgICAgICAgICAgICBmaWx0ZXJfc3RyaW5nID0gc2VsZWN0aW9uX2lucHV0LnByb3BlcnR5KCd2YWx1ZScpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgZmVhdHVyZUxheWVyLnNldEZpbHRlcihzaG93X3RpdGxlX2luZHVzdHJ5KTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlTGF5ZXIuZWFjaExheWVyKGJpbmRQb3B1cCk7XG5cbiAgICAgICAgICAgICAgICBzZWxmLmRpc3BhdGNoLmZpbHRlckVuZENvdW50KGZlYXR1cmVfY291bnQpO1xuXG4gICAgICAgICAgICAgICAgY2hhbmdlVGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICB9LCBjaGFuZ2VEZWZlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5kaXNwYXRjaCA9IGQzLmRpc3BhdGNoKCdmaWx0ZXJTdGFydENvdW50JywgJ2ZpbHRlckVuZENvdW50Jyk7XG5cbiAgICBzZWxmLmlucHV0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2VsZWN0aW9uX2lucHV0O1xuICAgICAgICBzZWxlY3Rpb25faW5wdXQgPSB4O1xuICAgICAgICBzZWxlY3Rpb25faW5wdXQub24oJ2tleXVwLmZpbHRlcicsIHNlbGYpO1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICAgIHNlbGYuZmVhdHVyZUxheWVyID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZmVhdHVyZUxheWVyO1xuICAgICAgICBmZWF0dXJlTGF5ZXIgPSB4O1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc2hvd190aXRsZV9pbmR1c3RyeShmZWF0dXJlKSB7XG4gICAgICAgIHZhciBib29sID0gZmFsc2U7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICgnSW5kdXN0cnkgc2VjdG9yJyBpbiBmZWF0dXJlLnByb3BlcnRpZXMgJlxuICAgICAgICAgICAgICAgIGZlYXR1cmUucHJvcGVydGllc1snSW5kdXN0cnkgc2VjdG9yJ11cbiAgICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgLmluZGV4T2YoZmlsdGVyX3N0cmluZykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYm9vbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZmVhdHVyZV9jb3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHJldHVybiBib29sO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFwidGl0bGVcIiBpbiBmZWF0dXJlLnByb3BlcnRpZXMgJlxuICAgICAgICAgICAgICAgIGZlYXR1cmUucHJvcGVydGllcy50aXRsZVxuICAgICAgICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAuaW5kZXhPZihmaWx0ZXJfc3RyaW5nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBib29sID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlX2NvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBQcm9wZXJ0eSB0byBmaWx0ZXIgZG9lcyBub3QgZXhpc3QuIEFuZCB0aGF0cyBmaW5lLiBSZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYm9vbDtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZjtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBIYXNoICgpIHtcblxuICAgIHZhciBtYXA7XG4gICAgdmFyIGxhc3RIYXNoO1xuICAgIHZhciBpc0xpc3RlbmluZyA9IGZhbHNlO1xuICAgIHZhciBtb3ZpbmdNYXAgPSBmYWxzZTtcbiAgICB2YXIgY2hhbmdlRGVmZXIgPSAxMDA7XG4gICAgdmFyIGNoYW5nZVRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBoYXNoQ2hhbmdlSW50ZXJ2YWwgPSBudWxsO1xuICAgIHZhciBzZWxlY3Rpb25faW5wdXQ7XG5cbiAgICBmdW5jdGlvbiBzZWxmIChtKSB7XG4gICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgICBtYXAgPSBtO1xuICAgICAgICAgICAgc2VsZi5pbml0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZWxmLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxhc3RIYXNoID0gbnVsbDtcbiAgICAgICAgc2VsZi5pbml0aWFsaXplTWFwQW5kSW5wdXQoKTtcbiAgICAgICAgaWYgKCFpc0xpc3RlbmluZykge1xuICAgICAgICAgICAgc3RhcnRMaXN0ZW5pbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmlucHV0ID0gZnVuY3Rpb24oeCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzZWxlY3Rpb25faW5wdXQ7XG4gICAgICAgIHNlbGVjdGlvbl9pbnB1dCA9IHg7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG5cbiAgICBzZWxmLnJlbW92ZUZyb20gPSBmdW5jdGlvbiAobSkge1xuICAgICAgICBpZiAoY2hhbmdlVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGNoYW5nZVRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0xpc3RlbmluZykge1xuICAgICAgICAgICAgc3RvcExpc3RlbmluZygpO1xuICAgICAgICB9XG4gICAgICAgIG1hcCA9IG51bGw7XG4gICAgfTtcblxuICAgIHNlbGYuaW5pdGlhbGl6ZU1hcEFuZElucHV0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAobW92aW5nTWFwKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgdmFyIGhhc2ggPSBzZWxmLnBhcnNlSGFzaChsb2NhdGlvbi5oYXNoKTtcbiAgICAgICAgc2VsZWN0aW9uX2lucHV0LnByb3BlcnR5KCd2YWx1ZScsIGRlc2x1Z2lmeShoYXNoLnF1ZXJ5KSk7XG4gICAgICAgIGxhc3RIYXNoID0gc2VsZi5mb3JtYXRIYXNoKG1hcCk7XG4gICAgfTtcblxuICAgIHNlbGYub25NYXBNb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAobW92aW5nTWFwIHx8ICFtYXAuX2xvYWRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhc2ggPSBzZWxmLmZvcm1hdEhhc2gobWFwKTtcbiAgICAgICAgaWYgKGxhc3RIYXNoICE9IGhhc2gpIHtcbiAgICAgICAgICAgIGxvY2F0aW9uLnJlcGxhY2UoaGFzaCk7XG4gICAgICAgICAgICBsYXN0SGFzaCA9IGhhc2g7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5vbklucHV0Q2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaGFzaCA9IHNlbGYuZm9ybWF0SGFzaChtYXApO1xuICAgICAgICBpZiAobGFzdEhhc2ggIT0gaGFzaCkge1xuICAgICAgICAgICAgbG9jYXRpb24ucmVwbGFjZShoYXNoKTtcbiAgICAgICAgICAgIGxhc3RIYXNoID0gaGFzaDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGhhc2ggPSBsb2NhdGlvbi5oYXNoO1xuICAgICAgICBpZiAoaGFzaCA9PT0gbGFzdEhhc2gpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFyc2VkID0gc2VsZi5wYXJzZUhhc2goaGFzaCk7XG4gICAgICAgIGlmIChwYXJzZWQpIHtcbiAgICAgICAgICAgIG1vdmluZ01hcCA9IHRydWU7XG4gICAgICAgICAgICBtYXAuc2V0VmlldyhwYXJzZWQuY2VudGVyLCBwYXJzZWQuem9vbSk7XG4gICAgICAgICAgICBtb3ZpbmdNYXAgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYub25NYXBNb3ZlKG1hcCk7XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLm9uSGFzaENoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjaGFuZ2VUaW1lb3V0KSB7XG4gICAgICAgICAgICBjaGFuZ2VUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZi51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICBjaGFuZ2VUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIH0sIGNoYW5nZURlZmVyKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLnBhcnNlSGFzaCA9IGZ1bmN0aW9uIChoYXNoKSB7XG4gICAgICAgIGlmIChoYXNoLmluZGV4T2YoJyMnKSA9PT0gMCkge1xuICAgICAgICAgICAgaGFzaCA9IGhhc2guc3Vic3RyKDEpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhcmdzID0gaGFzaC5zcGxpdChcIi9cIik7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCAgPT09IDMgfCBhcmdzLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgdmFyIHpvb20gPSBwYXJzZUludChhcmdzWzBdLCAxMCk7XG4gICAgICAgICAgICB2YXIgbGF0ID0gcGFyc2VGbG9hdChhcmdzWzFdKTtcbiAgICAgICAgICAgIHZhciBsb24gPSBwYXJzZUZsb2F0KGFyZ3NbMl0pO1xuICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gXCJcIjtcbiAgICAgICAgICAgIGlmIChpc05hTih6b29tKSB8fCBpc05hTihsYXQpIHx8IGlzTmFOKGxvbikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgICAgICBxdWVyeSA9IGRlc2x1Z2lmeShhcmdzWzNdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjZW50ZXI6IG5ldyBMLkxhdExuZyhsYXQsIGxvbiksXG4gICAgICAgICAgICAgICAgICAgIHpvb206IHpvb20sXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbmV3IEwuTGF0TG5nKGxhdCwgbG9uKSxcbiAgICAgICAgICAgICAgICAgICAgem9vbTogem9vbSxcbiAgICAgICAgICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgc2VsZi5mb3JtYXRIYXNoID0gZnVuY3Rpb24gKG1hcCkge1xuICAgICAgICB2YXIgY2VudGVyID0gbWFwLmdldENlbnRlcigpO1xuICAgICAgICB2YXIgem9vbSA9IG1hcC5nZXRab29tKCk7XG4gICAgICAgIHZhciBwcmVjaXNpb24gPSBNYXRoLm1heCgwLCBNYXRoLmNlaWwoTWF0aC5sb2coem9vbSkgLyBNYXRoLkxOMikpO1xuICAgICAgICB2YXIgcXVlcnkgPSBzbHVnaWZ5KHNlbGVjdGlvbl9pbnB1dC5wcm9wZXJ0eSgndmFsdWUnKSk7XG4gICAgICAgIHJldHVybiBcIiNcIiArIFt6b29tLFxuICAgICAgICAgICAgY2VudGVyLmxhdC50b0ZpeGVkKHByZWNpc2lvbiksXG4gICAgICAgICAgICBjZW50ZXIubG5nLnRvRml4ZWQocHJlY2lzaW9uKSxcbiAgICAgICAgICAgIHF1ZXJ5XS5qb2luKFwiL1wiKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc3RhcnRMaXN0ZW5pbmcgKCkge1xuICAgICAgICBtYXAub24oXCJtb3ZlZW5kXCIsIHNlbGYub25NYXBNb3ZlLCBzZWxmKTtcbiAgICAgICAgc2VsZWN0aW9uX2lucHV0Lm9uKCdrZXl1cC5oYXNoJywgc2VsZi5vbklucHV0Q2hhbmdlKTtcbiAgICAgICAgd2luZG93Lm9uaGFzaGNoYW5nZSA9IHNlbGYub25IYXNoQ2hhbmdlO1xuICAgICAgICBpc0xpc3RlbmluZyA9IHRydWU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0b3BMaXN0ZW5pbmcgKCkge1xuICAgICAgICBtYXAub2ZmKFwibW92ZWVuZFwiLCBzZWxmLm9uTWFwTW92ZSwgc2VsZik7XG4gICAgICAgIHdpbmRvdy5vbmhhc2hjaGFuZ2UgPSBudWxsO1xuICAgICAgICBzZWxlY3Rpb25faW5wdXQub24oJ2tleXVwLmhhc2gnLCBudWxsKTtcbiAgICAgICAgaXNMaXN0ZW5pbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzbHVnaWZ5IChzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8gL2csIFwiLVwiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGVzbHVnaWZ5IChzbHVnKSB7XG4gICAgICAgIHJldHVybiBzbHVnLnJlcGxhY2UoLy0vZywgXCIgXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xufTsiLCJ2YXIgYXBpX3VybCA9ICdodHRwczovL2FwaS5naXRodWIuY29tL2dpc3RzLyc7XG52YXIgZ2lzdF9pZCA9ICc4N2MzMWQyYTQzYTcwNGI0YzQ0Myc7XG5cbkwubWFwYm94LmFjY2Vzc1Rva2VuID1cbiAgICBcInBrLmV5SjFJam9pWTI5dGJYVnVhWFI1TFhKcGMyUWlMQ0poSWpvaVVtXCIgK1xuICAgIFwiOXdhMjVJUlNKOS5jRTB0WWh5Uy1tcjNEZjNveVcxMXZRXCI7XG5cblxudmFyIEZpbHRlciA9IHJlcXVpcmUoJy4vZmlsdGVyLmpzJyk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vaGFzaC5qcycpKCk7XG5cbnZhciBtYXAgPSBMLm1hcGJveC5tYXAoJ21hcCcsICdjb21tdW5pdHktcmlzZC5pODdlMmk1bycpXG4gICAgLnNldFZpZXcoWzQxLjc5NiwgLTcxLjgwMV0sIDgpO1xuXG4vLyBoYXNoIHNldHRpbmcvd2F0Y2hpbmcgYmFzZWQgb25cbi8vIHRoZSBtYXAgbW92ZW1lbnQsIGFuZCBrZXl1cFxuLy8gb24gdGhlIGlucHV0IHNlbGVjdGlvblxuSGFzaC5pbnB1dChkMy5zZWxlY3QoJyNmaWx0ZXItbWFwLWlucHV0JykpKG1hcCk7XG5cbmQzLmpzb24oYXBpX3VybCArIGdpc3RfaWQsIGZ1bmN0aW9uIChnaXN0KSB7XG4gICAgdmFyIGdlb2pzb24gPSBKU09OLnBhcnNlKGdpc3QuZmlsZXNbJ21hcC5nZW9qc29uJ10uY29udGVudCk7XG5cbiAgICB2YXIgYWx1bW5pID0gTC5tYXBib3hcbiAgICAgICAgLmZlYXR1cmVMYXllcihnZW9qc29uKTtcblxuICAgIGFsdW1uaS5hZGRUbyhtYXApO1xuXG4gICAgLy8gZmlsdGVyXG4gICAgdmFyIGVsX2ZpbHRlcl9yZXN1bHRzX291dHB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN1bHRzLW91dHB1dCcpO1xuICAgIHZhciBmaWx0ZXIgPSBGaWx0ZXIoKS5pbnB1dChkMy5zZWxlY3QoJyNmaWx0ZXItbWFwLWlucHV0JykpLmZlYXR1cmVMYXllcihhbHVtbmkpO1xuXG4gICAgZmlsdGVyLmRpc3BhdGNoLm9uKCdmaWx0ZXJFbmRDb3VudCcsIGZ1bmN0aW9uIChjb3VudCkge1xuICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGVsX2ZpbHRlcl9yZXN1bHRzX291dHB1dC5pbm5lckhUTUwgPSBcIiBObyBidXNpbmVzc2VzLlwiO1xuICAgICAgICB9IGVsc2UgaWYgKGNvdW50ID09PSAxKSB7XG4gICAgICAgICAgICBlbF9maWx0ZXJfcmVzdWx0c19vdXRwdXQuaW5uZXJIVE1MID0gXCIgMSBidXNpbmVzcy5cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsX2ZpbHRlcl9yZXN1bHRzX291dHB1dC5pbm5lckhUTUwgPSBjb3VudCArIFwiIGJ1c2luZXNzZXMuXCI7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGluaXRpYWwgZmlsdGVyXG4gICAgZmlsdGVyKCk7XG5cbiAgICAvLyB6b29tIHRvIGV4dGVudHNcbiAgICB2YXIgZWxfcmVzdWx0c19yb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdWx0cy1yb3cnKTtcbiAgICBlbF9yZXN1bHRzX3Jvdy5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBtYXAuZml0Qm91bmRzKGFsdW1uaS5nZXRCb3VuZHMoKSk7XG4gICAgfTtcblxufSk7XG5cbi8vIGludGVyYWN0aW9uIHdpdGggaW5wdXRcbnZhciBlbF9maWx0ZXJfcm93ID0gZDMuc2VsZWN0KCcjZmlsdGVyLXJvdycpO1xudmFyIGVsX2lucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZpbHRlci1tYXAtaW5wdXQnKTtcbmVsX2lucHV0Lm9uZm9jdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgZWxfZmlsdGVyX3Jvdy5jbGFzc2VkKCdhY3RpdmUnLCB0cnVlKTtcbn07XG5lbF9pbnB1dC5vbmJsdXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgZWxfZmlsdGVyX3Jvdy5jbGFzc2VkKCdhY3RpdmUnLCBmYWxzZSk7XG59OyJdfQ==
