let clickCount = 0;
let data = [];

let currentImageName = "";

const WEBSITE = window.location.href + "datagen"; // replace with the server IP address, or with window.location.href if you're hosting the app.html on the same server

function setImageVisibility(id, visible) {
   document.getElementById(id).style.visibility = (visible ? "visible" : "hidden");
}

function hideQOLElements() {
    setImageVisibility("point_1", false);
    setImageVisibility("point_2", false);
    setImageVisibility("line_1", false);
    setImageVisibility("line_2", false);
    setImageVisibility("line_3", false);
    setImageVisibility("line_4", false);
}

function showUserMessage(msg) {
    document.getElementById("message").innerHTML = msg;
}

function putImageOnPage(image) {
    let img = document.getElementById("image");
    if(image === undefined) {
        img.alt = "No image found";
    }
    img.src = "data:image/jpeg;base64," + image;
    document.getElementById("image").image = img;

    setTimeout(() => {
        document.getElementById("overlay_wrapper").style.height = document.getElementById("image").height + "px";
        document.getElementById("overlay_wrapper").style.width = document.getElementById("image").width + "px"; // Needed so the overlaid div extends properly.
    }, 0); // this made the code work??? i assume setting the element isn't instant and waiting for next event cycle via timeout fixes :P
}

function getImage() {
    document.getElementById("image").src = "";
    hideQOLElements();

    fetch(WEBSITE, {method: "GET"}).then((response) => {
        if(response.status === 696) {
            showUserMessage("The server has no more images to process. If you know the server has more images, try reloading this page.");
            document.getElementById("button").disabled = true;

            return;
        }

        response.json().then((data) => {
            currentImageName = data.imgName;
            putImageOnPage(data.img);
            showUserMessage("You have clicked 0 times.");

            // The below line remains for future use, where the server can send specific instructions along with the image.
            document.getElementById("instructions").innerHTML = "Find all blue colored balls. Click on a top left corner and a bottom right corner that would enclose the ball. After clicking on 2 points, you can drag either point (green) to increase precision. If there is no ball, click on the checkbox below. Hit 'Send' when done.";
        }, (error) => {
            showUserMessage("Error getting image from the server: " + error);
        });
    }, (error) => {
        showUserMessage("Error getting image from the server: " + error);
    });
}

function postData(data) {
    showUserMessage("Sending data to server...");
    let body = JSON.stringify({imgName: currentImageName, noBall: document.getElementById("no_ball").checked, data: data});

    fetch(WEBSITE, {method: "POST", body: body}).then(() => {
    }, (error) => {
        showUserMessage("Error sending data to the server: " + error);
    });
}

function boundingBoxDrawer(x1, y1, x2, y2) {
    setImageVisibility("line_1", true);
    setImageVisibility("line_2", true);
    setImageVisibility("line_3", true);
    setImageVisibility("line_4", true);

    document.getElementById("line_1").style.left = x1 + "px";
    document.getElementById("line_1").style.top = y1 + "px";
    document.getElementById("line_1").style.width = Math.abs(x2 - x1) + "px";
    document.getElementById("line_1").style.transform = "rotate(0deg)";

    document.getElementById("line_2").style.left = (x1 + 8) + "px";
    document.getElementById("line_2").style.top = y1 + "px";
    document.getElementById("line_2").style.width = Math.abs(y1 - y2) + "px";
    document.getElementById("line_2").style.transform = "rotate(90deg)";

    document.getElementById("line_3").style.left = x2 + "px";
    document.getElementById("line_3").style.top = y2 + "px";
    document.getElementById("line_3").style.width = Math.abs(x2 - x1) + "px";
    document.getElementById("line_3").style.transform = "rotate(180deg)";

    document.getElementById("line_4").style.left = x2 + "px";
    document.getElementById("line_4").style.top = y2 + "px";
    document.getElementById("line_4").style.width = Math.abs(y1 - y2) + "px";
    document.getElementById("line_4").style.transform = "rotate(-90deg)";
}

function clickHandler(event) {
    console.log("x: " + event.offsetX + ", y: " + event.offsetY);
    if(clickCount >= 2) {
        showUserMessage("You have already clicked the maximum # of times.");
    } else {
        clickCount++;
        data.push([event.offsetX, event.offsetY]);
        showUserMessage(`You have clicked ${clickCount} times.`);

        switch(clickCount) {
            case 1:
                setImageVisibility("point_1", true);
                document.getElementById("point_1").style.left = event.offsetX + "px";
                document.getElementById("point_1").style.top = event.offsetY + "px";
                break;
            case 2:
                setImageVisibility("point_2", true);
                document.getElementById("point_2").style.left = event.offsetX + "px";
                document.getElementById("point_2").style.top = event.offsetY + "px";
                boundingBoxDrawer(data[0][0], data[0][1], data[1][0], data[1][1]);

                break;
        }
    }
}

function getDataFromPage() {
    return data;
}

function handleAll() {
    clickCount = 0;
    data = [];
    postData(getDataFromPage());
    currentImageName = "";
    getImage();
}

function reset() {
    hideQOLElements();
    clickCount = 0;
    data = [];
    showUserMessage("You have clicked 0 times.");
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();
    let evtData = event.dataTransfer.getData("text");
    event.target.appendChild(document.getElementById(evtData));

    console.log(event.x + ", " + event.y);

    console.log(evtData);

    let wrapperPos = document.getElementById("overlay_wrapper").getBoundingClientRect();
    let new_loc = [event.x + window.scrollX - (wrapperPos.left + window.scrollX), event.y + window.scrollY - (wrapperPos.top + window.scrollY)];

    let elem = document.getElementById(evtData);
    elem.style.left = new_loc[0] + "px";
    elem.style.top = new_loc[1] + "px";
    switch(evtData) {
        case "point_1":
            data[0][0] = new_loc[0];
            data[0][1] = new_loc[1];
            break;
        case "point_2":
            data[1][0] = new_loc[0];
            data[1][1] = new_loc[1];
            break;
    }
    boundingBoxDrawer(data[0][0], data[0][1], data[1][0], data[1][1]);
}