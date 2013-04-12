This Lab will take you through creating a simple application which will demonstrate using server side functionality to call an external server and caching the response in the [whitelabel providername] cloud. 

### Step 1: Create a new app

Create a new app from scratch (not from a template). Once the app is created, choose **Edit my App** and delete the default contents of the **client/default/index.html** file. 

### Step 2: Create Static Client Version

Add the following code to the index.html file and choose **Save**: 

```html
<script src="js/jquery-1.9.1.min.js" type="text/javascript"></script>

<p> Current Time : </p>
<div id="current_time_response"> </div>
<button id="current_time"> Refresh time </button>

<script>
  $(document).ready(function(){
    $('#current_time').click(readTime);
  });

  function readTime() {
    // Read the current time from a new Date object
    var time = new Date().toString();

    // Display the time in-app using jQuery
    $('#current_time_response').html(time);
  }

  // Do an initial read of the current time
  readTime();
</script>
```

This creates an App that displays the current time, and has a button for refreshing the time. It's only working on the client, with no server-side code involved.  
[See The Code](https://github.com/feedhenry-training/Date-Time-Tutorial/commit/337325a26cd69bafb7bcb4dd9877665dd25f1be1)


### Step 3: Create Server Side Function
  
First, setup the correct dependencies by altering package.json - we're going to use the request module, and in a while we'll be using the JSDom module. Replace the contents of package.json with the following:  
````javascript
{
  "name": "fh-app",
  "version": "0.1.0",
  "dependencies" : {
    "fh-nodeapp" : "*"
    ,"request" : "2.0.0"
    ,"jsdom" : "0.5.4"
}
}
````  
  
Add the following code to the server-side main.js file (in /cloud/main.js). 

```javascript
var util = require('util');
var request = require('request');
var jsdom = require('jsdom');

exports.getCurrentTime = function(params, cb) {

  request({uri : 'http://www.timeanddate.com/worldclock/city.html?n=78'}, function(err, res, body){
    return cb(err, { response : body });
  });
};
```

This will make an external web request to  to get the current time for Dublin, Ireland (the n=78 GET parameter indicates Dublin). 
Go to this URL in your browser now and use your developer tools to inspect the current time text. Notice that the current time is inside a  tag with an id of "ct" - we're going to use this later to screen scrape the current date & time tutorial.

### Step 4: Modify client side code to call new Server Side Action

modify the readTime() function in index.html so that it calls the new server side function getCurrentTime(). Notice that this server side function returns the entire page from timeanddate.com (which is over 6,000 bytes of data). For now, we're just going to add this HTML to our app - you'll notice this makes quite the mess!

     
```javascript
function readTime() {
    $fh.act({
      act: 'getCurrentTime'
    }, function(res) {
      // Display the time in-app
      $('#current_time_response').html(res.response);
    });

}
```  
[See The Code (Steps 3 & 4)](https://github.com/feedhenry-training/Date-Time-Tutorial/commit/b88e6b94faa70d0afea4f402727ac9af6addc11e)

### Step 5: Modify server side logic to only return the date and time

Rather than returning the entire page to the client and extracting the date on the client side, we're going to use a powerful serverside DOM parsing module. Think of JQuery, only for the server side. This has two obvious advantages: 

1.  Less Data - Returning just the required information uses only 70 bytes - approximately 1% of the full page size. This is a significant reduction in data - especially when we consider that data transfer rates are usually slower on a mobile device.
2.  More Flexible - If we use client side logic to extract the date and time information, this logic will be bundled with the app when it is published. This means that if the structure of the html document on the remote site changes (e.g. if the id of the strong tag changed from "ct" to "now"), our app will most likely stop working as the client side parsing is no longer valid. However, if we keep this logic in the cloud hosted server side JavaScript, and return just the information required, we can change the cloud logic at any time.

We will now add the JSDom module, and the new server side function which returns only the date and time. 

```javascript
exports.getCurrentTime = function(params, cb) {

  request({uri : 'http://www.timeanddate.com/worldclock/city.html?n=78'}, function(err, res, body){
    // Run some jQuery on a html fragment
    jsdom.env(
    body,
    ["http://code.jquery.com/jquery.js"],
    function(errors, window) {
      var ct = window.$('#ct').text();
      console.log("contents of the current time div:", ct);
      return cb(errors, { response : ct });
    }
    );
  });
};
```
You'll notice we don't need to make any changes to the client-side of our application - we're simply altering the text returned from the server side. This demonstrates how powerful keeping the client simple, and doing the complex processing & business logic of an app can be.  
[See The Code](https://github.com/feedhenry-training/Date-Time-Tutorial/commit/822c8a0ab6bf2632c0fce81a434643b3396af737)

### Step 7: Modify server side function to cache current time

Instead of hitting the current date & time website for every single request from our mobile client, we're going to introduce some caching. To do this, we're going to rename our old getCurrentTime function to 'getDateTimeFromWeb'. We're then only going to call this function if our cache is empty.   
We're also going to add some caching code to this function. When we successfully retrieve the current date and time, we're going to use $fh.cache to save the data with a 10 second interval. This means the data will become stale after ten seconds, and we will reach out to the website again to retrieve the data.     
Lastly, we're now going to create a new getCurrentTime function, which simply checks the cache for a value. If it's empty, we reach out to the web. If there's data available in the cache, we return it.
  
[See The Code](https://github.com/feedhenry-training/Date-Time-Tutorial/commit/1f5a088034d227912583d13922ff8ab64f11770e)
