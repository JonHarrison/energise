"use strict;"

// Based on the following examples
// https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal
// https://developers.google.com/maps/documentation/javascript/examples/places-searchbox#maps_places_searchbox-html
// https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete#maps_places_autocomplete-html
// https://developers.google.com/maps/documentation/javascript/controls
// https://developers.google.com/maps/documentation/javascript/marker-clustering#maps_marker_clustering-html
// https://developers.google.com/maps/documentation/javascript/infowindows
// https://support.google.com/fusiontables/answer/171216?hl=en
// https://codepen.io/MMASK/pen/RVqLoG
// https://stackoverflow.com/questions/5634991/styling-google-maps-infowindow
// https://michaelsoriano.com/customize-google-map-info-windows-infobox/
// https://www.storemapper.com/support/knowledge-base/customize-google-maps-info-window/
// https://codeshare.co.uk/blog/how-to-style-the-google-maps-popup-infowindow/

// logging
const log_level = 0;
var log = function () { if (log_level > 0) { console.log.apply(this, arguments); } }
const error_level = 1;
var error = function () { if (error_level > 0) { console.error.apply(this, arguments); } }

let map;
let markers = []; // map markers for EV points
let infoWindow;

const defaultGeocode = { lat: 51.509865, lon: -0.118092 }; // initial location - central London

function addEVMarkers(data) {

  const chargePointIcon = new google.maps.MarkerImage('./assets/icons/charging-station-solid.svg',
    null, null, null, new google.maps.Size(30, 30));

  // You can use a LatLng literal in place of a google.maps.LatLng object when
  // creating the Marker object. Once the Marker object is instantiated, its
  // position will be available as a google.maps.LatLng object. In this case,
  // we retrieve the marker's position using the
  // google.maps.LatLng.getPosition() method.
  const infoWindow = new google.maps.InfoWindow({
    content: "",
    disableAutoPan: true
  });

  const markers = data.map((entry) => {
    log(`lat:${entry.AddressInfo.Latitude} lon:${entry.AddressInfo.Longitude} : ${entry.AddressInfo.AddressLine1},${entry.AddressInfo.AddressLine2},${entry.AddressInfo.Postcode}`);

    const { AddressInfo, AddressInfo: { Latitude: lat, Longitude: lng },
      ...rest
    } = entry;


    // Add marker
    const marker = new google.maps.Marker({
      // The below line is equivalent to writing:
      // position: new google.maps.LatLng(-34.397, 150.644)
      position: { lat: lat, lng: lng },
      //map: map,
      draggable: false, // fixed pin
      icon: chargePointIcon,
    });

    marker.addListener("click", () => {
      infoWindow.close();
      infoWindow.setContent("<p>Marker Location:" + marker.getPosition() + "</p>");
      infoWindow.open(map, marker);
    });

    return marker;

  });

  // Add a marker clusterer to manage the markers.
  const markerCluster = new markerClusterer.MarkerClusterer({ map, markers });

}

function retrieveEVMarkers(geocode) {
  const APIKey = 'd3723cbe-33e1-4377-b08c-33f88d7ae336';
  const radius = 10; // miles
  const radiusUnits = 'miles';
  const client = 'Energise'; // app name
  const maxResults = 50;
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
    mapTypeId: "roadmap", // google.maps.mapTypeId.ROADMAP,
    styles: mapStyles,
    zoom: 15, // zoom to a scale of 200m per unit
    zoomControl: true,
    fullscreenControl: true,
    mapTypeControl: false, // prevent swapping between map and satellite
    rotateControl: true,
    scaleControl: true,
    streetViewControl: true
  };

  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  retrieveEVMarkers(defaultGeocode);

  // Create the search box and link it to the UI element.
  const card = document.getElementById("pac-card");
  const input = document.getElementById("pac-input");
  const searchBox = new google.maps.places.SearchBox(input);

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

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

      geocode = { lat: place.geometry.location.lat(), lon: place.geometry.location.lng() };
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
