// Based on the following examples
// https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal
// https://developers.google.com/maps/documentation/javascript/examples/places-searchbox#maps_places_searchbox-html

// logging
const log_level = 0;
var log = function () { if (log_level > 0) { console.log.apply(this, arguments); } }
const error_level = 1;
var error = function () { if (error_level > 0) { console.error.apply(this, arguments); } }

let map;
let markers = []; // map markers for EV points

const defaultGeocode = { lat: 51.509865, lon: -0.118092 }; // initial location - central London

function addEVMarkers(data) {

    // Clear out the old markers.
    markers.forEach((marker) => {
        marker.setMap(null);
    });
    markers = [];

    const chargePointIcon = new google.maps.MarkerImage('./assets/icons/charging-station-solid.svg',
    null, null, null, new google.maps.Size(30, 30));

    data.forEach(function (entry) {
        log(`lat:${entry.AddressInfo.Latitude} lon:${entry.AddressInfo.Longitude} : ${entry.AddressInfo.AddressLine1},${entry.AddressInfo.AddressLine2},${entry.AddressInfo.Postcode}`);

        const { AddressInfo, AddressInfo: { Latitude: lat, Longitude: lng },
            ...rest
        } = entry;

        // Add marker
        var marker = new google.maps.Marker({
                // The below line is equivalent to writing:
                // position: new google.maps.LatLng(-34.397, 150.644)
                position: { lat: lat, lng: lng },
                map: map,
                draggable: false, // fixed pin
                icon: chargePointIcon,
            });

        // You can use a LatLng literal in place of a google.maps.LatLng object when
        // creating the Marker object. Once the Marker object is instantiated, its
        // position will be available as a google.maps.LatLng object. In this case,
        // we retrieve the marker's position using the
        // google.maps.LatLng.getPosition() method.
        const infowWndow = new google.maps.InfoWindow({
            content: "<p>Marker Location:" + marker.getPosition() + "</p>",
        });

        google.maps.event.addListener(marker, "click", () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);

    });

}

function retrieveEVMarkers(geocode)
{
    const APIKey = 'd3723cbe-33e1-4377-b08c-33f88d7ae336';
    const radius = 10; // miles
    const radiusUnits = 'miles';
    const client = 'Energise'; // app name
    const maxResults = 25;
    const queryURL = `https://api.openchargemap.io/v3/poi?key={APIKey}&latitude=${geocode.lat}&longitude=${geocode.lon}&distance=${radius}&distanceunit=${radiusUnits}&client=${client}&maxresults=${maxResults}`;
    const options = { method: 'GET', /*mode: 'cors',*/ headers: { 'Content-Type': 'application/json', /*'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*'*/ } };
    fetch(queryURL, options)
        .then((response) => {
            if (!response.ok) {
            throw new Error(response.error)
        }
        return response.json();
    })
    .then(data => {
        log(data)
        addEVMarkers(data);
    })
    .catch(err => {
        error(err)
        return err;
    });
}

function initAutocomplete() {

    const mapStyles = [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [
                  { visibility: "off" } // hide points of interest
            ]
        }
    ];

    const mapOptions = {
        center: { lat: defaultGeocode.lat, lng: defaultGeocode.lon },
        zoom: 14,
        styles: mapStyles,
        mapTypeId: "roadmap" // google.maps.mapTypeId.ROADMAP,
    };

    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    retrieveEVMarkers(defaultGeocode);

    // Create the search box and link it to the UI element.
    const input = document.getElementById("pac-input");
    const searchBox = new google.maps.places.SearchBox(input);

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds());
    });

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach((marker) => {
            marker.setMap(null);
        });
        markers = [];

        log(places);

        // For each place, get the location / viewport and extend the bounds.
        var geocode;
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
            if (!place.geometry || !place.geometry.location) {
                error("Returned place contains no geometry");
                return;
            }

            geocode = {lat: place.geometry.location.lat() , lon : place.geometry.location.lng() } ;
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds); // update the map to the new location
        retrieveEVMarkers(geocode); // get the new EV locations
    });

}

window.initAutocomplete = initAutocomplete;
