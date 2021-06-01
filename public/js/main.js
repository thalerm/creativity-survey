var currentTab = 0;
const prepSeconds = 90;
const drawingSeconds = 420;
var exp_group = 0;
var first_id = "";
var survey_data = {};

async function postData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

async function putData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

function countdownTimer (seconds, el, callback){
    var countDownTime = new Date().getTime() + seconds * 1000;

    // Update the count down every 1 second
    var x = setInterval(function() {

        // Get today's date and time
        var now = new Date().getTime();

        // Find the distance between now and the count down date
        var distance = countDownTime - now;

        // Time calculations for days, hours, minutes and seconds
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the element with id="demo"
        el.innerHTML = minutes + "m " + seconds + "s";

        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(x);
            el.innerHTML = "";
            callback("Timer over");
        }
    }, 1000);
}

function showTab(n) {
    // This function will display the specified tab of the form ...
    console.log(currentTab);
    var x = document.getElementsByClassName("tab");
    x[n].style.display = "block";
    switch(n){
        case 0:
            document.getElementById("prevBtn").style.display = "none";
            document.getElementById("nextBtn").style.display = "inline";
            break;
        case 1:
            document.getElementById("prevBtn").style.display = "none";
            document.getElementById("nextBtn").style.display = "none";
            loadPrep();
            break;
        case 2:
            document.getElementById("prevBtn").style.display = "none";
            document.getElementById("nextBtn").style.display = "none";
            loadDrawing();
            break;
        case 3:
            document.getElementById("prevBtn").style.display = "none";
            document.getElementById("nextBtn").style.display = "inline";
            document.getElementById("nextBtn").innerHTML = "Next";
            document.getElementById("nextBtn").onclick = postSurvey;
            break;
        case (x.length - 2):
            document.getElementById("nextBtn").innerHTML = "Submit";
            document.getElementById("nextBtn").onclick = submit;
            break;
        case (x.length - 1):
            document.getElementById("prevBtn").style.display = "none";
            document.getElementById("nextBtn").style.display = "none";
            break;
        default:
            document.getElementById("nextBtn").innerHTML = "Next";
            document.getElementById("nextBtn").style.display = "inline";
    }
    fixStepIndicator(n)
}

function nextPrev(n) {
    // This function will figure out which tab to display
    var x = document.getElementsByClassName("tab");
    // Hide the current tab:
    x[currentTab].style.display = "none";
    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    // if you have reached the end of the form... :
    if (currentTab >= x.length) {
      //...the form gets submitted:
      //document.getElementById("regForm").submit();
      return false;
    }
    // Otherwise, display the correct tab:
    showTab(currentTab);
}

function fixStepIndicator(n) {
    // This function removes the "active" class of all steps...
    var i, x = document.getElementsByClassName("step");
    for (i = 0; i < x.length; i++) {
      x[i].className = x[i].className.replace(" active", "");
    }
    //... and adds the "active" class to the current step:
    x[n].className += " active";
}

function loadPrep() {
    fetch("https://creativity-en.herokuapp.com/api/example")
    .then(res => res.json())
    .then(data => {
        var examples = document.getElementById("examples");
        exp_group = data.exp_group;
        first_id = data.first_id;
        switch(exp_group){
            case 1:
                examples.innerHTML = "<p><b>Now it is your time to think of possible creatures.</b></p>"
                break;
            case 2:
                examples.innerHTML = '<p><b>Now think of possible creatures, while having a look at the examples below.</b></p><img src="2.png" id="exampleImg">' //
                break;
            case 3:
                examples.innerHTML = '<p><b>Now think of possible creatures, while having a look at the examples below.</b></p><img src="3.png" id="exampleImg">'
                break;
        }   
    })
    preptimer = document.getElementById("preptimer");
    countdownTimer(prepSeconds, preptimer, function(value){
        console.log(value);
        nextPrev(1);
    })
    
}


