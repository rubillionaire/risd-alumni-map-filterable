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
            sector !== '') {

            if (sectors.indexOf(sector.trim())  === -1) {
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