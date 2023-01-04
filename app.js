const geocode = { lat: 51.509865, lon: -0.118092 }; // London
const radius = 10; // miles
const radiusUnits = 'mi';
const limit = 25; // maximum number of charging locations

function dumpAddress(entry) {
    const {
        ChargeDeviceLocation,
        ChargeDeviceLocation: { Latitude: lat, Longitude: lon, LocationLongDescription: address, Address : { PostCode: postcode } } ,
        ChargeDeviceName: name,
        ...rest
    } = entry;
    console.log(`lat:${lat} lon:${lon} : ${name},${postcode}`);
}

// with fetch
// fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://github.com/')}`)
// .then(response => {
// 	if (response.ok) return response.json()
// 	throw new Error('Network response was not ok.')
// })
// .then(data => console.log(data.contents));

// with fetch
// fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://chargepoints.dft.gov.uk/api/retrieve/registry/format/json/lat/51.509865/long/-0.118092/dist/10')}`)
// .then(response => {
// 	if (response.ok) return response.json()
// 	throw new Error('Network response was not ok.')
// })
// .then(data => console.log(data.contents));

// Cors proxies https://gist.github.com/jimmywarting/ac1be6ea0297c16c477e17f8fbe51347

const queryURL = `https://chargepoints.dft.gov.uk/api/retrieve/registry/format/json/lat/${geocode.lat}/long/${geocode.lon}/dist/${radius}/units/${radiusUnits}/limit/${limit}`;
// const proxyURL = `https://api.allorigins.win/get?url=${encodeURIComponent(queryURL)}`;
// const proxyURL = `https://cors-anywhere.herokuapp.com/${queryURL}`;
// const proxyURL = `https://cors.io?${queryURL}`;
//const proxyURL = `https://crossorigin.me/${queryURL}`;
const proxyURL = `https://proxy.cors.sh/${queryURL}`;
// const options = { method: 'GET', /*mode: 'cors',*/ headers: { 'Content-Type': 'application/json', /*'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*'*/ } };
fetch(proxyURL) //, options)
    .then((response) => {
        if (!response.ok) {
            throw new Error(response.error)
        }
        // response.headers.forEach(function(val, key) {
        //     document.getElementById('headers').value += '\n' + key + ': ' + val; 
        // });
        return response.json();
    })
    .then(data => {
        console.log(data)
        data.ChargeDevice.forEach(dumpAddress);
    })
    .catch(err => {
        console.error(err)
        return err;
    });