function loadDrawing(){
    // SKETCHPAD
    var el = document.getElementById('sketchpad');
    var pad = new Sketchpad(el);
    var amount = 0;

    // Set line color
    pad.setLineColor('#000000');
    pad.setLineSize(3);

    // clear pad
    function clear() {
    pad.clear();
    }
    document.getElementById('clear').onclick = clear;

    function undo() {
        pad.undo();
    }
    document.getElementById('undo').onclick = undo;

    function saveandclear() {
        var drawing = JSON.stringify(pad.toJSON());
        var description = document.getElementById('description');
        var timeRemaining = document.getElementById('drawtimer').innerHTML;
        var amountSpan = document.getElementById('amount');
        if (description.value ==""){
            document.getElementById("description").className = "form-control is-invalid";
            document.getElementById("label-desc").className = "alert alert-danger";
            return;
        } else {
        document.getElementById('saveandclear').innerHTML = "Save Drawing and next Creature (wait <span id='cooldown'></span>)";
        document.getElementById('saveandclear').className = "btn btn-lg btn-primary disabled";
        cooldown = document.getElementById('cooldown');
        countdownTimer(10, cooldown, function(value){
            document.getElementById('saveandclear').innerHTML = "Save Drawing and next Creature";
            document.getElementById('saveandclear').className = "btn btn-lg btn-primary";
        })
        document.getElementById("description").className = "form-control";
        document.getElementById("label-desc").className = "";
        }

        var drawing_data = {
            drawing: drawing,
            description: description.value,
            time_remaining: timeRemaining,
            exp_group: exp_group,
            first_id: first_id
        }
        var response = postData("https://creativity-en.herokuapp.com/api/drawing", drawing_data);
        pad.clear();
        description.value = "";
        amount = amount + 1;
        amountSpan.innerHTML = amount;
    }
    document.getElementById('saveandclear').onclick = saveandclear;

    // COUNTDOWN Timer
    drawtimer = document.getElementById("drawtimer");
    countdownTimer(drawingSeconds, drawtimer, function(value){
        console.log(value);
        saveandclear();
        nextPrev(1);
    })
}


function postSurvey(){
    var ele = document.getElementsByTagName('input');
    var radionames = [];
    survey_data = {
        first_id: first_id,
        exp_group: exp_group,
    }
    
    for(i = 0; i < ele.length; i++) {      
        if(ele[i].type=="radio" && ele[i].name!="agree") { 
            radionames.push(ele[i].getAttribute('name'));
            if(ele[i].checked){
                survey_data[ele[i].name] = ele[i].value;
            }
        }     
    }
    var unique = radionames.filter((v, i, a) => a.indexOf(v) === i); 
    try{
        for (i=0; i < unique.length; i++){
            var radioele = document.getElementsByName(unique[i]);
            if (!validateRadio(unique[i])){
                console.log(unique[i]);
                for (j=0; j < radioele.length; j++){
                    radioele[j].className = "form-check-input is-invalid";
                    document.getElementById("alert-form").style.display = "block";
                }
                throw new Error("Radioelement "+unique[i]+" not filled.")
            } else {
                for (k=0; k < radioele.length; k++){
                    radioele[k].className = "form-check-input";
                    document.getElementById("alert-form").style.display = "none";
                }
            }    
        }
        var age = document.getElementById('age');
        if (isNaN(age.value) || age.value ==""){
            age.className = "form-control is-invalid";
            document.getElementById("alert-form").style.display = "block";
            throw new Error("Element "+age.id+" not filled.")
        } else {
            age.className = "form-control";
            document.getElementById("alert-form").style.display = "none";
            survey_data['age'] = age.value;
        }
    } catch(e) {
        console.log(e);
        return;
    }
    postData("https://creativity-en.herokuapp.com/api/survey", survey_data);
    nextPrev(1);

}


function validateRadio(radioname){
    var radios = document.getElementsByName(radioname);
    var formValid = false;

    var i = 0;
    while (!formValid && i < radios.length) {
        if (radios[i].checked) {
            formValid = true;
        }
        i++;        
    }
    
    return formValid;

}

async function submit() {
    var radioele = document.getElementsByName("agree");
    var submit_data = {
        first_id: first_id
    }
    if (!validateRadio("agree")){
        console.log("agree");
        for (j=0; j < radioele.length; j++){
            radioele[j].className = "form-check-input is-invalid";
            document.getElementById("alert-form").style.display = "block";
        }
    } else {
        for (k=0; k < radioele.length; k++){
            radioele[k].className = "form-check-input";
            document.getElementById("alert-form").style.display = "none";
            if (radioele[k].checked) {
                var mechturk = 0;
                switch (radioele[k].value){
                    case "no":
                        submit_data['submitted'] = false;
                        break;
                    case "yes":
                        submit_data['submitted'] = true;
                        break;
                }
                console.log(submit_data);
                var result = await putData('https://creativity-en.herokuapp.com/api/submit', submit_data)
                .then(result => {
                    mechturk=result.code;
                });
                nextPrev(1);
                console.log(result);
                document.getElementById("mechturk").innerHTML="Personal Code: " + mechturk;
            }
        }
    }  
    
}

function init(){
    // https://www.w3schools.com/howto/howto_js_form_steps.asp
    showTab(currentTab);
    window.onbeforeunload = function() { return "Your work will be lost."; };
}

