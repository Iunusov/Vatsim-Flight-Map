"use strict";
var PolyLine = function () {
    this.draw = function (map, id, coords) {
        var geojson = {
            "type": "FeatureCollection",
            "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "properties": {},
                        "coordinates": coords
                    }
                }
            ]
        };
        map.addLayer({
            "id": id,
            "type": "line",
            "source": {
                "type": "geojson",
                "data": geojson
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": "#FF0000",
                "line-width": 2
            }
        });
    };
    this.clear = function (map, id) {
        if (map.getLayer(id) != undefined) {
            map.removeLayer(id);
        }
        if (map.getSource(id) != undefined) {
            map.removeSource(id);
        }
    };
};
module.exports = PolyLine;
