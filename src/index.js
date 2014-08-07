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