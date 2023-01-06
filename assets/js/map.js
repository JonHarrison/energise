// Based on the following examples
// https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal
// https://developers.google.com/maps/documentation/javascript/examples/places-searchbox#maps_places_searchbox-html

let map;
let markers = [];

const defaultGeocode = { lat: 51.509865, lon: -0.118092 }; // London

function addEVMarkers(data) {

    // Clear out the old markers.
    markers.forEach((marker) => {
        marker.setMap(null);
    });
    markers = [];

    var icon = new google.maps.MarkerImage('./assets/icons/charging-station-solid.svg',
    null, null, null, new google.maps.Size(30, 30));

    data.forEach(function (entry) {
        console.log(`lat:${entry.AddressInfo.Latitude} lon:${entry.AddressInfo.Longitude} : ${entry.AddressInfo.AddressLine1},${entry.AddressInfo.AddressLine2},${entry.AddressInfo.Postcode}`);

        const { AddressInfo, AddressInfo: { Latitude: lat, Longitude: lng },
            ...rest
        } = entry;

        // Add marker
        var marker = new google.maps.Marker({
                // The below line is equivalent to writing:
                // position: new google.maps.LatLng(-34.397, 150.644)
                position: { lat: lat, lng: lng },
                map: map,
                draggable: false,
                icon: icon,
            });

        // You can use a LatLng literal in place of a google.maps.LatLng object when
        // creating the Marker object. Once the Marker object is instantiated, its
        // position will be available as a google.maps.LatLng object. In this case,
        // we retrieve the marker's position using the
        // google.maps.LatLng.getPosition() method.
        const infowindow = new google.maps.InfoWindow({
            content: "<p>Marker Location:" + marker.getPosition() + "</p>",
        });

        google.maps.event.addListener(marker, "click", () => {
            infowindow.open(map, marker);
        });

        markers.push(marker);

    });

}

function retrieveEVMarkers(geocode)
{
    const radius = 10; // miles
    const radiusUnits = 'miles';
    const queryURL = `https://api.openchargemap.io/v3/poi?key={APIKey}&latitude=${geocode.lat}&longitude=${geocode.lon}&distance=${radius}&distanceunit=${radiusUnits}`;
    const options = { method: 'GET', /*mode: 'cors',*/ headers: { 'Content-Type': 'application/json', /*'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*'*/ } };
    fetch(queryURL, options)
        .then((response) => {
            if (!response.ok) {
            throw new Error(response.error)
        }
        return response.json();
    })
    .then(data => {
        console.log(data)
        addEVMarkers(data);
    })
    .catch(err => {
        console.error(err)
        return err;
    });
}

function initAutocomplete() {

    const mapStyles = [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [
                  { visibility: "off" }
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
    //     const places = searchBox.getPlaces();

    //     if (places.length == 0) {
    //         return;
    //     }

    //     // Clear out the old markers.
    //     markers.forEach((marker) => {
    //         marker.setMap(null);
    //     });
    //     markers = [];

        // For each place, get the icon, name and location.
        const bounds = new google.maps.LatLngBounds();

    //     places.forEach((place) => {
    //         if (!place.geometry || !place.geometry.location) {
    //             console.log("Returned place contains no geometry");
    //             return;
    //         }

    //         const icon = {
    //             url: place.icon,
    //             size: new google.maps.Size(71, 71),
    //             origin: new google.maps.Point(0, 0),
    //             anchor: new google.maps.Point(17, 34),
    //             scaledSize: new google.maps.Size(25, 25),
    //         };

    //         // Create a marker for each place.
    //         markers.push(
    //             new google.maps.Marker({
    //                 map,
    //                 icon,
    //                 title: place.name,
    //                 position: place.geometry.location,
    //             })
    //         );
    //         if (place.geometry.viewport) {
    //             // Only geocodes have viewport.
    //             bounds.union(place.geometry.viewport);
    //         } else {
    //             bounds.extend(place.geometry.location);
    //         }
    //     });
        map.fitBounds(bounds);
    });

}

window.initAutocomplete = initAutocomplete;
