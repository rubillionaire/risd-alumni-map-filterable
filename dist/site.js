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
        if (hash) {
            selection_input.property('value', deslugify(hash.query));
            lastHash = self.formatHash(map);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ydWJlbnJvZHJpZ3Vlei9Eb2N1bWVudHMvY29tbWlzaW9ucy9yaXNkX21lZGlhL3Jpc2QtYWx1bW5pLW1hcC1maWx0ZXJhYmxlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcnViZW5yb2RyaWd1ZXovRG9jdW1lbnRzL2NvbW1pc2lvbnMvcmlzZF9tZWRpYS9yaXNkLWFsdW1uaS1tYXAtZmlsdGVyYWJsZS9zcmMvYmluZFBvcHVwLmpzIiwiL1VzZXJzL3J1YmVucm9kcmlndWV6L0RvY3VtZW50cy9jb21taXNpb25zL3Jpc2RfbWVkaWEvcmlzZC1hbHVtbmktbWFwLWZpbHRlcmFibGUvc3JjL2ZpbHRlci5qcyIsIi9Vc2Vycy9ydWJlbnJvZHJpZ3Vlei9Eb2N1bWVudHMvY29tbWlzaW9ucy9yaXNkX21lZGlhL3Jpc2QtYWx1bW5pLW1hcC1maWx0ZXJhYmxlL3NyYy9oYXNoLmpzIiwiL1VzZXJzL3J1YmVucm9kcmlndWV6L0RvY3VtZW50cy9jb21taXNpb25zL3Jpc2RfbWVkaWEvcmlzZC1hbHVtbmktbWFwLWZpbHRlcmFibGUvc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGJ1aWxkX2RpdiA9IGQzLnNlbGVjdCgnYm9keScpXG4gICAgLmFwcGVuZCgnZGl2JylcbiAgICAuc3R5bGUoJ2Rpc3BsYXknLCAnbm9uZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJpbmRQb3B1cCAobGF5ZXIpIHtcbiAgICB2YXIga2V5c190b19ub3RfaW5jbHVkZSA9WydpZCcsXG4gICAgICAgICdtYXJrZXItY29sb3InLFxuICAgICAgICAnbWFya2VyLXNpemUnLFxuICAgICAgICAnbWFya2VyLXN5bWJvbCddO1xuXG4gICAgdmFyIGFsbF9rZXlzID0gT2JqZWN0LmtleXMobGF5ZXIuZmVhdHVyZS5wcm9wZXJ0aWVzKTtcbiAgICB2YXIgcG9wdXBfY29udGVudF9kYXRhID0gW107XG5cbiAgICBhbGxfa2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIGlmIChrZXlzX3RvX25vdF9pbmNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICBwb3B1cF9jb250ZW50X2RhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGssXG4gICAgICAgICAgICAgICAgdmFsdWU6IGxheWVyLmZlYXR1cmUucHJvcGVydGllc1trXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGJ1aWxkX2Rpdi5odG1sKCcnKTtcbiAgICBidWlsZF9kaXYuc2VsZWN0QWxsKCcubWV0YWRhdGEnKVxuICAgICAgICAuZGF0YShwb3B1cF9jb250ZW50X2RhdGEpXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRhZGF0YScpXG4gICAgICAgIC5jYWxsKHBvcHVwX3N0cnVjdHVyZSk7XG5cbiAgICB2YXIgY29udGVudCA9IGJ1aWxkX2Rpdi5odG1sKCk7XG5cbiAgICBsYXllci5iaW5kUG9wdXAoY29udGVudCk7XG5cbiAgICBmdW5jdGlvbiBwb3B1cF9zdHJ1Y3R1cmUgKHNlbCkge1xuICAgICAgICBzZWwuYXBwZW5kKCdwJylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRhZGF0YS1sYWJlbCcpXG4gICAgICAgICAgICAuaHRtbChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b1RpdGxlQ2FzZShkLmxhYmVsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBzZWwuYXBwZW5kKCdwJylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRhZGF0YS12YWx1ZScpXG4gICAgICAgICAgICAuaHRtbChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gdG9UaXRsZUNhc2Uoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXHdcXFMqL2csXG4gICAgICAgIGZ1bmN0aW9uKHR4dCl7XG4gICAgICAgICAgICByZXR1cm4gdHh0LmNoYXJBdCgwKVxuICAgICAgICAgICAgICAgICAgICAgIC50b1VwcGVyQ2FzZSgpICtcbiAgICAgICAgICAgICAgICAgICB0eHQuc3Vic3RyKDEpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH0pO1xufSIsInZhciBiaW5kUG9wdXAgPSByZXF1aXJlKCcuL2JpbmRQb3B1cCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEZpbHRlciAoKSB7XG4gICAgdmFyIHNlbGVjdGlvbl9pbnB1dDtcbiAgICB2YXIgZmlsdGVyX3N0cmluZztcbiAgICB2YXIgZmVhdHVyZUxheWVyO1xuICAgIHZhciBmZWF0dXJlX2NvdW50ID0gMDtcblxuICAgIHZhciBjaGFuZ2VEZWZlciA9IDEwMDtcbiAgICB2YXIgY2hhbmdlVGltZW91dCA9IG51bGw7XG5cbiAgICB2YXIgc2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjaGFuZ2VUaW1lb3V0KSB7XG4gICAgICAgICAgICBjaGFuZ2VUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaC5maWx0ZXJTdGFydENvdW50KGZlYXR1cmVfY291bnQpO1xuICAgICAgICAgICAgICAgIGZlYXR1cmVfY291bnQgPSAwO1xuXG4gICAgICAgICAgICAgICAgZmlsdGVyX3N0cmluZyA9IHNlbGVjdGlvbl9pbnB1dC5wcm9wZXJ0eSgndmFsdWUnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGZlYXR1cmVMYXllci5zZXRGaWx0ZXIoc2hvd190aXRsZV9pbmR1c3RyeSk7XG4gICAgICAgICAgICAgICAgZmVhdHVyZUxheWVyLmVhY2hMYXllcihiaW5kUG9wdXApO1xuXG4gICAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaC5maWx0ZXJFbmRDb3VudChmZWF0dXJlX2NvdW50KTtcblxuICAgICAgICAgICAgICAgIGNoYW5nZVRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgfSwgY2hhbmdlRGVmZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaCgnZmlsdGVyU3RhcnRDb3VudCcsICdmaWx0ZXJFbmRDb3VudCcpO1xuXG4gICAgc2VsZi5pbnB1dCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNlbGVjdGlvbl9pbnB1dDtcbiAgICAgICAgc2VsZWN0aW9uX2lucHV0ID0geDtcbiAgICAgICAgc2VsZWN0aW9uX2lucHV0Lm9uKCdrZXl1cC5maWx0ZXInLCBzZWxmKTtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcbiAgICBzZWxmLmZlYXR1cmVMYXllciA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGZlYXR1cmVMYXllcjtcbiAgICAgICAgZmVhdHVyZUxheWVyID0geDtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHNob3dfdGl0bGVfaW5kdXN0cnkoZmVhdHVyZSkge1xuICAgICAgICB2YXIgYm9vbCA9IGZhbHNlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoJ0luZHVzdHJ5IHNlY3RvcicgaW4gZmVhdHVyZS5wcm9wZXJ0aWVzICZcbiAgICAgICAgICAgICAgICBmZWF0dXJlLnByb3BlcnRpZXNbJ0luZHVzdHJ5IHNlY3RvciddXG4gICAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgIC5pbmRleE9mKGZpbHRlcl9zdHJpbmcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGJvb2wgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZlYXR1cmVfY291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYm9vbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcInRpdGxlXCIgaW4gZmVhdHVyZS5wcm9wZXJ0aWVzICZcbiAgICAgICAgICAgICAgICBmZWF0dXJlLnByb3BlcnRpZXMudGl0bGVcbiAgICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgLmluZGV4T2YoZmlsdGVyX3N0cmluZykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYm9vbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZmVhdHVyZV9jb3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHJldHVybiBib29sO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gUHJvcGVydHkgdG8gZmlsdGVyIGRvZXMgbm90IGV4aXN0LiBBbmQgdGhhdHMgZmluZS4gUmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gSGFzaCAoKSB7XG5cbiAgICB2YXIgbWFwO1xuICAgIHZhciBsYXN0SGFzaDtcbiAgICB2YXIgaXNMaXN0ZW5pbmcgPSBmYWxzZTtcbiAgICB2YXIgbW92aW5nTWFwID0gZmFsc2U7XG4gICAgdmFyIGNoYW5nZURlZmVyID0gMTAwO1xuICAgIHZhciBjaGFuZ2VUaW1lb3V0ID0gbnVsbDtcbiAgICB2YXIgaGFzaENoYW5nZUludGVydmFsID0gbnVsbDtcbiAgICB2YXIgc2VsZWN0aW9uX2lucHV0O1xuXG4gICAgZnVuY3Rpb24gc2VsZiAobSkge1xuICAgICAgICBpZiAobSkge1xuICAgICAgICAgICAgbWFwID0gbTtcbiAgICAgICAgICAgIHNlbGYuaW5pdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2VsZi5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBsYXN0SGFzaCA9IG51bGw7XG4gICAgICAgIHNlbGYuaW5pdGlhbGl6ZU1hcEFuZElucHV0KCk7XG4gICAgICAgIGlmICghaXNMaXN0ZW5pbmcpIHtcbiAgICAgICAgICAgIHN0YXJ0TGlzdGVuaW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5pbnB1dCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2VsZWN0aW9uX2lucHV0O1xuICAgICAgICBzZWxlY3Rpb25faW5wdXQgPSB4O1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuXG4gICAgc2VsZi5yZW1vdmVGcm9tID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgaWYgKGNoYW5nZVRpbWVvdXQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChjaGFuZ2VUaW1lb3V0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNMaXN0ZW5pbmcpIHtcbiAgICAgICAgICAgIHN0b3BMaXN0ZW5pbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBtYXAgPSBudWxsO1xuICAgIH07XG5cbiAgICBzZWxmLmluaXRpYWxpemVNYXBBbmRJbnB1dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG1vdmluZ01hcCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHZhciBoYXNoID0gc2VsZi5wYXJzZUhhc2gobG9jYXRpb24uaGFzaCk7XG4gICAgICAgIGlmIChoYXNoKSB7XG4gICAgICAgICAgICBzZWxlY3Rpb25faW5wdXQucHJvcGVydHkoJ3ZhbHVlJywgZGVzbHVnaWZ5KGhhc2gucXVlcnkpKTtcbiAgICAgICAgICAgIGxhc3RIYXNoID0gc2VsZi5mb3JtYXRIYXNoKG1hcCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5vbk1hcE1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChtb3ZpbmdNYXAgfHwgIW1hcC5fbG9hZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaGFzaCA9IHNlbGYuZm9ybWF0SGFzaChtYXApO1xuICAgICAgICBpZiAobGFzdEhhc2ggIT0gaGFzaCkge1xuICAgICAgICAgICAgbG9jYXRpb24ucmVwbGFjZShoYXNoKTtcbiAgICAgICAgICAgIGxhc3RIYXNoID0gaGFzaDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLm9uSW5wdXRDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBoYXNoID0gc2VsZi5mb3JtYXRIYXNoKG1hcCk7XG4gICAgICAgIGlmIChsYXN0SGFzaCAhPSBoYXNoKSB7XG4gICAgICAgICAgICBsb2NhdGlvbi5yZXBsYWNlKGhhc2gpO1xuICAgICAgICAgICAgbGFzdEhhc2ggPSBoYXNoO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaGFzaCA9IGxvY2F0aW9uLmhhc2g7XG4gICAgICAgIGlmIChoYXNoID09PSBsYXN0SGFzaCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJzZWQgPSBzZWxmLnBhcnNlSGFzaChoYXNoKTtcbiAgICAgICAgaWYgKHBhcnNlZCkge1xuICAgICAgICAgICAgbW92aW5nTWFwID0gdHJ1ZTtcbiAgICAgICAgICAgIG1hcC5zZXRWaWV3KHBhcnNlZC5jZW50ZXIsIHBhcnNlZC56b29tKTtcbiAgICAgICAgICAgIG1vdmluZ01hcCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5vbk1hcE1vdmUobWFwKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYub25IYXNoQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWNoYW5nZVRpbWVvdXQpIHtcbiAgICAgICAgICAgIGNoYW5nZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIGNoYW5nZVRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgfSwgY2hhbmdlRGVmZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYucGFyc2VIYXNoID0gZnVuY3Rpb24gKGhhc2gpIHtcbiAgICAgICAgaWYgKGhhc2guaW5kZXhPZignIycpID09PSAwKSB7XG4gICAgICAgICAgICBoYXNoID0gaGFzaC5zdWJzdHIoMSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFyZ3MgPSBoYXNoLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoICA9PT0gMyB8IGFyZ3MubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICB2YXIgem9vbSA9IHBhcnNlSW50KGFyZ3NbMF0sIDEwKTtcbiAgICAgICAgICAgIHZhciBsYXQgPSBwYXJzZUZsb2F0KGFyZ3NbMV0pO1xuICAgICAgICAgICAgdmFyIGxvbiA9IHBhcnNlRmxvYXQoYXJnc1syXSk7XG4gICAgICAgICAgICB2YXIgcXVlcnkgPSBcIlwiO1xuICAgICAgICAgICAgaWYgKGlzTmFOKHpvb20pIHx8IGlzTmFOKGxhdCkgfHwgaXNOYU4obG9uKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgICAgIHF1ZXJ5ID0gZGVzbHVnaWZ5KGFyZ3NbM10pO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbmV3IEwuTGF0TG5nKGxhdCwgbG9uKSxcbiAgICAgICAgICAgICAgICAgICAgem9vbTogem9vbSxcbiAgICAgICAgICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY2VudGVyOiBuZXcgTC5MYXRMbmcobGF0LCBsb24pLFxuICAgICAgICAgICAgICAgICAgICB6b29tOiB6b29tLFxuICAgICAgICAgICAgICAgICAgICBxdWVyeTogcXVlcnlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBzZWxmLmZvcm1hdEhhc2ggPSBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgIHZhciBjZW50ZXIgPSBtYXAuZ2V0Q2VudGVyKCk7XG4gICAgICAgIHZhciB6b29tID0gbWFwLmdldFpvb20oKTtcbiAgICAgICAgdmFyIHByZWNpc2lvbiA9IE1hdGgubWF4KDAsIE1hdGguY2VpbChNYXRoLmxvZyh6b29tKSAvIE1hdGguTE4yKSk7XG4gICAgICAgIHZhciBxdWVyeSA9IHNsdWdpZnkoc2VsZWN0aW9uX2lucHV0LnByb3BlcnR5KCd2YWx1ZScpKTtcbiAgICAgICAgcmV0dXJuIFwiI1wiICsgW3pvb20sXG4gICAgICAgICAgICBjZW50ZXIubGF0LnRvRml4ZWQocHJlY2lzaW9uKSxcbiAgICAgICAgICAgIGNlbnRlci5sbmcudG9GaXhlZChwcmVjaXNpb24pLFxuICAgICAgICAgICAgcXVlcnldLmpvaW4oXCIvXCIpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzdGFydExpc3RlbmluZyAoKSB7XG4gICAgICAgIG1hcC5vbihcIm1vdmVlbmRcIiwgc2VsZi5vbk1hcE1vdmUsIHNlbGYpO1xuICAgICAgICBzZWxlY3Rpb25faW5wdXQub24oJ2tleXVwLmhhc2gnLCBzZWxmLm9uSW5wdXRDaGFuZ2UpO1xuICAgICAgICB3aW5kb3cub25oYXNoY2hhbmdlID0gc2VsZi5vbkhhc2hDaGFuZ2U7XG4gICAgICAgIGlzTGlzdGVuaW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcExpc3RlbmluZyAoKSB7XG4gICAgICAgIG1hcC5vZmYoXCJtb3ZlZW5kXCIsIHNlbGYub25NYXBNb3ZlLCBzZWxmKTtcbiAgICAgICAgd2luZG93Lm9uaGFzaGNoYW5nZSA9IG51bGw7XG4gICAgICAgIHNlbGVjdGlvbl9pbnB1dC5vbigna2V5dXAuaGFzaCcsIG51bGwpO1xuICAgICAgICBpc0xpc3RlbmluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNsdWdpZnkgKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyAvZywgXCItXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkZXNsdWdpZnkgKHNsdWcpIHtcbiAgICAgICAgcmV0dXJuIHNsdWcucmVwbGFjZSgvLS9nLCBcIiBcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG59OyIsInZhciBhcGlfdXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMvJztcbnZhciBnaXN0X2lkID0gJzg3YzMxZDJhNDNhNzA0YjRjNDQzJztcblxuTC5tYXBib3guYWNjZXNzVG9rZW4gPVxuICAgIFwicGsuZXlKMUlqb2lZMjl0YlhWdWFYUjVMWEpwYzJRaUxDSmhJam9pVW1cIiArXG4gICAgXCI5d2EyNUlSU0o5LmNFMHRZaHlTLW1yM0RmM295VzExdlFcIjtcblxuXG52YXIgRmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXIuanMnKTtcbnZhciBIYXNoID0gcmVxdWlyZSgnLi9oYXNoLmpzJykoKTtcblxudmFyIG1hcCA9IEwubWFwYm94Lm1hcCgnbWFwJywgJ2NvbW11bml0eS1yaXNkLmk4N2UyaTVvJylcbiAgICAuc2V0VmlldyhbNDEuNzk2LCAtNzEuODAxXSwgOCk7XG5cbi8vIGhhc2ggc2V0dGluZy93YXRjaGluZyBiYXNlZCBvblxuLy8gdGhlIG1hcCBtb3ZlbWVudCwgYW5kIGtleXVwXG4vLyBvbiB0aGUgaW5wdXQgc2VsZWN0aW9uXG5IYXNoLmlucHV0KGQzLnNlbGVjdCgnI2ZpbHRlci1tYXAtaW5wdXQnKSkobWFwKTtcblxuZDMuanNvbihhcGlfdXJsICsgZ2lzdF9pZCwgZnVuY3Rpb24gKGdpc3QpIHtcbiAgICB2YXIgZ2VvanNvbiA9IEpTT04ucGFyc2UoZ2lzdC5maWxlc1snbWFwLmdlb2pzb24nXS5jb250ZW50KTtcblxuICAgIHZhciBhbHVtbmkgPSBMLm1hcGJveFxuICAgICAgICAuZmVhdHVyZUxheWVyKGdlb2pzb24pO1xuXG4gICAgYWx1bW5pLmFkZFRvKG1hcCk7XG5cbiAgICAvLyBmaWx0ZXJcbiAgICB2YXIgZWxfZmlsdGVyX3Jlc3VsdHNfb3V0cHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3VsdHMtb3V0cHV0Jyk7XG4gICAgdmFyIGZpbHRlciA9IEZpbHRlcigpLmlucHV0KGQzLnNlbGVjdCgnI2ZpbHRlci1tYXAtaW5wdXQnKSkuZmVhdHVyZUxheWVyKGFsdW1uaSk7XG5cbiAgICBmaWx0ZXIuZGlzcGF0Y2gub24oJ2ZpbHRlckVuZENvdW50JywgZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgZWxfZmlsdGVyX3Jlc3VsdHNfb3V0cHV0LmlubmVySFRNTCA9IFwiIE5vIGJ1c2luZXNzZXMuXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoY291bnQgPT09IDEpIHtcbiAgICAgICAgICAgIGVsX2ZpbHRlcl9yZXN1bHRzX291dHB1dC5pbm5lckhUTUwgPSBcIiAxIGJ1c2luZXNzLlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxfZmlsdGVyX3Jlc3VsdHNfb3V0cHV0LmlubmVySFRNTCA9IGNvdW50ICsgXCIgYnVzaW5lc3Nlcy5cIjtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gaW5pdGlhbCBmaWx0ZXJcbiAgICBmaWx0ZXIoKTtcblxuICAgIC8vIHpvb20gdG8gZXh0ZW50c1xuICAgIHZhciBlbF9yZXN1bHRzX3JvdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN1bHRzLXJvdycpO1xuICAgIGVsX3Jlc3VsdHNfcm93Lm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1hcC5maXRCb3VuZHMoYWx1bW5pLmdldEJvdW5kcygpKTtcbiAgICB9O1xuXG59KTtcblxuLy8gaW50ZXJhY3Rpb24gd2l0aCBpbnB1dFxudmFyIGVsX2ZpbHRlcl9yb3cgPSBkMy5zZWxlY3QoJyNmaWx0ZXItcm93Jyk7XG52YXIgZWxfaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsdGVyLW1hcC1pbnB1dCcpO1xuZWxfaW5wdXQub25mb2N1cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBlbF9maWx0ZXJfcm93LmNsYXNzZWQoJ2FjdGl2ZScsIHRydWUpO1xufTtcbmVsX2lucHV0Lm9uYmx1ciA9IGZ1bmN0aW9uICgpIHtcbiAgICBlbF9maWx0ZXJfcm93LmNsYXNzZWQoJ2FjdGl2ZScsIGZhbHNlKTtcbn07Il19
