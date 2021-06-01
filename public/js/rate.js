var rater_id = "markus";
var features = ["blades", "eyestalks", "foliage", "light", "propeller", "robotic", "springs", "suction-cups", "bubbles", "wheels", "speakers", "odd-locomotion", "other-novel", "anus", "arms", "breasts", "claws", "ears", "eyes", "fangs", "feet", "fur", "hands", "head", "organs", "nose", "hooves", "paws", "teeth", "tongue", "two-legs", "whiskers", "mouth", "other-common", "belly-button",  "feathers", "fins", "flippers", "gills", "horns", "mane", "odd-legs",  "scales", "segmented-body", "pouch", "shell", "reptilian", "stinger", "stripes", "tentacles", "trunk", "tusks", "webbed-feet", "wings", "beak", "spikes", "dots", "other-uncommon", "belt", "cape", "earrings", "hat", "shoes", "tie", "other-misc"];
var current_drawing_id=0;

function init(){

    document.getElementById('prevBtn').onclick=prevDrawing;
    document.getElementById('nextBtn').onclick=nextDrawing;
    document.getElementById('saveBtn').onclick=putRating;
    document.getElementById('lookupBtn').onclick=getDrawing;
    createChkboxes();
}

function createChkboxes(){
    for (var i=0; i<features.length; i++){
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = features[i];
        checkbox.name = 'q2';
        checkbox.value = features[i];
        
        var label = document.createElement('label')
        label.htmlFor = features[i];
        label.appendChild(document.createTextNode(" " + features[i]));
        
        var br = document.createElement('br');
        
        var container = document.getElementById('features');
        container.appendChild(checkbox);
        container.appendChild(label);
        container.appendChild(br);
    }
    
}

async function getDrawing(){
    
    var drawing_data = {};
    var description="";
    var rater_id = document.getElementById('rater_id').value;
    var img_id = document.getElementById('img_id').value;
    
    var el = document.getElementById('sketchpad');
    el.innerHTML="";
    var pad = new Sketchpad(el);
    pad.setLineColor('#000000');
    
    await fetch("https://creativity-en.herokuapp.com/api/rate_drawing?rater_id="+rater_id+"&img_id="+img_id)
    .then(res => res.json())
    .then(data => {
        console.log(data);
        current_drawing_id=data.id;
        drawing_data=data.drawing;
        description=data.descr;
    });
    pad.loadJSON(drawing_data);
    document.getElementById("description").innerHTML=description; 
    unChkBoxes(); 
    document.getElementById("other").value="";
    
}

// https://stackoverflow.com/questions/8563240/how-to-get-all-checked-checkboxes/31113246
// Pass the checkbox name to the function
function getCheckedBoxes(chkboxName) {
    var checkboxes = document.getElementsByName(chkboxName);
    var checkboxesChecked = [];
    // loop over them all
    for (var i=0; i<checkboxes.length; i++) {
       // And stick the checked ones onto an array...
       if (checkboxes[i].checked) {
          checkboxesChecked.push(checkboxes[i].value);
       }
    }
    // Return the array if it is non-empty, or null
    return checkboxesChecked.length > 0 ? checkboxesChecked : null;
  }
  
  // Call as
 

function putRating(){
    var ele = document.getElementsByTagName('input');
    var checkedFeatures = getCheckedBoxes("q2").join('|');
    checkedFeatures +="|"+document.getElementById("other").value;
    rating_data = {
        rater_id: document.getElementById('rater_id').value,
        drawing_id: document.getElementById('img_id').value,
        q1: 0,
        q2: checkedFeatures
    }
    
    for(i = 0; i < ele.length; i++) {      
        if(ele[i].type=="radio") { 
            if(ele[i].checked){
                rating_data[ele[i].name] = ele[i].value;
            }
        }
    }

    
    console.log(rating_data);
    var response = putData("https://creativity-en.herokuapp.com/api/rate_drawing", rating_data);
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

function unChkBoxes() {
    var checkboxes = document.getElementsByName('q2');
    for (var checkbox of checkboxes) {
      checkbox.checked = false;
    }
  }