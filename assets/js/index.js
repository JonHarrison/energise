"use strict;"

// Based on the following examples
// https://developers.google.com/maps/documentation/javascript/examples/map-latlng-literal
// https://developers.google.com/maps/documentation/javascript/examples/places-searchbox#maps_places_searchbox-html
// https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete#maps_places_autocomplete-html
// https://developers.google.com/maps/documentation/javascript/controls
// https://developers.google.com/maps/documentation/javascript/marker-clustering#maps_marker_clustering-html
// https://developers.google.com/maps/documentation/javascript/infowindows
// https://github.com/googlearchive/js-info-bubble
// https://stackoverflow.com/questions/1556921/google-map-api-v3-set-bounds-and-center
// https://stackoverflow.com/questions/8229827/update-markercluster-after-removing-markers-from-array
// https://stackoverflow.com/questions/3994606/how-to-add-tabs-to-infowindow-which-uses-extinfowindows-for-google-map
// https://stackoverflow.com/questions/5177705/google-maps-infowindow-not-showing-the-tabs-as-it-should
// https://stackoverflow.com/questions/5634991/styling-google-maps-infowindow
// https://support.google.com/fusiontables/answer/171216?hl=en
// https://codepen.io/MMASK/pen/RVqLoG
// https://michaelsoriano.com/customize-google-map-info-windows-infobox/
// https://www.storemapper.com/support/knowledge-base/customize-google-maps-info-window/
// https://codeshare.co.uk/blog/how-to-style-the-google-maps-popup-infowindow/
// https://codepen.io/deand/pen/qEGXmV

// logging
const log_level = 0;
var log = function () { if (log_level > 0) { console.log.apply(this, arguments); } }
const error_level = 1;
var error = function () { if (error_level > 0) { console.error.apply(this, arguments); } }

let map;
let markerCluster; // map markers for EV points
let coffeeMarkers = []; // array for coffee shop markers (so that the can be removed)
let infoBubble;
let infoWindow;
let service;

const defaultGeocode = { lat: 51.509865, lon: -0.118092 }; // initial location - central London

function addEVMarkers(data) {

  const chargePointIcon = new google.maps.MarkerImage('./assets/icons/charging-station-solid.svg',
    null, null, null, new google.maps.Size(30, 30));

  const infoBubble = new InfoBubble({
    map: map,
    content: '<div class="infotext">Some label</div>',
    // position: LatLng,
    shadowStyle: 1,
    padding: 10,
    borderRadius: 5,
    minHeight: 450,
    // maxHeight: 300,
    minWidth: 250,
    // maxWidth: 200,
    arrowSize: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    disableAutoPan: false, /* false - allow map to move the centralise info window */
    hideCloseButton: false,
    arrowPosition: 30,
    backgroundClassName: 'info',
    arrowStyle: 0
  });


  // bounds, updated for each marker
  var bounds = new google.maps.LatLngBounds();

  const markers = data.map((entry) => {
    log(`lat:${entry.AddressInfo.Latitude} lon:${entry.AddressInfo.Longitude} : ${entry.AddressInfo.AddressLine1},${entry.AddressInfo.AddressLine2},${entry.AddressInfo.Postcode}`);

    // destructure JSON object
    const {
      AddressInfo: { Latitude: lat, Longitude: lng, Title: addTitle, AddressLine1: ad1, AddressLine2: ad2, Postcode: ad3 },
      Connections: { ID: id, ConnectionType, Quantity: qty },
      UsageCost: cost,
      DateLastVerified: verified,
      OperatorInfo: { ContactEmail : opEmail, PhonePrimaryContact: opPhone, WebsiteURL : opURL, Title: opTitle },
      ...rest
    } = entry || {};
    // need to handle fields which may be null separately
    const operational = (entry.StatusType && entry.StatusType.Title !== null) ? entry.StatusType.Title : 'Undefined';
  
    var LatLng = new google.maps.LatLng(lat, lng); //parseFloat(lat), parseFloat(lng));

    // Add marker
    const marker = new google.maps.Marker({
      position: LatLng,
      animation: google.maps.Animation.DROP,
      //map: map,
      draggable: false, // fixed pin
      icon: chargePointIcon,
    });

    marker.addListener("click", () => {

      const utcToLocal = (utc) => { var utcDate = new Date(verified); return utcDate.toLocaleDateString(); }
      const elmToString = (tag,value,nullStr="") => {
        return (value !== null) ? `<${tag}>${value}</${tag}>` : nullStr;
      }

      const addressElement = () => {
        var html = 
        elmToString('p', ad1) +
        elmToString('p', ad2) +
        elmToString('p', ad3) +
        elmToString('p', `(LAT:${lat.toFixed(4)},LON:${lng.toFixed(4)})`) +
        '<hr>'; 
        return html;
      }

      const statusElement = () => {
        return (entry.StatusType !== null) ? (`<p>${entry.StatusType.Title}<p>${utcToLocal(verified)}<hr>`) : ('<p>UNVERIFIED</p><hr>') ;
      }

      const costElement = () => {
        var html = 
        elmToString('p', cost) +
        '<hr>';
        return html;
      }

      const contactElement = () => {
        var html = 
        elmToString('p', opTitle) +
        elmToString('p', opPhone);
        html += (opEmail !== null) ? `<p><a href="mailto:${opEmail}">${opEmail}</a></p>` : "";
        html += (opURL !== null) ? `<p><a href="${opURL}">${opURL}</a></p>` : "";
        html += '<hr>';
        return html;
      }

      var locationTab =
        '<div id="locationTab" class="infotab iw-container">' +
        // '<div class="iw-title">Location</div>' +
          '<div class="iw-content">' +
          `<div class="iw-subTitle">${addTitle}</div>` +
            addressElement() + 
            statusElement() +
            costElement() +
            contactElement() +
          '</div>' +
        '</div>';

      var chargerTab = [
        '<div id="chargerTab">',
        '<h4>Charger details</h4>',
        '<p>Charger details</p>',
        '</div>',
      ].join('');
      
      infoBubble.position = LatLng;

      // clear existing tabs first to avoid duplication
      infoBubble.removeTab(1);
      infoBubble.removeTab(0);

      infoBubble.addTab('Location', locationTab);
      infoBubble.addTab('Charger', chargerTab);
      
      infoBubble.open(map, marker);
    });

    bounds.extend(LatLng); // extend bounds to include this marker

    return marker;

  });

  // Add a marker clusterer to manage the markers.
  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });

  map.fitBounds(bounds); // adjust map to ensure all markers are visible

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

