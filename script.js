/* ========================== JS ========================== */
const form = document.getElementById("form");
let capturedImage = "";
let cameraActive = false;

/* ========================== REGISTER SERVICE WORKER ========================== */
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js")
  .then(function(){
    console.log("Service Worker Registered");
  });
}

/* ========================== REQUEST NOTIFICATION PERMISSION ========================== */
function askNotification(){
  if("Notification" in window){
    Notification.requestPermission().then(function(permission){
      if(permission === "granted"){
        console.log("Notification Permission Granted");
      }
    });
  }
}
askNotification();

/* ========================== PHONE NUMBER VALIDATION ========================== */
document.getElementById("phone").addEventListener("input", function(){
  this.value = this.value.replace(/[^0-9]/g,'').slice(0,10);
});

/* ========================== AUTO CAPITALIZE ========================== */
function autoCapitalize(id){
  document.getElementById(id).addEventListener("input", function(){
    let words = this.value.toLowerCase().split(" ");
    for(let i=0;i<words.length;i++){
      if(words[i].length>0){
        words[i] = words[i][0].toUpperCase() + words[i].substring(1);
      }
    }
    this.value = words.join(" ");
  });
}
autoCapitalize("name");
autoCapitalize("area");
autoCapitalize("address");

/* ========================== FILE IMAGE CHECK ========================== */
document.getElementById("image").addEventListener("change", function(){
  if(cameraActive){
    alert("Camera already active. Cannot upload file.");
    this.value="";
  }
});

/* ========================== OPEN CAMERA ========================== */
document.getElementById("openCam").onclick = function(){
  let file = document.getElementById("image").files[0];
  if(file){
    alert("File already selected. Cannot open camera.");
    return;
  }
  navigator.mediaDevices.getUserMedia({video:true})
  .then(function(stream){
    cameraActive = true;
    document.getElementById("camera").srcObject = stream;
  });
};

/* ========================== CAPTURE PHOTO ========================== */
document.getElementById("captureBtn").onclick = function(){
  const video = document.getElementById("camera");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video,0,0);
  capturedImage = canvas.toDataURL("image/png");
  document.getElementById("preview").src = capturedImage;
};

/* ========================== ADMIN LOGIN FIX ========================== */
function adminLogin(){
  const user = document.getElementById("adminUser").value;
  const pass = document.getElementById("adminPass").value;
  const adminUser = "lucky"; // your admin username
  const adminPass = "lucky28";  // your admin password

  if(user === adminUser && pass === adminPass){
    alert("Admin login successful");
    window.location.href = "admin-dashboard.html";
  } else {
    alert("Wrong username or password");
  }
}
/* ========================== ADMIN LOGOUT ========================== */
function adminLogout(){
  localStorage.removeItem("adminLoggedIn"); // clear admin session
  alert("Logged out successfully");
  window.location.href = "g.html"; // redirect to main page
}

/* ========================== FAKE PHOTO DETECTION ========================== */
function detectFakePhoto(file, callback){
  if(!file){
    callback(false);
    return;
  }

  // simple size check
  if(file.size < 50000){
    alert("⚠ Image looks suspicious (too small). Upload real garbage photo.");
    callback(true);
    return;
  }

  let img = new Image();
  let reader = new FileReader();

  reader.onload = function(e){
    img.src = e.target.result;
  }

  img.onload = function(){
    if(img.width < 300 || img.height < 300){
      alert("⚠ Image resolution too low. Possible fake image.");
      callback(true);
    } else {
      callback(false);
    }
  }

  reader.readAsDataURL(file);
}

/* ========================== FORM SUBMIT ========================== */
form.addEventListener("submit", function(e){
  e.preventDefault();

  let name = document.getElementById("name").value;
  let phone = document.getElementById("phone").value;
  let area = document.getElementById("area").value;
  let address = document.getElementById("address").value;
  let waste = document.getElementById("waste").value;
  let priority = document.getElementById("priority").value;
  let desc = document.getElementById("desc").value;
  let file = document.getElementById("image").files[0];

  if(!name || !phone || !area || !address || !waste || !priority || !desc){
    alert("Please fill all fields");
    return;
  }

  function save(img){
    let today = new Date().toLocaleString();
    let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

    let obj = {
      name, phone, area, address, waste, priority, desc,
      date: today,
      status: "Pending",
      image: img,
      cleanImage: ""
    };

    complaints.push(obj);
    localStorage.setItem("complaints", JSON.stringify(complaints));

    // save to history
    let history = JSON.parse(localStorage.getItem("history")) || [];
    history.push(obj);
    localStorage.setItem("history", JSON.stringify(history));

    // update heatmap
    updateHeatmap(area);

    // send notification
    sendNotification(area);

    alert("Complaint Submitted Successfully");
    form.reset();
    capturedImage = "";
    cameraActive = false;
    document.getElementById("preview").src = "";
  }

  if(file){
    detectFakePhoto(file, function(fake){
      if(fake) return;

      const reader = new FileReader();
      reader.onload = function(){
        save(reader.result);
      }
      reader.readAsDataURL(file);
    });
  } else if(capturedImage !== ""){
    save(capturedImage);
  } else {
    alert("Upload or capture an image");
  }
});

/* ========================== NOTIFICATION ========================== */
function sendNotification(area){
  if(Notification.permission === "granted"){
    navigator.serviceWorker.getRegistration().then(function(reg){
      if(reg){
        reg.showNotification("Clean City 🚛",{
          body:"New garbage complaint reported in " + area,
          icon:"icon.png",
          badge:"icon.png"
        });
      }
    });
  }
}

/* ========================== HEATMAP ========================== */
function updateHeatmap(area){
  let heat = JSON.parse(localStorage.getItem("heatmap")) || {};
  heat[area] = (heat[area] || 0) + 1;
  localStorage.setItem("heatmap", JSON.stringify(heat));
}

/* ========================== SEARCH COMPLAINTS ========================== */
function searchComplaints(){
  let text = document.getElementById("searchInput").value.toLowerCase();
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  let filtered = complaints.filter(function(c){
    return (
      c.area.toLowerCase().includes(text) ||
      c.name.toLowerCase().includes(text) ||
      c.waste.toLowerCase().includes(text)
    );
  });
  displayComplaints(filtered);
}

/* ========================== FEEDBACK ========================== */
function saveFeedback(name,message){
  let feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || [];
  feedbacks.push({
    name:name,
    message:message,
    date:new Date().toLocaleString()
  });
  localStorage.setItem("feedbacks", JSON.stringify(feedbacks));
}