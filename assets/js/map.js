// Based on the following examples
// https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal
// https://developers.google.com/maps/documentation/javascript/examples/places-searchbox#maps_places_searchbox-html

let map;

const defaultGeocode = { lat: 51.509865, lon: -0.118092 }; // London

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
        zoom: 12,
        styles: mapStyles,
        mapTypeId: "roadmap" // google.maps.mapTypeId.ROADMAP,
    };

    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    var icon = {

        path: "M96 0C60.7 0 32 28.7 32 64V448c-17.7 0-32 14.3-32 32s14.3 32 32 32H320c17.7 0 32-14.3 32-32s-14.3-32-32-32V304h16c22.1 0 40 17.9 40 40v32c0 39.8 32.2 72 72 72s72-32.2 72-72V252.3c32.5-10.2 56-40.5 56-76.3V144c0-8.8-7.2-16-16-16H544V80c0-8.8-7.2-16-16-16s-16 7.2-16 16v48H480V80c0-8.8-7.2-16-16-16s-16 7.2-16 16v48H432c-8.8 0-16 7.2-16 16v32c0 35.8 23.5 66.1 56 76.3V376c0 13.3-10.7 24-24 24s-24-10.7-24-24V344c0-48.6-39.4-88-88-88H320V64c0-35.3-28.7-64-64-64H96zM216.9 82.7c6 4 8.5 11.5 6.3 18.3l-25 74.9H256c6.7 0 12.7 4.2 15 10.4s.5 13.3-4.6 17.7l-112 96c-5.5 4.7-13.4 5.1-19.3 1.1s-8.5-11.5-6.3-18.3l25-74.9H96c-6.7 0-12.7-4.2-15-10.4s-.5-13.3 4.6-17.7l112-96c5.5-4.7 13.4-5.1 19.3-1.1z",
        fillColor: '#FF0000',
        fillOpacity: .6,
        anchor: new google.maps.Point(0,0),
        strokeWeight: 0,
        scale: 1
    };

    // Add marker
    const marker = new google.maps.Marker({
        // The below line is equivalent to writing:
        // position: new google.maps.LatLng(-34.397, 150.644)
        position: { lat: defaultGeocode.lat, lng: defaultGeocode.lon },
        map: map,
        draggable: false,
        icon: new google.maps.MarkerImage('./assets/icons/charging-station-solid.svg',
            null, null, null, new google.maps.Size(30,30)),
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
    // searchBox.addListener("places_changed", () => {
    //     const places = searchBox.getPlaces();

    //     if (places.length == 0) {
    //         return;
    //     }

    //     // Clear out the old markers.
    //     markers.forEach((marker) => {
    //         marker.setMap(null);
    //     });
    //     markers = [];

    //     // For each place, get the icon, name and location.
    //     const bounds = new google.maps.LatLngBounds();

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
    //     map.fitBounds(bounds);
    // });

}

window.initAutocomplete = initAutocomplete;