function createCafeMarker(place) {
  if (!place.geometry || !place.geometry.location) return;

  var markerImage = {
    url: place.icon_mask_base_uri + '.svg',
    scaledSize: new google.maps.Size(30, 30)
  };
  const marker = new google.maps.Marker({
    map,
    position: place.geometry.location,
    animation: google.maps.Animation.DROP,
    icon: markerImage
  });

  coffeeMarkers.push(marker); // record marker so that it can be cleared if the search location changes

  marker.addListener("click", () => {
    infoWindow.setContent(`<p>${place.name}</p><p>${place.formatted_address}</p>`);
    infoWindow.open(map, marker);
  });
}

function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createCafeMarker(results[i]);
    }
  }
}

function retrieveCafeMarkers(geocode) {

  var LatLng = new google.maps.LatLng(geocode.lat, geocode.lon); //parseFloat(lat), parseFloat(lng));

  var cafeRequest = {
    // bounds: map.getBounds(),
    location: LatLng,
    radius: '16093.4', // 10 miles in meters
  };

  // need to do search in multiple requests as you can only search for one item at a time
  var queries = [ 'coffee shop', 'cafe', 'coffee'];
  queries.forEach((query) => {
    cafeRequest.query = query;
    service.textSearch(cafeRequest, callback);
  });

  // finally search by type
  cafeRequest.query = "";
  cafeRequest.type = ["cafe"];
  service.textSearch(cafeRequest, callback);

}

function addMarkers(geocode) {
  retrieveEVMarkers(geocode);
  retrieveCafeMarkers(geocode);
}

function clearMarkers() {
  // Clear out the old markers.
  markerCluster.clearMarkers();

  for (let i = 0; i < coffeeMarkers.length; i++) {
    if (coffeeMarkers[i]) {
      coffeeMarkers[i].setMap(null);
    }
  }

  coffeeMarkers = [];
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

  infoWindow = new google.maps.InfoWindow({ content: "", disableAutoPan: true });

  service = new google.maps.places.PlacesService(map); // places search service

  addMarkers(defaultGeocode);

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

    clearMarkers();

    log(places);

    var geocode;
    // For each place, get the location / viewport to extract the latitude and longitude.
    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        error("Returned place contains no geometry");
        return;
      }
      geocode = { lat: place.geometry.location.lat(), lon: place.geometry.location.lng() };
    });

    addMarkers(geocode);

  });

}

window.initAutocomplete = initAutocomplete;
