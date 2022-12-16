const TESTING = false; // set to false before actual use
const PORT = 80; // HTTP, but means you'll need to use `sudo` to run the server on Linux

const IMAGE_FOLDER_NAME = "./images";
const DATA_OUTPUT_FOLDER_NAME = "./data";

// Kinda config stuff above

const fs = require("fs");
const http = require("http");

// Maps filename -> data point info
let processedData = new Map();
// Filenames of sent images for which a response has not been received
let sent = [];
// Filenames of images that still need to be sent
let toSend = [];

const htmlFile = fs.readFileSync("./app.html", "utf8");
const jsFile = fs.readFileSync("./app.js", "utf8");

if(!fs.existsSync(IMAGE_FOLDER_NAME)) {
    console.log("no image input folder, making (you need to put images in manually)");
    try {
        fs.mkdirSync(dir, {recursive: true});
    } catch(e) {
        console.log("Failed to create image input folder, exiting (try doing it yourself)");
        process.exit(1);
    }
}
if(!fs.existsSync(DATA_OUTPUT_FOLDER_NAME)) {
    console.log("no data output folder, making");
    try {
        fs.mkdirSync(dir, {recursive: true});
    } catch(e) {
        console.log("Failed to create data output folder, exiting (try doing it yourself)");
        process.exit(1);
    }
}

fs.readdirSync("./images").forEach((file) => {
    if(!file.endsWith(".ini")) { // ignore ini files because they're weird (thanks windows)
        toSend.push(file);
    }
});

let nextFileVal = 0;
fs.readdirSync("./data").forEach((file) => {
    if(file.endsWith(".json")) {
        let value = file.slice(4, -5); // remove the .json extension and the word "data" in front
        if(Number.parseInt(value) >= nextFileVal) {
            nextFileVal = Number.parseInt(value) + 1;
        }
    }
});

console.log("data to send: " + toSend);

function saveData() {
    let writtenData = "";
    try {
        fs.writeFileSync(`./data/data${nextFileVal++}.json`, JSON.stringify(Array.from(processedData.entries())));
        processedData.forEach((value, key) => {
            writtenData += key + "\n"; // shouldn't I like just write the keys and values together? TODO: rewrite later when I look at what 2 months ago me was thinking
        });
        fs.writeFileSync("sorted.txt", writtenData); // I don't exactly remember what I was thinking when I did this
    } catch(e) {
        console.log("failed to save data, e:")
        console.log("err: " + e);
        console.log("here's the data if you want to copy-paste it somewhere/debug: ");
        console.log(writtenData); // should never happen
    }
}

// Allow server to save before closing
process.on("SIGINT", () => {
    saveData();
    process.exit();
});

const server = http.createServer((req, res) => {
    let body = [];

    try {
        if (req.method === "GET") {
            if(req.url === "/datagen") {
                if (toSend.length === 0) {
                    console.log("no more images to send");

                    res.writeHead(696, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
                    res.end();
                    saveData();
                    return;
                }

                res.writeHead(200, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"});
                let send = toSend[toSend.length - 1];
                console.log("send: " + send);
                let img = new Buffer(fs.readFileSync("./images/" + send)).toString("base64");
                res.write(JSON.stringify({img: img, imgName: send}));
                res.end();

                sent.push(send);
                if(!TESTING) {
                    toSend.pop(); // Disable when testing, so that you can keep sending images without having to restart the server
                }
            } else if(req.url === "/") {
                res.writeHead(200, {"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"});
                res.write(htmlFile);
                res.end();
            } else if(req.url === "/app.js") {
                res.writeHead(200, {"Content-Type": "text/javascript", "Access-Control-Allow-Origin": "*"});
                res.write(jsFile);
                res.end();
            }
        } else if (req.method === "POST") {
            req.on("data", (chunk) => {
                body.push(chunk);
            }).on("end", () => {
                body = JSON.parse(Buffer.concat(body).toString());

                console.log("name: " + body.imgName);
                console.log("noBall: " + body.noBall);

                if (sent.includes(body.imgName) && !processedData.has(body.imgName)) {
                    processedData.set(body.imgName, {noBall: body.noBall, data: body.data});
                    sent.splice(sent.indexOf(body.imgName), 1);
                } else {
                    console.log("we're getting trolled, sent name: " + body.imgName + ", sent: " + sent + ", included: " + sent.includes(body.imgName) + ", processed incld: " + processedData.has(body.imgName));
                }
            });
        }
    } catch (e) {
        saveData();
        console.log("error: " + e);
    }
});

try {
    server.listen(PORT);
} catch (e) {
    saveData();
    console.log("error: " + e);
}