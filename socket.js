const express = require("express");
const unirest = require("unirest");
const { chromium } = require('playwright');
const randomUseragent = require('random-useragent');
const app = express();

app.use(express.json());

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

app.post("/request", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const noRek = req.body.noRek;
    const proxy = req.body.proxy;

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
    if (!proxy || proxy == "")
        error == null
        ? (error = { noRek: "Data Proxy tidak boleh kosong" })
        : (error.noRek = "Data Proxy tidak boleh kosong");

    if (error != null)
        return res.status(402).json({
            error: error,
        });
    
    await launcherScrapt({
        username: username,
        password: password,
        noRek: noRek,
        proxy: proxy
    }, (response) => {
        console.log(response);
        res.status(200).json(response);
    })
});

async function launcherScrapt(data, cb) {
    (async () => {
        const chrome = await chromium.launch({
            headless: false,
            proxy: data.proxy
        });
        const chrome_context = await chrome.newContext({
            userAgent: randomUseragent.getRandom()
        });
      
        // Open new page
        var page = await chrome_context.newPage();
      
        // Go to https://ib.bri.co.id/ib-bri/
        await page.goto('https://ib.bri.co.id/ib-bri/');

        var chaptaLogin = null;

        await chekrejected(chrome_context, chrome, page, 1);
        

        async function login (content, brouser, pages) {
            console.log("sudah masuk ke bagian login");
            // cek apakah form sudah mucnul atau tidak
            await pages.locator('#loginForm').waitFor("attached", 60000);
            await pages.locator('[placeholder="user ID"]').click();
          
            const username = await pages.$$('[placeholder="user ID"]');
            if (username) {
                await pages.locator('[placeholder="user ID"]').fill(data.username);
            } else {
                await pages.locator('[placeholder="username"]').fill(data.username);
            }
          
            // Press Tab
            await pages.locator('[placeholder="user ID"]').press('Tab');
          
            // Fill [placeholder="password"]
            await pages.locator('[placeholder="password"]').fill(data.password);
          
            // Press Tab
            await pages.locator('[placeholder="password"]').press('Tab');

            if (chaptaLogin) {
                if (chaptaLogin.success) {
                    console.log("ini data captca", chaptaLogin);
                    await pages.locator('[placeholder="validation"]').fill(chaptaLogin.data);
                    await pages.locator('button:has-text("Masuk")').click();

                    var rejected = await pages.$$("text='The requested URL was rejected'");
                    var blocked = await pages.$$("#captcha_audio");

                    if (rejected.length > 0 || blocked.length > 0) {
                        chekrejected(content, brouser, pages, 1);
                    }else{
                        await pages.waitForURL('https://ib.bri.co.id/ib-bri/Homepage.html', {
                            timeout: 30000
                        });
        
                        var error = await pages.$$("#errormsg-wrap");
                        if (error.length > 0) {
                            var textError = await pages.locator("#errormsg-wrap").textContent();
                            cb({
                                status: false,
                                error: textError
                            });
                            await content.close();
                            await brouser.close();
                        }else {
                            // Click #myaccounts
                            await pages.locator('#myaccounts').click();
            
                            // mulai ambil data saldo
                            await pages.frameLocator('iframe[name="menus"]').locator('a[href="BalanceInquiry.html"]').click();
                            await pages.frameLocator('iframe[name="content"]').locator('#tabel-saldo').waitFor("attached", 60000);
                            var saldo = await pages.frameLocator('iframe[name="content"]').locator('#tabel-saldo').innerHTML();
                            console.log("saldo",saldo);
    
                            // mulai ambil data mutasi
                            await pages.frameLocator('iframe[name="menus"]').locator('a[href="AccountStatement.html"]').click();
                            await pages.frameLocator('iframe[name="content"]').locator('#ACCOUNT_NO').press('Escape');
                            await pages.frameLocator('iframe[name="content"]').locator('#ACCOUNT_NO').click();
                            await pages.frameLocator('iframe[name="content"]').locator('#ACCOUNT_NO').press('ArrowDown');
                            await pages.frameLocator('iframe[name="content"]').locator('#ACCOUNT_NO').press('Enter');
                            
                            await pages.frameLocator('iframe[name="content"]').locator('input[name="submitButton"]').click();
    
                            await pages.frameLocator('iframe[name="content"]').locator('text=saldo akhir').waitFor("attached", 60000);
    
                            var mutasi = await pages.frameLocator('iframe[name="content"]').locator('#tabel-saldo').innerHTML();
                            console.log("mutasi",mutasi);
    
                            cb({
                                status: true,
                                data: {
                                    account: data.username,
                                    rekening: data.noRek,
                                    raw: {
                                        saldo: saldo,
                                        mutasi: mutasi
                                    }
                                }
                            })
    
                            pages.once('dialog', dialog => {
                                console.log(`Dialog message: ${dialog.message()}`);
                                dialog.dismiss().catch(() => {});
                            });
                            await pages.locator('text=Logout').first().click();
                            await pages.waitForURL('https://ib.bri.co.id/ib-bri/Logout.html');
    
                            await content.close();
                            await brouser.close();
                        }
                    }

                    
                }else{
                    cb({
                        status: chaptaLogin.success,
                        error: chaptaLogin.error
                    });
                    await content.close();
                    await brouser.close();
                }
            }
        }

        async function chekrejected (content, brouser, pages, ind) {
            pages.on('response', function(res) {
                console.log(res.url());
                if (res.url() == "https://ib.bri.co.id/ib-bri/login/captcha") {
                    res.body().then((e) => {
                        getCaptcha(e.toString('base64'),(data) => {
                            chaptaLogin = data.body;
                        });
                    })
                }
            });

            await pages.waitForTimeout(3000);
            var rejected = await pages.$$("text='The requested URL was rejected'");
            var blocked = await pages.$$("#captcha_audio");
            
            if (ind < 10) {
                if (rejected.length > 0 || blocked.length > 0) { // coba pake firefox
                    await content.close();
                    await brouser.close();
    
                    const chromeNew = await chromium.launch({
                        headless: false,
                    });
                    const chrome_context_new = await chromeNew.newContext({
                        userAgent: randomUseragent.getRandom()
                    });
                  
                    // Open new page
                    pages = await chrome_context_new.newPage();
                  
                    await pages.goto('https://ib.bri.co.id/ib-bri/');
                    chekrejected(chrome_context_new, chromeNew, pages, ind+1);
                }else {
                    await login(content, brouser, pages);
                }
            }else {
                await content.close();
                await brouser.close();

                cb({
                    status: false,
                    error: "Semua user agent di block, silahkan coba beberapa saat lagi"
                });
            }
        }
      

        
      
        // ---------------------
        
    })();
}

app.listen(3000);
