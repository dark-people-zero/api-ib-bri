window.addEventListener("DOMContentLoaded", () => {
  chekBr();
  form();
  clickMutasi();
});

function chekBr() {
    var n = document.getElementById("captcha_audio");
    var i = document.getElementById("ans");
    var b = document.getElementById("jar");
    if (n) {
        // get image capcta
        var img = document.querySelector("img").getAttribute("src");
        // masukan script chapta disini
        i.value = "sample";
        // setTimeout(() => {
        //     b.click()
        // }, 100);
    }
}

function form() {
    var form = document.getElementById("loginForm");
    
    if (form) {
        setTimeout(() => {
            var usrId = document.querySelector('input[placeholder="user ID"]')
            if (usrId) usrId.value = "aira20001313"; //masukin id nya disini
        
            var pas = document.querySelector('input[type="password"]')
            if (pas) pas.value = "Aa788888"; //masukin password nya disini
        
            var img = document.querySelector("#simple_img .alignimg").getAttribute("src"); //img capca

            var inpCapca = document.querySelector('input[name="j_code"]');
            if (inpCapca) inpCapca.value = 1234; 

            var btn = document.querySelector('button[type="submit"]');
            // setTimeout(() => {
            //     if (btn) btn.click();
            // }, 100);

        }, 100);
        console.log("form ada");
    }else{
        console.log("form gak ada");
    }
}


function clickMutasi() {
    var ck = document.getElementById("main-page");
    if (ck) {
        console.log("main-page ada");
        document.getElementById("myaccounts").click();
        setTimeout(() => {
            document.querySelector('a[href="AccountStatement.html"]').click();
        }, 100);
    }
}