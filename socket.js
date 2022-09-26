const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs/promises");
const unirest = require('unirest');

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://ib.bri.co.id",
  },
});

function getCaptcha(img, cb) {
    var username = "admin";
    var req = unirest('POST', 'https://app.bksmb.com/bri/captchabank').headers({
        'Content-Type': 'application/x-www-form-urlencoded'
    }).send('username='+username).send('captchabase64='+encodeURIComponent(img)).end(cb);
}

var globalSocket = null;

io.on("connection", (socket) => {
    console.log(socket.id);
    globalSocket = socket.id;
    socket.on("captcha4D", (img, cb) => {
        getCaptcha(img, function (res) { 
            if (res.error) throw new Error(res.error); 
            cb(res.raw_body);
        });
    });

    socket.on("reciveData", async (data) => {
        await fs.mkdir("data/comments", { recursive: true });
        await fs.writeFile(`data/comments/tes.txt`, JSON.stringify(data));
    });
});

app.post("/mutasiBri", (req, res) => {
	const username = req.body.username;
    const password = req.body.password;

    var error = null;
    if (!username || username == "") error == null ? error = {username: "Username tidak boleh kosong"} : error.username = "Username tidak boleh kosong";
    if (!password || password == "") error == null ? error = {password: "password tidak boleh kosong"} : error.password = "password tidak boleh kosong";

    if (error != null) return res.status(402).json({
        "error": error
    });

    if (globalSocket == null) return res.status(402).json({
        "error": {
            "client": "Maap belum ada socket yang terhubung ke server"
        }
    });
    
    io.to(globalSocket).emit("getMutasi", req.body);

    res.status(200).json({
		message: "data dengan di proses"
	});
});

httpServer.listen(3000);