const geocode = { lat: 51.509865, lon: -0.118092 }; // London
const radius = 10; // miles
const radiusUnits = 'miles';

function dumpAddress(entry) {
    console.log(`lat:${entry.AddressInfo.Latitude} lon:${entry.AddressInfo.Longitude} : ${entry.AddressInfo.AddressLine1},${entry.AddressInfo.AddressLine2},${entry.AddressInfo.Postcode}`);
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


const queryURL = `https://chargepoints.dft.gov.uk/api/retrieve/registry/format/json/lat/${geocode.lat}/long/${geocode.lon}/dist/${radius}`;
const proxyURL = `https://api.allorigins.win/get?url=${encodeURIComponent(queryURL)}`;
const options = { method: 'GET', /*mode: 'cors',*/ headers: { 'Content-Type': 'application/json', /*'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*'*/ } };
fetch(queryURL, options)
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
        data.contents.forEach(dumpAddress);
    })
    .catch(err => {
        console.error(err)
        return err;
    });
