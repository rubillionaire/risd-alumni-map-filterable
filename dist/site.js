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

    var self = function () {
        filter_string = selection_input.property('value').toLowerCase();
        featureLayer.setFilter(show_title_industry);
        featureLayer.eachLayer(bindPopup);
    };

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
                return bool;
            }
            if ("title" in feature.properties &
                feature.properties.title
                    .toLowerCase()
                    .indexOf(filter_string) !== -1) {
                bool = true;
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
    var filter = Filter().input(d3.select('#filter-map-input')).featureLayer(alumni);
    // end filter

    // popup
    

    alumni.eachLayer(bindPopup);
    // end popup

    // map zoom
    // var el_map_control_zoom_in = document.getElementById('map-control-zoom-in');
    // var el_map_control_zoom_out = document.getElementById('map-control-zoom-out');

});

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
function toTitleCase(str)
{
    return str.replace(/\w\S*/g,
        function(txt){
            return txt.charAt(0)
                      .toUpperCase() +
                   txt.substr(1).toLowerCase();
        });
}
function normalize_key (key) {
    return key.trim().toLowerCase().replace(/ /g, "-");
}
function normalize_value (value) {
    // temporarily fixing category values that end in +
    // supposed to be: 50+
    // entered as: 50 +
    return value.trim().substr(value.length - 1) === "+" ?
        value.trim().replace(/ /g, "") : value.trim();
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
}
},{}]},{},["/Users/rubenrodriguez/Documents/commisions/risd_media/risd-alumni-map-filterable/src/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ydWJlbnJvZHJpZ3Vlei9Eb2N1bWVudHMvY29tbWlzaW9ucy9yaXNkX21lZGlhL3Jpc2QtYWx1bW5pLW1hcC1maWx0ZXJhYmxlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcnViZW5yb2RyaWd1ZXovRG9jdW1lbnRzL2NvbW1pc2lvbnMvcmlzZF9tZWRpYS9yaXNkLWFsdW1uaS1tYXAtZmlsdGVyYWJsZS9zcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGFwaV91cmwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9naXN0cy8nO1xudmFyIGdpc3RfaWQgPSAnODdjMzFkMmE0M2E3MDRiNGM0NDMnO1xuXG5MLm1hcGJveC5hY2Nlc3NUb2tlbiA9XG4gICAgXCJway5leUoxSWpvaVkyOXRiWFZ1YVhSNUxYSnBjMlFpTENKaElqb2lVbVwiICtcbiAgICBcIjl3YTI1SVJTSjkuY0UwdFloeVMtbXIzRGYzb3lXMTF2UVwiO1xuXG52YXIgRmlsdGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxlY3Rpb25faW5wdXQ7XG4gICAgdmFyIGZpbHRlcl9zdHJpbmc7XG4gICAgdmFyIGZlYXR1cmVMYXllcjtcblxuICAgIHZhciBzZWxmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmaWx0ZXJfc3RyaW5nID0gc2VsZWN0aW9uX2lucHV0LnByb3BlcnR5KCd2YWx1ZScpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGZlYXR1cmVMYXllci5zZXRGaWx0ZXIoc2hvd190aXRsZV9pbmR1c3RyeSk7XG4gICAgICAgIGZlYXR1cmVMYXllci5lYWNoTGF5ZXIoYmluZFBvcHVwKTtcbiAgICB9O1xuXG4gICAgc2VsZi5pbnB1dCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNlbGVjdGlvbl9pbnB1dDtcbiAgICAgICAgc2VsZWN0aW9uX2lucHV0ID0geDtcbiAgICAgICAgc2VsZWN0aW9uX2lucHV0Lm9uKCdrZXl1cCcsIHNlbGYpO1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICAgIHNlbGYuZmVhdHVyZUxheWVyID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZmVhdHVyZUxheWVyO1xuICAgICAgICBmZWF0dXJlTGF5ZXIgPSB4O1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc2hvd190aXRsZV9pbmR1c3RyeShmZWF0dXJlKSB7XG4gICAgICAgIHZhciBib29sID0gZmFsc2U7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICgnSW5kdXN0cnkgc2VjdG9yJyBpbiBmZWF0dXJlLnByb3BlcnRpZXMgJlxuICAgICAgICAgICAgICAgIGZlYXR1cmUucHJvcGVydGllc1snSW5kdXN0cnkgc2VjdG9yJ11cbiAgICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgLmluZGV4T2YoZmlsdGVyX3N0cmluZykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYm9vbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXCJ0aXRsZVwiIGluIGZlYXR1cmUucHJvcGVydGllcyAmXG4gICAgICAgICAgICAgICAgZmVhdHVyZS5wcm9wZXJ0aWVzLnRpdGxlXG4gICAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgIC5pbmRleE9mKGZpbHRlcl9zdHJpbmcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGJvb2wgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBib29sO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gUHJvcGVydHkgdG8gZmlsdGVyIGRvZXMgbm90IGV4aXN0LiBBbmQgdGhhdHMgZmluZS4gUmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG59O1xuXG52YXIgbWFwID0gTC5tYXBib3gubWFwKCdtYXAnLCAnY29tbXVuaXR5LXJpc2QuaTg3ZTJpNW8nKVxuICAgIC5zZXRWaWV3KFs0MS43OTYsIC03MS44MDFdLCA4KTtcbkwuaGFzaChtYXApO1xuXG5cbnZhciBidWlsZF9kaXYgPSBkMy5zZWxlY3QoJ2JvZHknKVxuICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgLnN0eWxlKCdkaXNwbGF5JywgJ25vbmUnKTtcblxuZDMuanNvbihhcGlfdXJsICsgZ2lzdF9pZCwgZnVuY3Rpb24gKGdpc3QpIHtcbiAgICB2YXIgZ2VvanNvbiA9IEpTT04ucGFyc2UoZ2lzdC5maWxlc1snbWFwLmdlb2pzb24nXS5jb250ZW50KTtcblxuICAgIHZhciBhbHVtbmkgPSBMLm1hcGJveFxuICAgICAgICAuZmVhdHVyZUxheWVyKGdlb2pzb24pO1xuXG4gICAgYWx1bW5pLmFkZFRvKG1hcCk7XG5cbiAgICAvLyBmaWx0ZXJcbiAgICB2YXIgZmlsdGVyID0gRmlsdGVyKCkuaW5wdXQoZDMuc2VsZWN0KCcjZmlsdGVyLW1hcC1pbnB1dCcpKS5mZWF0dXJlTGF5ZXIoYWx1bW5pKTtcbiAgICAvLyBlbmQgZmlsdGVyXG5cbiAgICAvLyBwb3B1cFxuICAgIFxuXG4gICAgYWx1bW5pLmVhY2hMYXllcihiaW5kUG9wdXApO1xuICAgIC8vIGVuZCBwb3B1cFxuXG4gICAgLy8gbWFwIHpvb21cbiAgICAvLyB2YXIgZWxfbWFwX2NvbnRyb2xfem9vbV9pbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAtY29udHJvbC16b29tLWluJyk7XG4gICAgLy8gdmFyIGVsX21hcF9jb250cm9sX3pvb21fb3V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcC1jb250cm9sLXpvb20tb3V0Jyk7XG5cbn0pO1xuXG5mdW5jdGlvbiBwb3B1cF9zdHJ1Y3R1cmUgKHNlbCkge1xuICAgIHNlbC5hcHBlbmQoJ3AnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbWV0YWRhdGEtbGFiZWwnKVxuICAgICAgICAuaHRtbChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRvVGl0bGVDYXNlKGQubGFiZWwpO1xuICAgICAgICB9KTtcbiAgICBzZWwuYXBwZW5kKCdwJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldGFkYXRhLXZhbHVlJylcbiAgICAgICAgLmh0bWwoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkLnZhbHVlO1xuICAgICAgICB9KTtcbn1cbmZ1bmN0aW9uIHRvVGl0bGVDYXNlKHN0cilcbntcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcd1xcUyovZyxcbiAgICAgICAgZnVuY3Rpb24odHh0KXtcbiAgICAgICAgICAgIHJldHVybiB0eHQuY2hhckF0KDApXG4gICAgICAgICAgICAgICAgICAgICAgLnRvVXBwZXJDYXNlKCkgK1xuICAgICAgICAgICAgICAgICAgIHR4dC5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSk7XG59XG5mdW5jdGlvbiBub3JtYWxpemVfa2V5IChrZXkpIHtcbiAgICByZXR1cm4ga2V5LnRyaW0oKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyAvZywgXCItXCIpO1xufVxuZnVuY3Rpb24gbm9ybWFsaXplX3ZhbHVlICh2YWx1ZSkge1xuICAgIC8vIHRlbXBvcmFyaWx5IGZpeGluZyBjYXRlZ29yeSB2YWx1ZXMgdGhhdCBlbmQgaW4gK1xuICAgIC8vIHN1cHBvc2VkIHRvIGJlOiA1MCtcbiAgICAvLyBlbnRlcmVkIGFzOiA1MCArXG4gICAgcmV0dXJuIHZhbHVlLnRyaW0oKS5zdWJzdHIodmFsdWUubGVuZ3RoIC0gMSkgPT09IFwiK1wiID9cbiAgICAgICAgdmFsdWUudHJpbSgpLnJlcGxhY2UoLyAvZywgXCJcIikgOiB2YWx1ZS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGJpbmRQb3B1cCAobGF5ZXIpIHtcbiAgICB2YXIga2V5c190b19ub3RfaW5jbHVkZSA9WydpZCcsXG4gICAgICAgICdtYXJrZXItY29sb3InLFxuICAgICAgICAnbWFya2VyLXNpemUnLFxuICAgICAgICAnbWFya2VyLXN5bWJvbCddO1xuXG4gICAgdmFyIGFsbF9rZXlzID0gT2JqZWN0LmtleXMobGF5ZXIuZmVhdHVyZS5wcm9wZXJ0aWVzKTtcbiAgICB2YXIgcG9wdXBfY29udGVudF9kYXRhID0gW107XG5cbiAgICBhbGxfa2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIGlmIChrZXlzX3RvX25vdF9pbmNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICBwb3B1cF9jb250ZW50X2RhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGssXG4gICAgICAgICAgICAgICAgdmFsdWU6IGxheWVyLmZlYXR1cmUucHJvcGVydGllc1trXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGJ1aWxkX2Rpdi5odG1sKCcnKTtcbiAgICBidWlsZF9kaXYuc2VsZWN0QWxsKCcubWV0YWRhdGEnKVxuICAgICAgICAuZGF0YShwb3B1cF9jb250ZW50X2RhdGEpXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRhZGF0YScpXG4gICAgICAgIC5jYWxsKHBvcHVwX3N0cnVjdHVyZSk7XG5cbiAgICB2YXIgY29udGVudCA9IGJ1aWxkX2Rpdi5odG1sKCk7XG5cbiAgICBsYXllci5iaW5kUG9wdXAoY29udGVudCk7XG59Il19
