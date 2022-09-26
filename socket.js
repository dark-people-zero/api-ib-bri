const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs/promises");
const unirest = require("unirest");
const HtmlTableToJson = require('html-table-to-json');

const db = require("./models");

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
  var req = unirest("POST", "https://app.bksmb.com/bri/captchabank")
    .headers({
      "Content-Type": "application/x-www-form-urlencoded",
    })
    .send("username=" + username)
    .send("captchabase64=" + encodeURIComponent(img))
    .end(cb);
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
        const t = await db.sequelize.transaction();
        try {
            if (data.status) {
                var saldo = HtmlTableToJson.parse(data.response.saldo).results;
                var mutasi = HtmlTableToJson.parse(data.response.mutasi).results;
                mutasi = mutasi[0].map((e) => {
                    e.idTransaksi = data.request.id;
                    return e;

                });
                
                const result = await db.transaction.update({
                    status: 1,
                    saldo: saldo[0][0]["Saldo"]
                },
                    {
                        where: {
                            id: data.request.id,
                        },
                    },
                    { transaction: t }
                );

                await db.mutasi.bulkCreate(mutasi, { transaction: t });
            }else{
                const result = await db.transaction.update({
                    status: 1,
                    error: data.error
                },
                    {
                        where: {
                            id: data.request.id,
                        },
                    },
                    { transaction: t }
                );
            }
            await t.commit();
        } catch (error) {
            console.log(error);
            await t.rollback();
        }
    });
});

app.post("/request", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const noRek = req.body.noRek;

    var error = null;
    if (!username || username == "")
        error == null
        ? (error = { username: "Username tidak boleh kosong" })
        : (error.username = "Username tidak boleh kosong");
    if (!password || password == "")
        error == null
        ? (error = { password: "password tidak boleh kosong" })
        : (error.password = "password tidak boleh kosong");
    if (!noRek || noRek == "")
        error == null
        ? (error = { noRek: "Nomor Rekening tidak boleh kosong" })
        : (error.noRek = "Nomor Rekening tidak boleh kosong");

    if (error != null)
        return res.status(402).json({
            error: error,
        });

    if (globalSocket == null)
        return res.status(402).json({
            error: {
                client: "Maap belum ada socket yang terhubung ke server",
            },
        });
    
    const t = await db.sequelize.transaction();
    try {
        const result = await db.transaction.create({
            username: username,
            nomorRekening: noRek,
            status: 0,
            saldo: "",
            mutasi: "",
            error: "",
        },{ transaction: t });

        await t.commit();
        var x = req.body;
        x.id = result.id;

        io.to(globalSocket).emit("getMutasi", x);

        res.status(200).json(result);
    } catch (error) {
        var message = "ada masalah di coding server";
        if (error.original) {
            if (error.original.sqlMessage) {
                message = error.original.sqlMessage;
            }
        }
        await t.rollback();
        
        return res.status(402).json({
            error: {
                server: message,
            },
        });

    }
});

app.get("/response", async (req, res) => {
    var id = req.query.id;
    if (!id || id == "") {
        return res.status(402).json({
            error: "ID tidak boleh kosong",
        });
    }

    const t = await db.sequelize.transaction();
    try {
        const result = await db.transaction.findOne({
            where: {
                id: id
            },
            include: ['mutasi']
        },{ transaction: t });

        res.status(200).json(result);
    } catch (error) {
        var message = "ada masalah di coding server";
        if (error.original) {
            if (error.original.sqlMessage) {
                message = error.original.sqlMessage;
            }
        }
        await t.rollback();
        
        return res.status(402).json({
            error: {
                server: message,
            },
        });

    }

    
})

httpServer.listen(3000);
