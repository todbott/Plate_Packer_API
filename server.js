// I wrote this in Node.js using Express, so that's why this is here.
var express = require('express');
var app = express();
const path = require('path');

// Currently, the max weight is 35kg per box.  As that might change in the future, I've made it editable here.  
const maxWeight = 35

// Similarly, the max load is currently 3 plates per box.  As this may change in the future, I've made it editable here.
const maxLoad  = 3

// --------------- Lengthy, 'for loop' version -----------------------------------------
// This is a "plates" object that we will be populating with the numbers from the order system 
// we receive.  I chose to make it into an object simply because--in the future--the client may 
// want to add more varieites of products (for example, 30kg plates), so adding to the object 
// would be easy.  Also, as long as new plates were added in descending order 
// (heaviest plates at the top, lightest plates at the bottom), I believe the API function 
// wouldn't need any adjustment--it would work just as well if there were more types of plates, 
// different weights, etc.
const plates = {
  "20": 
  {
      weight: 20,
      number: 0
  },
  "10": {
      weight: 10,
      number: 0
  }, 
  "5": {
      weight: 5,
      number: 0
  }
}

app.route("/plates/:data?").get(function platePack(req, res) {

  // Ideally, we'd get the data as a JSON object, but I've made it a url param just for ease of testing
  let allData = req.query.data;

  // We split it to get the customer name, and weights and quantities of the plates requested
  let customerName = allData.split("-")[0];
  let allQuantities = allData.split("-")[1];
  let quantitiesAndWeights = allQuantities.split(",");

  // populate the plates object
  for (var q=0; q<quantitiesAndWeights.length; q++) {
    let thisWeight = quantitiesAndWeights[q].split(":")[0]
    let thisQuantity = quantitiesAndWeights[q].split(":")[1]
    plates[thisWeight].number = thisQuantity
  }

  // Now that the plates object is updated with the info from the request arguments, let's do it!
  // One robot cart, holding one box
  let robotCart = []

  // The string we'll send to the robot management system at the end
  let stringForResponse = "";

  // Two variables for tracking the number of plates we still have to put in boxes, as well as the total cart (box) weight
  let remainingPlates = 0
  let totalCartWeight = 0

  do {
    // how many plates total are there in the order? We'll call it zero here at the top of the loop, and it will be added to later.
    remainingPlates = 0
    
    // for each plate...
    for (const object in plates) {
        
        // get the weight and the quantity
        let thisPlateWeight = plates[object].weight;
        let thisPlateQuantity = plates[object].number;
        
        // add the rest of the remaining plates to the remaining plates figure
        remainingPlates += plates[object].number;
      
        // if there are any plates of that type remaining...
        if (thisPlateQuantity > 0) {
          
            // push one onto the robot Cart
            robotCart.push(thisPlateWeight)
          
            // and remove it from the order sheet
            plates[object].number -= 1
          
            // now we calculate the weight of the robot Cart
            totalCartWeight = (robotCart.length > 0) ? robotCart.reduce((a, b)=>a+b) : 0;
    
            // if it's over the total weight or past the set number of  items, we undo what we just did, and remove the plate we just added to it
            if ((totalCartWeight > 35) || (robotCart.length > maxLoad)) {
                // pop out the plate
                robotCart.pop()
                // add the plate back to the remaining plates figure 
                remainingPlates = remainingPlates + 1
                // add the plate back to the original object
                plates[object].number += 1
                
                // finally, push the robot cart (which is now at capacity) onto the response string, then empty the robot cart
                stringForResponse += customerName + "," + robotCart.join(",") + "<br>"
                robotCart = []
            }
        }
    }
  } while (remainingPlates > 0) 
  // When the number of remaining plates in the order reaches zero, break out of the loop

  stringForResponse += customerName + "," + robotCart.join(",") + "<br>"

  res.send(stringForResponse)
})



// --------------- Short, recusive version -----------------------------------------
// Below are 2 functions and an API endpoint that accomplish the task using recursion
// instead of a 'for' loop.

// As a first step in this system, we put the plates into separate arrays.
// For example, if we got 'hamada-5:4,10:3,20:4', we'd make a nested array like this

// [5, 5, 5, 5], [10, 10, 10], [20, 20, 20, 20]]

// This function takes in such a nested array and returns one array that is composed
// of 1) the first element from each array, then 2) the next element from each array, etc.
// Like this:

//[5, 10, 20, 5, 10, 20, 5, 10, 20, 5, 20]
function oneLongArray(plates, sorted) {
  sorted = sorted || []
  if (plates.length === 0) {
      return sorted
  }
  for (var a=0; a<plates.length; a++) {
      if (plates[a].length > 0) {
          sorted.push(plates[a].pop())
      } else {
          plates.splice(a, 1)
      }
  }
  sorted.concat(oneLongArray(plates, sorted))
  return sorted
}

// This function then takes the array created in the above function
// and 'chunks' it into many sub-arrays, each being 1) not longer than the
// set number of items, and 2) not summing to more than the maximum weight
function chunk(fa, chunked) {
  chunked = chunked || []
  if (fa.length === 0) {
      return chunked
  }
  console.log(fa.slice(0, maxLoad).reduce((a,b)=>a+b))
  for (var e = maxLoad; e > 0; e--) {
    if (fa.slice(0, e).reduce((a,b)=>a+b) <= maxWeight) {
      chunked.push(fa.slice(0, e))
      fa.splice(0,e)
      break
    }
  }
  chunked.concat(chunk(fa, chunked))
  return chunked
}

// Here is the actual endpoint for the recursive version of the system
app.route("/recursive_plates/:data?").get(function recursivePlatePack(req, res) {

  // Ideally, we'd get the data as a JSON object, but I've made it a url param just for ease of testing
  let allData = req.query.data;

  // We split it to get the customer name, and weights and quantities of the plates requested
  let customerName = allData.split("-")[0];
  let allQuantities = allData.split("-")[1];
  let quantitiesAndWeights = allQuantities.split(",");

  // Make arrays based on each of the plate weights and quantities, and push it into a 
  // main array called 'allPlates'
  let allPlates = []
  for (var q=0; q<quantitiesAndWeights.length; q++) {
    let thisWeight = parseInt(quantitiesAndWeights[q].split(":")[0])
    let thisQuantity = parseInt(quantitiesAndWeights[q].split(":")[1])
    let thesePlates = [...new Array(thisQuantity)].map(()=> thisWeight);
    allPlates.push(thesePlates)
  }

  // These are variables we'll use to store values in our recursive functions
  let sorted =  []
  let chunked = []

  // Turn the nested arrays contained in 'allPlates' into a long, sorted, repeating array
  let longAndSorted = oneLongArray(allPlates, sorted)

  // Then, break that array into many sub-arrays (each of which represents the contents of
  // one box)
  let finalArray = chunk(longAndSorted, chunked)
  
  // The string we'll send to the robot management system at the end
  let stringForResponse = "";

  finalArray.map(a=> stringForResponse += customerName + "," + a.join(",") + "<br>")

  res.send(stringForResponse)
})

app.route("/").get(function ng(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'))
})


var port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});