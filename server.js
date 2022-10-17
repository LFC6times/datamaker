const fs = require("fs");
const http = require("http");

let processedData = new Map();
let sent = [];
let toSend = [];

fs.readdirSync("./images").forEach((file) => {
    if(!file.endsWith(".ini")) { // ignore ini files because they're weird (thanks windows)
        toSend.push(file);
    }
});

console.log("data to send: " + toSend);

function saveData() {
    fs.writeFileSync("./data/data.json", JSON.stringify(Array.from(processedData.entries())));
}

const server = http.createServer((req, res) => {
    let body = [];

    try {
        if (req.method === "GET") {
            if(toSend.length === 0) {
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
            res.write(JSON.stringify({img: img, name: send}));
            res.end();

            sent.push(send);
            toSend.pop(); // Disable when testing, so that you can keep sending images without having to restart the server
        } else if (req.method === "POST") {
            req.on("data", (chunk) => {
                body.push(chunk);
            }).on("end", () => {
                body = JSON.parse(Buffer.concat(body).toString());

                console.log("name: " + body.name);
                console.log("hasBall: " + body.hasBall);

                if (sent.includes(body.name) && !processedData.has(body.name)) {
                    processedData.set(body.name, body.data);
                    sent.splice(sent.indexOf(body.name), 1);
                } else {
                    console.log("we're getting trolled, send: " + sent);
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