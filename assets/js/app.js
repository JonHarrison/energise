
// Javascript file for processing events on Map page
      var leftColDiv = document.querySelector('#left-col');
      leftColDiv.className="col leftcol";
    
      // Get references to the #takeBtn element
      //var takeBtn = document.querySelector('#takeBtn');
      // Add event listener to start button
      //takeBtn.addEventListener('click', takeToMaps());
    
      // Hide the left colum when the "Take me there" button is clicked
      function takeToMaps() {
       leftColDiv.className="hide";
      }
    