const fs = require("fs");
const http = require("http");

let processedData = new Map();
let sent = [];
let toSend = [];

let htmlFile = fs.readFileSync("./app.html", "utf8");
let jsFile = fs.readFileSync("./app.js", "utf8");

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
    fs.writeFileSync(`./data/data${nextFileVal++}.json`, JSON.stringify(Array.from(processedData.entries())));
    let writtenData;
    processedData.forEach((value, key) => {
        writtenData += key + "\n";
    });
    fs.writeFileSync("sorted.txt", writtenData); // The usage of this file is left as an exercise to the user.
}

process.on("SIGINT", function () {
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
                toSend.pop(); // Disable when testing, so that you can keep sending images without having to restart the server
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
    server.listen(8080);
} catch (e) {
    saveData();
    console.log("error: " + e);
}