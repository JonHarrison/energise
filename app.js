const options = {method: 'GET', headers: {'Content-Type': 'application/json'}};

const APIkey = 'd3723cbe-33e1-4377-b08c-33f88d7ae336';
const geocode = {lat : 51.509865 , lon: -0.118092 }; // London
const radius = 10; // miles
const radiusUnits = 'miles';



function dumpAddress(entry)
{
    console.log(`lat:${entry.AddressInfo.Latitude} lon:${entry.AddressInfo.Longitude} : ${entry.AddressInfo.AddressLine1},${entry.AddressInfo.AddressLine2},${entry.AddressInfo.Postcode}`);
}

const queryURL = `https://api.openchargemap.io/v3/poi?key={APIKey}&latitude=${geocode.lat}&longitude=${geocode.lon}&distance=${radius}&distanceunit=${radiusUnits}`;
fetch(queryURL, options)
  .then(response => response.json())
  .then(response => {
    console.log(response)
    response.forEach(dumpAddress);
  })
  .catch(err => console.error(err));
