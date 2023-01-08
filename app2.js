
// Javascript file for processing events on Map page
      // Get references to the #takeBtn element
      var takeBtn = document.querySelector('#takeBtn');
      leftColDiv.className="col leftcol";
    
      // Add event listener to start button
      takeBtn.addEventListener('click', takeToMaps());
    
      // Hide the left colum when the "Take me there" button is clicked
      function takeToMaps() {
      var leftColDiv = document.querySelector('#left-col');
       leftColDiv.className="hide";
      }
    