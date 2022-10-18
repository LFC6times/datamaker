let clickCount = 0;
let data = [];

let currentImageName = "";

const WEBSITE = "http://localhost:8080/datagen"; // replace with the server IP address, or with window.location.href if you're hosting the app.html on the same server

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
    img.src = "data:image/png;base64," + image;
    document.getElementById("image").image = img;
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
            currentImageName = data.name;
            putImageOnPage(data.img);
            showUserMessage("You have clicked 0 times.");

            document.getElementById("instructions").innerHTML = "Find all blue colored balls. Click on a top left corner and a bottom right corner that would enclose the ball. If there is no ball, click on the checkbox below. Hit 'Send' when done.";
        }, (error) => {
            showUserMessage("Error getting image from the server: " + error);
        });
    }, (error) => {
        showUserMessage("Error getting image from the server: " + error);
    });
}

function postData(data) {
    showUserMessage("Sending data to server...");
    let body = JSON.stringify({name: currentImageName, noBall: document.getElementById("no_ball").checked, data: data});

    fetch(WEBSITE, {method: "POST", body: body}).then(() => {
    }, (error) => {
        showUserMessage("Error sending data to the server: " + error);
    });
}

function clickHandler(event) {
    if(clickCount >= 2) {
        showUserMessage("You have clicked too many times and have been reported to the FBI."); // thank you GitHub Copilot for this incredible autocompletion
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

                setImageVisibility("line_1", true);
                setImageVisibility("line_2", true);
                setImageVisibility("line_3", true);
                setImageVisibility("line_4", true);

                let x1 = data[0][0];
                let y1 = data[0][1];
                let x2 = data[1][0];
                let y2 = data[1][1];

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
    currentImageName = "";

    postData(getDataFromPage());
    getImage();
}

function reset() {
    hideQOLElements();
    clickCount = 0;
    data = [];
    showUserMessage("You have clicked 0 times.");
}