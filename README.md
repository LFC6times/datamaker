Allows for labeling of testing data via a web interface.

The server.js file is a Node.js server which hosts 1) a website server and the POST data upload endpoint on <server url> and 2) the image server on <server url>/datagen

Images should be placed in ./images/ and the data is output as an array into ./data/

Note that if the HTML/JS is being hosted on a different server than the image server, the image server URL must be changed in app.js (WEBSITE const)