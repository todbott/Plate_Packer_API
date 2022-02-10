var express = require('express');
var bodyParser = require('body-parser')
const dns = require('dns');

var app = express();

// This is a "plates" object that we will be populating with the numbers from the order system we receive.  I chose to make it into an object simply because--in the future--the client may want to add more varieites of products (for example, 30kg plates), so adding to the object would be easy.  Also, as long as new plates were added in descending order (heaviest plates at the top, lightest plates at the bottom), I believe the API function wouldn't need any adjustment--it would work just as well if there were more types of plates, different weights, etc.
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

// Currently, the max weight is 35kg per box.  As that might change in the future, I've made it editable here.  
const maxWeight = 35

// Similarly, the max load is currently 3 plates per box.  As this may change in the future, I've made it editable here.
const maxLoad  = 3

app.route("/plates/:data?").get(function ng(req, res) {

  // Ideally, we'd get the data as a JSON object, but I've made it a url param just for ease of testing
  var allData = req.query.data;

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

  // Let's check if the object was populated correctly
  console.log(plates)

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

 module.exports = app;
