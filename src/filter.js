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