var rater_id = "markus";
var current_drawing_id = 0;
var jobs = {}

function init(){

    // SKETCHPAD
    document.getElementById('nextBtn').onclick=prevDrawing;
    document.getElementById('nextBtn').onclick=nextDrawing;
    document.getElementById('lookupBtn').onclick=getDrawing;
    //setInterval(updateJobs, 1000);
}

/*
async function addJob() {
    let res = await fetch("https://creativity-en.herokuapp.com/api/view?drawing_id="+drawing_id, {method: 'POST'});
    let job = await res.json();
    jobs[job.id] = {id: job.id, state: "queued"};
}

async function updateJobs() {
    for (let id of Object.keys(jobs)) {
      let res = await fetch("https://creativity-en.herokuapp.com/api/view?job_id="+id);
      let result = await res.json();
      if (!!jobs[id]) {
        jobs[id] = result;
      }

    }
*/ 
async function getDrawing(){
    
    var drawing_id = document.getElementById("img_id").value;
    var output = document.getElementById(output);
    drawing_data={};
    
    await fetch("https://creativity-en.herokuapp.com/api/view?id="+drawing_id)
    .then(res => res.json())
    .then(data => {
        drawing_data=data.drawing;
        var remaining = { ... data};
        delete remaining.drawing;
        document.getElementById("json").textContent = JSON.stringify(remaining, undefined, 2);
    });

    var el = document.getElementById('sketchpad');
    el.innerHTML="";
    var pad = new Sketchpad(el);
    pad.setLineColor('#000000');
    pad.loadJSON(drawing_data);
}

function prevDrawing(){
    var drawing_id = document.getElementById("img_id").value;
    drawing_id = drawing_id - 1;
    document.getElementById("img_id").value = drawing_id;
    getDrawing();
}

function nextDrawing(){
    var drawing_id = document.getElementById("img_id").value;
    drawing_id++;
    document.getElementById("img_id").value = drawing_id;
    getDrawing();
}

