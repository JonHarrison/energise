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

let settings =
{
  demoMode: false,
  ev:
  {
    radius: 10, // search radius 
    radiusUnits: 'miles', // units [ 'miles' | 'km' ]
    maxResults: 50 // limit the number of results (de-clutter the map)
  },
  coffee: { radius: 500 }
};

// localStorage
const lsKEY = 'energise.settings';
function loadSettings() {
  try {
    const ls = localStorage.getItem(lsKEY);
    if (ls) {
      // settings in local storage
      settings = JSON.parse(ls) ?? [];
    }
    else {
      // nothing in ls (yet) so write out default settings for next time
      storeSettings();
    }
  }
  catch (err) {
    error(err);
  }
}

function storeSettings() {
  try {
    let lsString = JSON.stringify(settings);
    localStorage.setItem(lsKEY, lsString);
  }
  catch (err) {
    error(err);
  }
}

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
      OperatorInfo: { ContactEmail: opEmail, PhonePrimaryContact: opPhone, WebsiteURL: opURL, Title: opTitle },
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
      const elmToString = (tag, value, nullStr = "") => {
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
        return (entry.StatusType !== null) ? (`<p>${entry.StatusType.Title}<p>${utcToLocal(verified)}<hr>`) : ('<p>UNVERIFIED</p><hr>');
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

      const connectionElement = () => {
        var html = "";
        entry.Connections.forEach((connection) => {
          html += `<p>ID  : ${connection.ID}</p>`;
          html += `<p>${connection.ConnectionType.FormalName}</p>`;
          if (connection.Quantity !== null && connection.PowerKW !== null) {
            html += `<p>${connection.Quantity} x ${connection.PowerKW}kW</p>`;
          }
          else if (connection.PowerKW !== null) {
            html += `<p>${connection.PowerKW}kW</p>`;
          }
          if (connection.StatusType !== null) {
            if (connection.StatusType.IsOperational) {
              html += '<p><i class="fa-solid fa-circle-check"></i></p>';
            }
          }
          html += '<hr>';
         })
        return html;
      }

      var locationTab =
        '<div id="locationTab" class="infotab iw-container">' +
        // '<div class="iw-title">Location</div>' +
        '  <div class="iw-content">' +
        `    <div class="iw-subTitle">${addTitle}</div>` +
             addressElement() +
             statusElement() +
             costElement() +
             contactElement() +
        '  </div>' +
        '</div>';

      var chargerTab =
        '<div id="chargerTab" class="infotab iw-container">' +
        '  <div class="iw-content">' +
        `    <div class="iw-subTitle">Connections</div>` +
        '    <hr>' +
             connectionElement() +
        '  </div>' +
        '</div>';

      infoBubble.position = LatLng;

      // clear existing tabs first to avoid duplication
      infoBubble.removeTab(1);
      infoBubble.removeTab(0);

      infoBubble.addTab('Location', locationTab);
      infoBubble.addTab('Charger', chargerTab);

      infoBubble.open(map, marker);
    });

    bounds.extend(LatLng); // extend bounds to include this marker

    retrieveCafeMarkers(LatLng);

    return marker;

  });

  // Add a marker clusterer to manage the markers.
  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });

  map.fitBounds(bounds); // adjust map to ensure all markers are visible

}

function retrieveEVMarkers(geocode) {

  if (settings.demoMode) {
    var data = [];
    fetch('./assets/files/poi.json')
      .then(response => data = response.json())
      .then(data => { log(data); addEVMarkers(data); })
  }
  else {
  const APIKey = 'd3723cbe-33e1-4377-b08c-33f88d7ae336';
  const client = 'Energise'; // app name
  const queryURL = `https://api.openchargemap.io/v3/poi?key=${APIKey}&latitude=${geocode.lat}&longitude=${geocode.lon}&distance=${settings.ev.radius}&distanceunit=${settings.ev.radiusUnits}&client=${client}&maxresults=${settings.ev.maxResults}`;
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
}

function createCafeMarker(place) {
  if (!place.geometry || !place.geometry.location) return;

  var markerImage = {
    url: place.icon_mask_base_uri + '.svg',
    scaledSize: new google.maps.Size(30, 30)
  };

  const pathRoot = "./assets/icons/";

  const logos = [
    { 'id':'costa',           'img':"Costa-Coffee-logo-logotype.png"},
    { 'id':'starbucks',       'img':"Starbucks-Corporation-Logo-2011.svg" },
    { 'id':'origin',          'img':"logo-origin-coffee-roasters-300x121.png"},
    { 'id':'coffee island',   'img':"Coffee-Island-logo-2019.jpg"},
    { 'id':'caffè nero',      'img':"caffenero-logo-black-gold.png"},
    { 'id':'caffe nero',      'img':"caffenero-logo-black-gold.png"},
    { 'id':'coffee republic', 'img':"coffee-republic.png"},
    { 'id':'pret a manger',   'img':"pret-a-manger.png" },
    // Caffe 82
    // 49 Cafe
    // Caffe in
  ];

  let found = false;

  for (let logo of logos) {
    if (place.name.toLowerCase().includes(logo.id)) {
      markerImage.url = pathRoot + logo.img;
      found = true;
      break;
    }
  }

  if (!found) log(place.name);

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

function retrieveCafeMarkers(LatLng) {

  var cafeRequest = {
    // bounds: map.getBounds(),
    location: LatLng,
    radius: 500, // metres
  };

  // need to do search in multiple requests as you can only search for one item at a time
  var queries = [ 'Caffe Nero', 'Caffè Nero', 'Starbucks', 'Costa', 'Origin Coffee', 'Coffee Republic', 'Pret a Manger', 'Coffee Island', 'coffee shop', 'cafe', 'coffee' ]; 
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

// app
loadSettings();
window.initAutocomplete = initAutocomplete;
