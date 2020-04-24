import React, { useEffect } from "react";
import mapbox, { MapboxOptions, LngLatLike } from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import styles from '../styles/WorldMap.module.css';

export interface WorldMapProps {
    width?: number;
    height?: number;
    marginLR?: number;
    marginTB?: number;
    geoData?: any[];
    colorScheme: ColorScheme[];
    center?: LngLatLike;
    style?: string;
    zoom?: number;
    selectedCountry: (country: string) => void;
}

export interface ColorScheme {
    value: number;
    color: string | number;
}

export interface GeoData {
    province: string;
    country: string;
    coordinates: number[];
    value: number;
}


function WorldMap({
    geoData = [],
    selectedCountry,
    colorScheme,
    center = [25.4858, 42.7339],
    style = "mapbox://styles/mapbox/dark-v10",
    zoom = 0
}: WorldMapProps) {

    useEffect(() => {
        
        mapbox.accessToken =
            "pk.eyJ1IjoiZHBhbHlvdiIsImEiOiJjazhhaWNnN2IwMjI2M2ZxZjk0YXQ1c21zIn0.pdOwV4A8O6Q7ALRNl2vEAg";
        const opts: MapboxOptions = {
            doubleClickZoom: true,
            container: "map",
            style: style,
            center: center,
            zoom: zoom
        };
        var map = new mapbox.Map(opts);

        map.addControl(
            new MapboxGeocoder({
                accessToken: mapbox.accessToken,
                mapboxgl: mapbox,
            })
        );

        map.on("load", function () {

            map.addSource("polygons", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: geoData.map((d, i) => {
                        return { id: i, ...d };
                    }),
                },
            });

            map.addLayer(
                {
                    id: "countries",
                    type: "fill",
                    source: "polygons",
                    paint: {
                        "fill-color": [
                            "interpolate",
                            ["linear"],
                            ["get", "cases"],
                            colorScheme[0].value,
                            colorScheme[0].color,
                            colorScheme[1].value,
                            colorScheme[1].color,
                            colorScheme[2].value,
                            colorScheme[2].color,
                            colorScheme[3].value,
                            colorScheme[3].color,
                            colorScheme[4].value,
                            colorScheme[4].color,
                            colorScheme[5].value,
                            colorScheme[5].color
                        ],
                        
                    },
                },
                "waterway-label"
            );

            map.addLayer({
                id: "hover-fill",
                type: 'fill',
                source: 'polygons',
                paint: {
                    "fill-color" : "#fff",
                    "fill-opacity": [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        0.5,
                        0
                    ]
                }
            })

            map.addLayer({
                id: "borders",
                type: "line",
                source: "polygons",
                paint: {
                    "line-color": "white",
                    "line-width": 0.5,
                },
            });

            map.addLayer({
                type: "symbol",
                id: "text-symbol",
                source: "polygons",
                layout: {
                    "text-field": ["get", "cases"],
                },
                paint: {
                    "text-color": "black",
                    "text-opacity": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        2,
                        0,
                        5,
                        1,
                    ],
                },
            });
        });

        let hoverstateId = null;
        map.on("mousemove", "countries", (e) => {
            if (e.features.length > 0) {
                if (hoverstateId) {

                    map.setFeatureState(
                        {
                            source: "polygons",
                            id: hoverstateId,
                        },
                        {
                            hover: false,
                        }
                    );
                }
                hoverstateId = e.features[0].id;
                map.getCanvas().style.cursor = "pointer";
                map.setFeatureState(
                    {
                        source: "polygons",
                        id: hoverstateId,
                    },
                    {
                        hover: true,
                    }
                );

              
            }
        });

        map.on("mouseleave", "countries", (e) => {
            if (hoverstateId) {
                map.setFeatureState(
                    {
                        source: "polygons",
                        id: hoverstateId,
                    },
                    {
                        hover: false,
                    }
                );
            }
            map.getCanvas().style.cursor = "";
            hoverstateId = null;
        });

        map.on("click", "countries", (e) => {
            if (e.features.length > 0) {
                selectedCountry(e.features[0].properties.sovereignt);
            }
        });

        return () => {};
    }, [geoData]);

    return (
            <div className={styles.map} id="map">
                <div className={styles.legend}>
                    {colorScheme.map((c:ColorScheme,i:number) => {
                       return <div key={i} className={styles.legendItem}><span><label style={{backgroundColor: `${c.color}`}}>&nbsp;</label> >={c.value}</span></div>
                    })}
                </div>
            </div>
    );
}

export default WorldMap;
