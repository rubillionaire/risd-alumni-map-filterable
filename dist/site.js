(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/index.js":[function(require,module,exports){
var api_url = 'https://api.github.com/gists/';
var gist_id = '87c31d2a43a704b4c443';

L.mapbox.accessToken =
    "pk.eyJ1IjoiY29tbXVuaXR5LXJpc2QiLCJhIjoiUm" +
    "9wa25IRSJ9.cE0tYhyS-mr3Df3oyW11vQ";

var Filter = function () {
    var selection_input;
    var filter_string;
    var featureLayer;
    var feature_count = 0;

    var self = function () {
        self.dispatch.filterStartCount(feature_count);
        feature_count = 0;

        filter_string = selection_input.property('value').toLowerCase();
        featureLayer.setFilter(show_title_industry);
        featureLayer.eachLayer(bindPopup);

        self.dispatch.filterEndCount(feature_count);
    };

    self.dispatch = d3.dispatch('filterStartCount', 'filterEndCount');

    self.input = function (x) {
        if (!arguments.length) return selection_input;
        selection_input = x;
        selection_input.on('keyup', self);
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

var map = L.mapbox.map('map', 'community-risd.i87e2i5o')
    .setView([41.796, -71.801], 8);
L.hash(map);


var build_div = d3.select('body')
    .append('div')
    .style('display', 'none');

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
}
el_input.onblur = function () {
    el_filter_row.classed('active', false);
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g,
        function(txt){
            return txt.charAt(0)
                      .toUpperCase() +
                   txt.substr(1).toLowerCase();
        });
}

function bindPopup (layer) {
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
}
},{}]},{},["/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ydWJlbnJvZHJpZ3Vlei9Eb2N1bWVudHMvY29tbWlzaW9ucy9yaXNkX21lZGlhL3Jpc2QtYWx1bW5pLW1hcC1maWx0ZXJhYmxlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcnViZW5yb2RyaWd1ZXovRG9jdW1lbnRzL2NvbW1pc2lvbnMvcmlzZF9tZWRpYS9yaXNkLWFsdW1uaS1tYXAtZmlsdGVyYWJsZS9zcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBhcGlfdXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMvJztcbnZhciBnaXN0X2lkID0gJzg3YzMxZDJhNDNhNzA0YjRjNDQzJztcblxuTC5tYXBib3guYWNjZXNzVG9rZW4gPVxuICAgIFwicGsuZXlKMUlqb2lZMjl0YlhWdWFYUjVMWEpwYzJRaUxDSmhJam9pVW1cIiArXG4gICAgXCI5d2EyNUlSU0o5LmNFMHRZaHlTLW1yM0RmM295VzExdlFcIjtcblxudmFyIEZpbHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZWN0aW9uX2lucHV0O1xuICAgIHZhciBmaWx0ZXJfc3RyaW5nO1xuICAgIHZhciBmZWF0dXJlTGF5ZXI7XG4gICAgdmFyIGZlYXR1cmVfY291bnQgPSAwO1xuXG4gICAgdmFyIHNlbGYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuZGlzcGF0Y2guZmlsdGVyU3RhcnRDb3VudChmZWF0dXJlX2NvdW50KTtcbiAgICAgICAgZmVhdHVyZV9jb3VudCA9IDA7XG5cbiAgICAgICAgZmlsdGVyX3N0cmluZyA9IHNlbGVjdGlvbl9pbnB1dC5wcm9wZXJ0eSgndmFsdWUnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBmZWF0dXJlTGF5ZXIuc2V0RmlsdGVyKHNob3dfdGl0bGVfaW5kdXN0cnkpO1xuICAgICAgICBmZWF0dXJlTGF5ZXIuZWFjaExheWVyKGJpbmRQb3B1cCk7XG5cbiAgICAgICAgc2VsZi5kaXNwYXRjaC5maWx0ZXJFbmRDb3VudChmZWF0dXJlX2NvdW50KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kaXNwYXRjaCA9IGQzLmRpc3BhdGNoKCdmaWx0ZXJTdGFydENvdW50JywgJ2ZpbHRlckVuZENvdW50Jyk7XG5cbiAgICBzZWxmLmlucHV0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2VsZWN0aW9uX2lucHV0O1xuICAgICAgICBzZWxlY3Rpb25faW5wdXQgPSB4O1xuICAgICAgICBzZWxlY3Rpb25faW5wdXQub24oJ2tleXVwJywgc2VsZik7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG4gICAgc2VsZi5mZWF0dXJlTGF5ZXIgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBmZWF0dXJlTGF5ZXI7XG4gICAgICAgIGZlYXR1cmVMYXllciA9IHg7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzaG93X3RpdGxlX2luZHVzdHJ5KGZlYXR1cmUpIHtcbiAgICAgICAgdmFyIGJvb2wgPSBmYWxzZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCdJbmR1c3RyeSBzZWN0b3InIGluIGZlYXR1cmUucHJvcGVydGllcyAmXG4gICAgICAgICAgICAgICAgZmVhdHVyZS5wcm9wZXJ0aWVzWydJbmR1c3RyeSBzZWN0b3InXVxuICAgICAgICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAuaW5kZXhPZihmaWx0ZXJfc3RyaW5nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBib29sID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlX2NvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXCJ0aXRsZVwiIGluIGZlYXR1cmUucHJvcGVydGllcyAmXG4gICAgICAgICAgICAgICAgZmVhdHVyZS5wcm9wZXJ0aWVzLnRpdGxlXG4gICAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgIC5pbmRleE9mKGZpbHRlcl9zdHJpbmcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGJvb2wgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZlYXR1cmVfY291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYm9vbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFByb3BlcnR5IHRvIGZpbHRlciBkb2VzIG5vdCBleGlzdC4gQW5kIHRoYXRzIGZpbmUuIFJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xufTtcblxudmFyIG1hcCA9IEwubWFwYm94Lm1hcCgnbWFwJywgJ2NvbW11bml0eS1yaXNkLmk4N2UyaTVvJylcbiAgICAuc2V0VmlldyhbNDEuNzk2LCAtNzEuODAxXSwgOCk7XG5MLmhhc2gobWFwKTtcblxuXG52YXIgYnVpbGRfZGl2ID0gZDMuc2VsZWN0KCdib2R5JylcbiAgICAuYXBwZW5kKCdkaXYnKVxuICAgIC5zdHlsZSgnZGlzcGxheScsICdub25lJyk7XG5cbmQzLmpzb24oYXBpX3VybCArIGdpc3RfaWQsIGZ1bmN0aW9uIChnaXN0KSB7XG4gICAgdmFyIGdlb2pzb24gPSBKU09OLnBhcnNlKGdpc3QuZmlsZXNbJ21hcC5nZW9qc29uJ10uY29udGVudCk7XG5cbiAgICB2YXIgYWx1bW5pID0gTC5tYXBib3hcbiAgICAgICAgLmZlYXR1cmVMYXllcihnZW9qc29uKTtcblxuICAgIGFsdW1uaS5hZGRUbyhtYXApO1xuXG4gICAgLy8gZmlsdGVyXG4gICAgdmFyIGVsX2ZpbHRlcl9yZXN1bHRzX291dHB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN1bHRzLW91dHB1dCcpO1xuICAgIHZhciBmaWx0ZXIgPSBGaWx0ZXIoKS5pbnB1dChkMy5zZWxlY3QoJyNmaWx0ZXItbWFwLWlucHV0JykpLmZlYXR1cmVMYXllcihhbHVtbmkpO1xuXG4gICAgZmlsdGVyLmRpc3BhdGNoLm9uKCdmaWx0ZXJFbmRDb3VudCcsIGZ1bmN0aW9uIChjb3VudCkge1xuICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGVsX2ZpbHRlcl9yZXN1bHRzX291dHB1dC5pbm5lckhUTUwgPSBcIiBObyBidXNpbmVzc2VzLlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxfZmlsdGVyX3Jlc3VsdHNfb3V0cHV0LmlubmVySFRNTCA9IGNvdW50ICsgXCIgYnVzaW5lc3Nlcy5cIjtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gaW5pdGlhbCBmaWx0ZXJcbiAgICBmaWx0ZXIoKTtcblxuICAgIC8vIHpvb20gdG8gZXh0ZW50c1xuICAgIHZhciBlbF9yZXN1bHRzX3JvdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN1bHRzLXJvdycpO1xuICAgIGVsX3Jlc3VsdHNfcm93Lm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1hcC5maXRCb3VuZHMoYWx1bW5pLmdldEJvdW5kcygpKTtcbiAgICB9O1xuXG59KTtcblxuLy8gaW50ZXJhY3Rpb24gd2l0aCBpbnB1dFxudmFyIGVsX2ZpbHRlcl9yb3cgPSBkMy5zZWxlY3QoJyNmaWx0ZXItcm93Jyk7XG52YXIgZWxfaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsdGVyLW1hcC1pbnB1dCcpO1xuZWxfaW5wdXQub25mb2N1cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBlbF9maWx0ZXJfcm93LmNsYXNzZWQoJ2FjdGl2ZScsIHRydWUpO1xufVxuZWxfaW5wdXQub25ibHVyID0gZnVuY3Rpb24gKCkge1xuICAgIGVsX2ZpbHRlcl9yb3cuY2xhc3NlZCgnYWN0aXZlJywgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiB0b1RpdGxlQ2FzZShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcd1xcUyovZyxcbiAgICAgICAgZnVuY3Rpb24odHh0KXtcbiAgICAgICAgICAgIHJldHVybiB0eHQuY2hhckF0KDApXG4gICAgICAgICAgICAgICAgICAgICAgLnRvVXBwZXJDYXNlKCkgK1xuICAgICAgICAgICAgICAgICAgIHR4dC5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSk7XG59XG5cbmZ1bmN0aW9uIGJpbmRQb3B1cCAobGF5ZXIpIHtcbiAgICB2YXIga2V5c190b19ub3RfaW5jbHVkZSA9WydpZCcsXG4gICAgICAgICdtYXJrZXItY29sb3InLFxuICAgICAgICAnbWFya2VyLXNpemUnLFxuICAgICAgICAnbWFya2VyLXN5bWJvbCddO1xuXG4gICAgdmFyIGFsbF9rZXlzID0gT2JqZWN0LmtleXMobGF5ZXIuZmVhdHVyZS5wcm9wZXJ0aWVzKTtcbiAgICB2YXIgcG9wdXBfY29udGVudF9kYXRhID0gW107XG5cbiAgICBhbGxfa2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIGlmIChrZXlzX3RvX25vdF9pbmNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICBwb3B1cF9jb250ZW50X2RhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGssXG4gICAgICAgICAgICAgICAgdmFsdWU6IGxheWVyLmZlYXR1cmUucHJvcGVydGllc1trXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGJ1aWxkX2Rpdi5odG1sKCcnKTtcbiAgICBidWlsZF9kaXYuc2VsZWN0QWxsKCcubWV0YWRhdGEnKVxuICAgICAgICAuZGF0YShwb3B1cF9jb250ZW50X2RhdGEpXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRhZGF0YScpXG4gICAgICAgIC5jYWxsKHBvcHVwX3N0cnVjdHVyZSk7XG5cbiAgICB2YXIgY29udGVudCA9IGJ1aWxkX2Rpdi5odG1sKCk7XG5cbiAgICBsYXllci5iaW5kUG9wdXAoY29udGVudCk7XG5cbiAgICBmdW5jdGlvbiBwb3B1cF9zdHJ1Y3R1cmUgKHNlbCkge1xuICAgICAgICBzZWwuYXBwZW5kKCdwJylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRhZGF0YS1sYWJlbCcpXG4gICAgICAgICAgICAuaHRtbChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b1RpdGxlQ2FzZShkLmxhYmVsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBzZWwuYXBwZW5kKCdwJylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRhZGF0YS12YWx1ZScpXG4gICAgICAgICAgICAuaHRtbChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxufSJdfQ==
