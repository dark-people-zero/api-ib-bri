// ==UserScript==
// @name         Script BRI
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Daqrk People Zero
// @match        https://ib.bri.co.id/ib-bri/
// @match        https://ib.bri.co.id/ib-bri/Login.html
// @match        https://ib.bri.co.id/ib-bri/Homepage.html
// @match        https://ib.bri.co.id/ib-bri/id/logout.htm
// @match        https://ib.bri.co.id/ib-bri/Logout.html

// @require      https://cdn.socket.io/4.5.0/socket.io.min.js
// @require      https://code.jquery.com/jquery-3.6.1.slim.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js
// ==/UserScript==

(function() {
    'use strict';
    const socket = io("http://localhost:3000");

    document.addEventListener("load", () => {
        window.alert = function() { return true; };
        window.confirm = function() { return true; };
    });

    document.addEventListener("DOMContentLoaded", () => {
        socket.on("getMutasi", (data) => {
            login(data);
        })

        setTimeout(() => {
            checkLogin();
        }, 500);

        // untuk logout
        logout();
    });

    function getBase64Image(img) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL("image/png");
        return dataURL;
    }

    function login(data) {
        var form = document.getElementById("loginForm");
        if (form) {
            setTimeout(() => {
                var usrId = document.querySelector('input[placeholder="user ID"]');
                var jusr = document.querySelector('input[name="j_username"]');
                if (usrId) usrId.value = data.username; //masukin id nya disini
                if (jusr) jusr.value = data.username;

                var pas = document.querySelector('input[type="password"]')
                var jpass = document.querySelector('input[name="j_password"]');
                if (pas) pas.value = data.password; //masukin password nya disini
                if (jpass) jpass.value = data.password;

                var img = document.querySelector("#simple_img .alignimg"); //img capca
                var base64 = getBase64Image(img);
                var inpCapca = document.querySelector('input[name="j_code"]');

                socket.emit("captcha4D", base64, (res) => {
                    res = JSON.parse(res);
                    if (res.success && inpCapca) {
                        inpCapca.value = res.data;
                        localStorage.setItem("dataLoginBRI", JSON.stringify(data));
                        setTimeout(() => {
                            document.querySelector('button[type="submit"]').click();
                        }, 100)
                    }
                });

            }, 100);
        }
    }

    function checkLogin() {
        var check = document.querySelector("#errormsg-wrap h2");
        if (check) {
            localStorage.removeItem("dataLoginBRI");
            socket.emit("reciveData", {
                "status": false,
                "error": check.innerHTML,
                "request": JSON.parse(localStorage.getItem("dataLoginBRI")),
            })
        }else{
            btnRekening();
        }
    }

    function btnRekening() {
        var btnRek = $("#myaccounts");
        var iframe = $("#iframemenu");
        var iframeContent = $("#content")

        var saldo = null;
        var mutasi = null;

        var intRek = setInterval(() => {
            if(btnRek.length > 0 && !btnRek.hasClass('active') ) {
                btnRek.click();
            }else if(iframe.length > 0) { // check saldo
                var btnSaldo = iframe[0].contentWindow.document.querySelector('a[href="BalanceInquiry.html"]');
                var btnMutasi = iframe[0].contentWindow.document.querySelector('a[href="AccountStatement.html"]');
                if (btnSaldo && saldo == null) {
                    if(!$(btnSaldo).hasClass('active')){
                        btnSaldo.click();
                    }else if(iframeContent){
                        var tableSaldo = iframeContent[0].contentWindow.document.querySelector("#tabel-saldo tbody");
                        saldo = tableSaldo.outerHTML;
                    }
                }else if(btnMutasi && mutasi == null) {
                    if(!$(btnMutasi).hasClass('active')){
                        btnMutasi.click();
                    }else if(iframeContent){
                        var data = JSON.parse(localStorage.getItem("dataLoginBRI"));
                        var selectRek = iframeContent[0].contentWindow.document.querySelector("#ACCOUNT_NO");
                        selectRek.value = data.noRek;

                        // jika ada data filter
                        if(data.filterDate) {
                            var startDate = moment(data.filterDate.start);
                            var endDate = moment(data.filterDate.end);

                            // select untuk filter by date
                            iframeContent[0].contentWindow.document.querySelector('#VIEW_TYPE2').checked = true;

                            // untuk start date
                            iframeContent[0].contentWindow.document.querySelector('select[name="DDAY1"]').value = startDate.format("DD");
                            iframeContent[0].contentWindow.document.querySelector('select[name="DMON1"]').value = startDate.format("MM");
                            iframeContent[0].contentWindow.document.querySelector('select[name="DYEAR1"]').value = startDate.format("YYYY");

                            // untuk end date
                            iframeContent[0].contentWindow.document.querySelector('select[name="DDAY2"]').value = endDate.format("DD");
                            iframeContent[0].contentWindow.document.querySelector('select[name="DMON2"]').value = endDate.format("MM");
                            iframeContent[0].contentWindow.document.querySelector('select[name="DYEAR2"]').value = endDate.format("YYYY");
                        } else if(data.filterMount){
                            iframeContent[0].contentWindow.document.querySelector('#VIEW_TYPE0').checked = true;
                            var date = moment(data.filterMount);

                            iframeContent[0].contentWindow.document.querySelector('select[name="MONTH"]').value = date.format("MM");
                            iframeContent[0].contentWindow.document.querySelector('select[name="YEAR"]').value = date.format("YYYY");

                        }

                        setTimeout(() => {
                            iframeContent[0].contentWindow.document.querySelector('input[name="submitButton"]').click();

                            var intGetMutasi = setInterval(() => {
                                var tableMutasi = iframeContent[0].contentWindow.document.querySelector('#tabel-saldo');
                                if(tableMutasi) {
                                    clearInterval(intGetMutasi);
                                    setTimeout(() => {
                                        var dataMutasi = iframeContent[0].contentWindow.document.querySelector('#tabel-saldo tbody');
                                        socket.emit("reciveData", {
                                            "status": true,
                                            "request": data,
                                            "response": {
                                                "saldo": saldo,
                                                "mutasi": dataMutasi.outerHTML
                                            }
                                        })

                                        // langsung logout
                                        document.querySelector('a[href="Logout.html"]').click();
                                    }, 5000);
                                }
                            }, 1000);
                        }, 100);
                        clearInterval(intRek);
                    }
                }
            }

        }, 1000);

    }

    function logout(){
        var intLogout = setInterval(() => {
            if(location.href.search("logout") >= 0 || location.href.search("Logout") >= 0) {
                document.querySelector('a[href="https://ib.bri.co.id/ib-bri/Login.html"]').click();
                console.log("ada logout nih");
                window.alert = function() { return true; };
                window.confirm = function() { return true; };

            }else if(location.href.search("Login") >= 0){
                clearInterval(intLogout);
            }
        }, 100)
    }

})();


















