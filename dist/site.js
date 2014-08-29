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
    self.setFilterValue = function (x) {
        if (!arguments.length) return;
        selection_input.property('value', x);
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
var hash = Hash.input(d3.select('#filter-map-input'));
hash(map);

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

    // list of industry sectors
    var el_industry_sectors_list = document.getElementById('industry-sectors-list');
    var sectors = [];
    geojson.features.forEach(function(d ,i) {
        var sector = d.properties['Industry sector'];
        if (typeof sector != 'undefined' &
            sector !== '' &
            sectors.indexOf(sector)  === -1) {
            if (sector.trim()) {
                sectors.push(sector.trim());
            }
        }
    });
    var sorted_sectors = sectors.sort();

    d3.select(el_industry_sectors_list)
        .selectAll('.industry-sector-list-item')
        .data(sorted_sectors)
        .enter()
        .append('li')
        .attr('class', 'industry-sector-list-item hoverable muted')
        .on('click', function (d) {
            filter.setFilterValue(d)();
            hash.onInputChange();
        })
        .append('p')
        .text(function (d) { return d; });

    // UI for hiding/showing list
    var toggleSectors = d3.select('#industry-sectors-header')
        .on('click', function () {
            var parent = d3.select(d3.select(this).node().parentNode);
            var opened = parent.classed('state-open');
            parent.classed('state-open', opened ? false : true);
        });
    // end list of industry sectors
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ydWJlbnJvZHJpZ3Vlei9Eb2N1bWVudHMvY29tbWlzaW9ucy9yaXNkX21lZGlhL3Jpc2QtYWx1bW5pLW1hcC1maWx0ZXJhYmxlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcnViZW5yb2RyaWd1ZXovRG9jdW1lbnRzL2NvbW1pc2lvbnMvcmlzZF9tZWRpYS9yaXNkLWFsdW1uaS1tYXAtZmlsdGVyYWJsZS9zcmMvYmluZFBvcHVwLmpzIiwiL1VzZXJzL3J1YmVucm9kcmlndWV6L0RvY3VtZW50cy9jb21taXNpb25zL3Jpc2RfbWVkaWEvcmlzZC1hbHVtbmktbWFwLWZpbHRlcmFibGUvc3JjL2ZpbHRlci5qcyIsIi9Vc2Vycy9ydWJlbnJvZHJpZ3Vlei9Eb2N1bWVudHMvY29tbWlzaW9ucy9yaXNkX21lZGlhL3Jpc2QtYWx1bW5pLW1hcC1maWx0ZXJhYmxlL3NyYy9oYXNoLmpzIiwiL1VzZXJzL3J1YmVucm9kcmlndWV6L0RvY3VtZW50cy9jb21taXNpb25zL3Jpc2RfbWVkaWEvcmlzZC1hbHVtbmktbWFwLWZpbHRlcmFibGUvc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBidWlsZF9kaXYgPSBkMy5zZWxlY3QoJ2JvZHknKVxuICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgLnN0eWxlKCdkaXNwbGF5JywgJ25vbmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiaW5kUG9wdXAgKGxheWVyKSB7XG4gICAgdmFyIGtleXNfdG9fbm90X2luY2x1ZGUgPVsnaWQnLFxuICAgICAgICAnbWFya2VyLWNvbG9yJyxcbiAgICAgICAgJ21hcmtlci1zaXplJyxcbiAgICAgICAgJ21hcmtlci1zeW1ib2wnXTtcblxuICAgIHZhciBhbGxfa2V5cyA9IE9iamVjdC5rZXlzKGxheWVyLmZlYXR1cmUucHJvcGVydGllcyk7XG4gICAgdmFyIHBvcHVwX2NvbnRlbnRfZGF0YSA9IFtdO1xuXG4gICAgYWxsX2tleXMuZm9yRWFjaChmdW5jdGlvbiAoaykge1xuICAgICAgICBpZiAoa2V5c190b19ub3RfaW5jbHVkZS5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgcG9wdXBfY29udGVudF9kYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBrLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBsYXllci5mZWF0dXJlLnByb3BlcnRpZXNba11cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBidWlsZF9kaXYuaHRtbCgnJyk7XG4gICAgYnVpbGRfZGl2LnNlbGVjdEFsbCgnLm1ldGFkYXRhJylcbiAgICAgICAgLmRhdGEocG9wdXBfY29udGVudF9kYXRhKVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbWV0YWRhdGEnKVxuICAgICAgICAuY2FsbChwb3B1cF9zdHJ1Y3R1cmUpO1xuXG4gICAgdmFyIGNvbnRlbnQgPSBidWlsZF9kaXYuaHRtbCgpO1xuXG4gICAgbGF5ZXIuYmluZFBvcHVwKGNvbnRlbnQpO1xuXG4gICAgZnVuY3Rpb24gcG9wdXBfc3RydWN0dXJlIChzZWwpIHtcbiAgICAgICAgc2VsLmFwcGVuZCgncCcpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbWV0YWRhdGEtbGFiZWwnKVxuICAgICAgICAgICAgLmh0bWwoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9UaXRsZUNhc2UoZC5sYWJlbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgc2VsLmFwcGVuZCgncCcpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbWV0YWRhdGEtdmFsdWUnKVxuICAgICAgICAgICAgLmh0bWwoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC52YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHRvVGl0bGVDYXNlKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvXFx3XFxTKi9nLFxuICAgICAgICBmdW5jdGlvbih0eHQpe1xuICAgICAgICAgICAgcmV0dXJuIHR4dC5jaGFyQXQoMClcbiAgICAgICAgICAgICAgICAgICAgICAudG9VcHBlckNhc2UoKSArXG4gICAgICAgICAgICAgICAgICAgdHh0LnN1YnN0cigxKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9KTtcbn0iLCJ2YXIgYmluZFBvcHVwID0gcmVxdWlyZSgnLi9iaW5kUG9wdXAnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBGaWx0ZXIgKCkge1xuICAgIHZhciBzZWxlY3Rpb25faW5wdXQ7XG4gICAgdmFyIGZpbHRlcl9zdHJpbmc7XG4gICAgdmFyIGZlYXR1cmVMYXllcjtcbiAgICB2YXIgZmVhdHVyZV9jb3VudCA9IDA7XG5cbiAgICB2YXIgY2hhbmdlRGVmZXIgPSAxMDA7XG4gICAgdmFyIGNoYW5nZVRpbWVvdXQgPSBudWxsO1xuXG4gICAgdmFyIHNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghY2hhbmdlVGltZW91dCkge1xuICAgICAgICAgICAgY2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2guZmlsdGVyU3RhcnRDb3VudChmZWF0dXJlX2NvdW50KTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlX2NvdW50ID0gMDtcblxuICAgICAgICAgICAgICAgIGZpbHRlcl9zdHJpbmcgPSBzZWxlY3Rpb25faW5wdXQucHJvcGVydHkoJ3ZhbHVlJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlTGF5ZXIuc2V0RmlsdGVyKHNob3dfdGl0bGVfaW5kdXN0cnkpO1xuICAgICAgICAgICAgICAgIGZlYXR1cmVMYXllci5lYWNoTGF5ZXIoYmluZFBvcHVwKTtcblxuICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2guZmlsdGVyRW5kQ291bnQoZmVhdHVyZV9jb3VudCk7XG5cbiAgICAgICAgICAgICAgICBjaGFuZ2VUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIH0sIGNoYW5nZURlZmVyKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmRpc3BhdGNoID0gZDMuZGlzcGF0Y2goJ2ZpbHRlclN0YXJ0Q291bnQnLCAnZmlsdGVyRW5kQ291bnQnKTtcblxuICAgIHNlbGYuaW5wdXQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzZWxlY3Rpb25faW5wdXQ7XG4gICAgICAgIHNlbGVjdGlvbl9pbnB1dCA9IHg7XG4gICAgICAgIHNlbGVjdGlvbl9pbnB1dC5vbigna2V5dXAuZmlsdGVyJywgc2VsZik7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG4gICAgc2VsZi5mZWF0dXJlTGF5ZXIgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBmZWF0dXJlTGF5ZXI7XG4gICAgICAgIGZlYXR1cmVMYXllciA9IHg7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG4gICAgc2VsZi5zZXRGaWx0ZXJWYWx1ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBzZWxlY3Rpb25faW5wdXQucHJvcGVydHkoJ3ZhbHVlJywgeCk7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzaG93X3RpdGxlX2luZHVzdHJ5KGZlYXR1cmUpIHtcbiAgICAgICAgdmFyIGJvb2wgPSBmYWxzZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCdJbmR1c3RyeSBzZWN0b3InIGluIGZlYXR1cmUucHJvcGVydGllcyAmXG4gICAgICAgICAgICAgICAgZmVhdHVyZS5wcm9wZXJ0aWVzWydJbmR1c3RyeSBzZWN0b3InXVxuICAgICAgICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAuaW5kZXhPZihmaWx0ZXJfc3RyaW5nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBib29sID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlX2NvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXCJ0aXRsZVwiIGluIGZlYXR1cmUucHJvcGVydGllcyAmXG4gICAgICAgICAgICAgICAgZmVhdHVyZS5wcm9wZXJ0aWVzLnRpdGxlXG4gICAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgIC5pbmRleE9mKGZpbHRlcl9zdHJpbmcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGJvb2wgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZlYXR1cmVfY291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYm9vbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFByb3BlcnR5IHRvIGZpbHRlciBkb2VzIG5vdCBleGlzdC4gQW5kIHRoYXRzIGZpbmUuIFJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEhhc2ggKCkge1xuXG4gICAgdmFyIG1hcDtcbiAgICB2YXIgbGFzdEhhc2g7XG4gICAgdmFyIGlzTGlzdGVuaW5nID0gZmFsc2U7XG4gICAgdmFyIG1vdmluZ01hcCA9IGZhbHNlO1xuICAgIHZhciBjaGFuZ2VEZWZlciA9IDEwMDtcbiAgICB2YXIgY2hhbmdlVGltZW91dCA9IG51bGw7XG4gICAgdmFyIGhhc2hDaGFuZ2VJbnRlcnZhbCA9IG51bGw7XG4gICAgdmFyIHNlbGVjdGlvbl9pbnB1dDtcblxuICAgIGZ1bmN0aW9uIHNlbGYgKG0pIHtcbiAgICAgICAgaWYgKG0pIHtcbiAgICAgICAgICAgIG1hcCA9IG07XG4gICAgICAgICAgICBzZWxmLmluaXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbGYuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGFzdEhhc2ggPSBudWxsO1xuICAgICAgICBzZWxmLmluaXRpYWxpemVNYXBBbmRJbnB1dCgpO1xuICAgICAgICBpZiAoIWlzTGlzdGVuaW5nKSB7XG4gICAgICAgICAgICBzdGFydExpc3RlbmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG5cbiAgICBzZWxmLmlucHV0ID0gZnVuY3Rpb24oeCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzZWxlY3Rpb25faW5wdXQ7XG4gICAgICAgIHNlbGVjdGlvbl9pbnB1dCA9IHg7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG5cbiAgICBzZWxmLnJlbW92ZUZyb20gPSBmdW5jdGlvbiAobSkge1xuICAgICAgICBpZiAoY2hhbmdlVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGNoYW5nZVRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0xpc3RlbmluZykge1xuICAgICAgICAgICAgc3RvcExpc3RlbmluZygpO1xuICAgICAgICB9XG4gICAgICAgIG1hcCA9IG51bGw7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG5cbiAgICBzZWxmLmluaXRpYWxpemVNYXBBbmRJbnB1dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG1vdmluZ01hcCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHZhciBoYXNoID0gc2VsZi5wYXJzZUhhc2gobG9jYXRpb24uaGFzaCk7XG4gICAgICAgIGlmIChoYXNoKSB7XG4gICAgICAgICAgICBzZWxlY3Rpb25faW5wdXQucHJvcGVydHkoJ3ZhbHVlJywgZGVzbHVnaWZ5KGhhc2gucXVlcnkpKTtcbiAgICAgICAgICAgIGxhc3RIYXNoID0gc2VsZi5mb3JtYXRIYXNoKG1hcCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcblxuICAgIHNlbGYub25NYXBNb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAobW92aW5nTWFwIHx8ICFtYXAuX2xvYWRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhc2ggPSBzZWxmLmZvcm1hdEhhc2gobWFwKTtcbiAgICAgICAgaWYgKGxhc3RIYXNoICE9IGhhc2gpIHtcbiAgICAgICAgICAgIGxvY2F0aW9uLnJlcGxhY2UoaGFzaCk7XG4gICAgICAgICAgICBsYXN0SGFzaCA9IGhhc2g7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcblxuICAgIHNlbGYub25JbnB1dENoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGhhc2ggPSBzZWxmLmZvcm1hdEhhc2gobWFwKTtcbiAgICAgICAgaWYgKGxhc3RIYXNoICE9IGhhc2gpIHtcbiAgICAgICAgICAgIGxvY2F0aW9uLnJlcGxhY2UoaGFzaCk7XG4gICAgICAgICAgICBsYXN0SGFzaCA9IGhhc2g7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaGFzaCA9IGxvY2F0aW9uLmhhc2g7XG4gICAgICAgIGlmIChoYXNoID09PSBsYXN0SGFzaCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJzZWQgPSBzZWxmLnBhcnNlSGFzaChoYXNoKTtcbiAgICAgICAgaWYgKHBhcnNlZCkge1xuICAgICAgICAgICAgbW92aW5nTWFwID0gdHJ1ZTtcbiAgICAgICAgICAgIG1hcC5zZXRWaWV3KHBhcnNlZC5jZW50ZXIsIHBhcnNlZC56b29tKTtcbiAgICAgICAgICAgIG1vdmluZ01hcCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5vbk1hcE1vdmUobWFwKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG5cbiAgICBzZWxmLm9uSGFzaENoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjaGFuZ2VUaW1lb3V0KSB7XG4gICAgICAgICAgICBjaGFuZ2VUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZi51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICBjaGFuZ2VUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIH0sIGNoYW5nZURlZmVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuXG4gICAgc2VsZi5wYXJzZUhhc2ggPSBmdW5jdGlvbiAoaGFzaCkge1xuICAgICAgICBpZiAoaGFzaC5pbmRleE9mKCcjJykgPT09IDApIHtcbiAgICAgICAgICAgIGhhc2ggPSBoYXNoLnN1YnN0cigxKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYXJncyA9IGhhc2guc3BsaXQoXCIvXCIpO1xuICAgICAgICBpZiAoYXJncy5sZW5ndGggID09PSAzIHwgYXJncy5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgIHZhciB6b29tID0gcGFyc2VJbnQoYXJnc1swXSwgMTApO1xuICAgICAgICAgICAgdmFyIGxhdCA9IHBhcnNlRmxvYXQoYXJnc1sxXSk7XG4gICAgICAgICAgICB2YXIgbG9uID0gcGFyc2VGbG9hdChhcmdzWzJdKTtcbiAgICAgICAgICAgIHZhciBxdWVyeSA9IFwiXCI7XG4gICAgICAgICAgICBpZiAoaXNOYU4oem9vbSkgfHwgaXNOYU4obGF0KSB8fCBpc05hTihsb24pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICAgICAgcXVlcnkgPSBkZXNsdWdpZnkoYXJnc1szXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY2VudGVyOiBuZXcgTC5MYXRMbmcobGF0LCBsb24pLFxuICAgICAgICAgICAgICAgICAgICB6b29tOiB6b29tLFxuICAgICAgICAgICAgICAgICAgICBxdWVyeTogcXVlcnlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjZW50ZXI6IG5ldyBMLkxhdExuZyhsYXQsIGxvbiksXG4gICAgICAgICAgICAgICAgICAgIHpvb206IHpvb20sXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHNlbGYuZm9ybWF0SGFzaCA9IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgdmFyIGNlbnRlciA9IG1hcC5nZXRDZW50ZXIoKTtcbiAgICAgICAgdmFyIHpvb20gPSBtYXAuZ2V0Wm9vbSgpO1xuICAgICAgICB2YXIgcHJlY2lzaW9uID0gTWF0aC5tYXgoMCwgTWF0aC5jZWlsKE1hdGgubG9nKHpvb20pIC8gTWF0aC5MTjIpKTtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gc2x1Z2lmeShzZWxlY3Rpb25faW5wdXQucHJvcGVydHkoJ3ZhbHVlJykpO1xuICAgICAgICByZXR1cm4gXCIjXCIgKyBbem9vbSxcbiAgICAgICAgICAgIGNlbnRlci5sYXQudG9GaXhlZChwcmVjaXNpb24pLFxuICAgICAgICAgICAgY2VudGVyLmxuZy50b0ZpeGVkKHByZWNpc2lvbiksXG4gICAgICAgICAgICBxdWVyeV0uam9pbihcIi9cIik7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHN0YXJ0TGlzdGVuaW5nICgpIHtcbiAgICAgICAgbWFwLm9uKFwibW92ZWVuZFwiLCBzZWxmLm9uTWFwTW92ZSwgc2VsZik7XG4gICAgICAgIHNlbGVjdGlvbl9pbnB1dC5vbigna2V5dXAuaGFzaCcsIHNlbGYub25JbnB1dENoYW5nZSk7XG4gICAgICAgIHdpbmRvdy5vbmhhc2hjaGFuZ2UgPSBzZWxmLm9uSGFzaENoYW5nZTtcbiAgICAgICAgaXNMaXN0ZW5pbmcgPSB0cnVlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzdG9wTGlzdGVuaW5nICgpIHtcbiAgICAgICAgbWFwLm9mZihcIm1vdmVlbmRcIiwgc2VsZi5vbk1hcE1vdmUsIHNlbGYpO1xuICAgICAgICB3aW5kb3cub25oYXNoY2hhbmdlID0gbnVsbDtcbiAgICAgICAgc2VsZWN0aW9uX2lucHV0Lm9uKCdrZXl1cC5oYXNoJywgbnVsbCk7XG4gICAgICAgIGlzTGlzdGVuaW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2x1Z2lmeSAoc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvIC9nLCBcIi1cIikucmVwbGFjZSgvXFwvL2csIFwiLS1cIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRlc2x1Z2lmeSAoc2x1Zykge1xuICAgICAgICByZXR1cm4gc2x1Zy5yZXBsYWNlKC8tLS9nLCBcIi9cIikucmVwbGFjZSgvLS9nLCBcIiBcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG59OyIsInZhciBhcGlfdXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMvJztcbnZhciBnaXN0X2lkID0gJzg3YzMxZDJhNDNhNzA0YjRjNDQzJztcblxuTC5tYXBib3guYWNjZXNzVG9rZW4gPVxuICAgIFwicGsuZXlKMUlqb2lZMjl0YlhWdWFYUjVMWEpwYzJRaUxDSmhJam9pVW1cIiArXG4gICAgXCI5d2EyNUlSU0o5LmNFMHRZaHlTLW1yM0RmM295VzExdlFcIjtcblxuXG52YXIgRmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXIuanMnKTtcbnZhciBIYXNoID0gcmVxdWlyZSgnLi9oYXNoLmpzJykoKTtcblxudmFyIG1hcCA9IEwubWFwYm94Lm1hcCgnbWFwJywgJ2NvbW11bml0eS1yaXNkLmk4N2UyaTVvJylcbiAgICAuc2V0VmlldyhbNDEuNzk2LCAtNzEuODAxXSwgOCk7XG5cbi8vIGhhc2ggc2V0dGluZy93YXRjaGluZyBiYXNlZCBvblxuLy8gdGhlIG1hcCBtb3ZlbWVudCwgYW5kIGtleXVwXG4vLyBvbiB0aGUgaW5wdXQgc2VsZWN0aW9uXG52YXIgaGFzaCA9IEhhc2guaW5wdXQoZDMuc2VsZWN0KCcjZmlsdGVyLW1hcC1pbnB1dCcpKTtcbmhhc2gobWFwKTtcblxuZDMuanNvbihhcGlfdXJsICsgZ2lzdF9pZCwgZnVuY3Rpb24gKGdpc3QpIHtcbiAgICB2YXIgZ2VvanNvbiA9IEpTT04ucGFyc2UoZ2lzdC5maWxlc1snbWFwLmdlb2pzb24nXS5jb250ZW50KTtcblxuICAgIHZhciBhbHVtbmkgPSBMLm1hcGJveFxuICAgICAgICAuZmVhdHVyZUxheWVyKGdlb2pzb24pO1xuXG4gICAgYWx1bW5pLmFkZFRvKG1hcCk7XG5cbiAgICAvLyBmaWx0ZXJcbiAgICB2YXIgZWxfZmlsdGVyX3Jlc3VsdHNfb3V0cHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3VsdHMtb3V0cHV0Jyk7XG4gICAgdmFyIGZpbHRlciA9IEZpbHRlcigpLmlucHV0KGQzLnNlbGVjdCgnI2ZpbHRlci1tYXAtaW5wdXQnKSkuZmVhdHVyZUxheWVyKGFsdW1uaSk7XG5cbiAgICBmaWx0ZXIuZGlzcGF0Y2gub24oJ2ZpbHRlckVuZENvdW50JywgZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgZWxfZmlsdGVyX3Jlc3VsdHNfb3V0cHV0LmlubmVySFRNTCA9IFwiIE5vIGJ1c2luZXNzZXMuXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoY291bnQgPT09IDEpIHtcbiAgICAgICAgICAgIGVsX2ZpbHRlcl9yZXN1bHRzX291dHB1dC5pbm5lckhUTUwgPSBcIiAxIGJ1c2luZXNzLlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxfZmlsdGVyX3Jlc3VsdHNfb3V0cHV0LmlubmVySFRNTCA9IGNvdW50ICsgXCIgYnVzaW5lc3Nlcy5cIjtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gaW5pdGlhbCBmaWx0ZXJcbiAgICBmaWx0ZXIoKTtcblxuICAgIC8vIHpvb20gdG8gZXh0ZW50c1xuICAgIHZhciBlbF9yZXN1bHRzX3JvdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN1bHRzLXJvdycpO1xuICAgIGVsX3Jlc3VsdHNfcm93Lm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1hcC5maXRCb3VuZHMoYWx1bW5pLmdldEJvdW5kcygpKTtcbiAgICB9O1xuXG4gICAgLy8gbGlzdCBvZiBpbmR1c3RyeSBzZWN0b3JzXG4gICAgdmFyIGVsX2luZHVzdHJ5X3NlY3RvcnNfbGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbmR1c3RyeS1zZWN0b3JzLWxpc3QnKTtcbiAgICB2YXIgc2VjdG9ycyA9IFtdO1xuICAgIGdlb2pzb24uZmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbihkICxpKSB7XG4gICAgICAgIHZhciBzZWN0b3IgPSBkLnByb3BlcnRpZXNbJ0luZHVzdHJ5IHNlY3RvciddO1xuICAgICAgICBpZiAodHlwZW9mIHNlY3RvciAhPSAndW5kZWZpbmVkJyAmXG4gICAgICAgICAgICBzZWN0b3IgIT09ICcnICZcbiAgICAgICAgICAgIHNlY3RvcnMuaW5kZXhPZihzZWN0b3IpICA9PT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChzZWN0b3IudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgc2VjdG9ycy5wdXNoKHNlY3Rvci50cmltKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHNvcnRlZF9zZWN0b3JzID0gc2VjdG9ycy5zb3J0KCk7XG5cbiAgICBkMy5zZWxlY3QoZWxfaW5kdXN0cnlfc2VjdG9yc19saXN0KVxuICAgICAgICAuc2VsZWN0QWxsKCcuaW5kdXN0cnktc2VjdG9yLWxpc3QtaXRlbScpXG4gICAgICAgIC5kYXRhKHNvcnRlZF9zZWN0b3JzKVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKCdsaScpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdpbmR1c3RyeS1zZWN0b3ItbGlzdC1pdGVtIGhvdmVyYWJsZSBtdXRlZCcpXG4gICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgZmlsdGVyLnNldEZpbHRlclZhbHVlKGQpKCk7XG4gICAgICAgICAgICBoYXNoLm9uSW5wdXRDaGFuZ2UoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFwcGVuZCgncCcpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7IHJldHVybiBkOyB9KTtcblxuICAgIC8vIFVJIGZvciBoaWRpbmcvc2hvd2luZyBsaXN0XG4gICAgdmFyIHRvZ2dsZVNlY3RvcnMgPSBkMy5zZWxlY3QoJyNpbmR1c3RyeS1zZWN0b3JzLWhlYWRlcicpXG4gICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZDMuc2VsZWN0KGQzLnNlbGVjdCh0aGlzKS5ub2RlKCkucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICB2YXIgb3BlbmVkID0gcGFyZW50LmNsYXNzZWQoJ3N0YXRlLW9wZW4nKTtcbiAgICAgICAgICAgIHBhcmVudC5jbGFzc2VkKCdzdGF0ZS1vcGVuJywgb3BlbmVkID8gZmFsc2UgOiB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgLy8gZW5kIGxpc3Qgb2YgaW5kdXN0cnkgc2VjdG9yc1xufSk7XG5cbi8vIGludGVyYWN0aW9uIHdpdGggaW5wdXRcbnZhciBlbF9maWx0ZXJfcm93ID0gZDMuc2VsZWN0KCcjZmlsdGVyLXJvdycpO1xudmFyIGVsX2lucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZpbHRlci1tYXAtaW5wdXQnKTtcblxuZWxfaW5wdXQub25mb2N1cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBlbF9maWx0ZXJfcm93LmNsYXNzZWQoJ2FjdGl2ZScsIHRydWUpO1xufTtcbmVsX2lucHV0Lm9uYmx1ciA9IGZ1bmN0aW9uICgpIHtcbiAgICBlbF9maWx0ZXJfcm93LmNsYXNzZWQoJ2FjdGl2ZScsIGZhbHNlKTtcbn07Il19
