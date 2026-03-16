/* ==========================
SERVICE WORKER INSTALL
========================== */

self.addEventListener("install", function(event){

console.log("Service Worker Installed");

self.skipWaiting();

});


/* ==========================
SERVICE WORKER ACTIVATE
========================== */

self.addEventListener("activate", function(event){

console.log("Service Worker Activated");

event.waitUntil(
self.clients.claim()
);

});


/* ==========================
NOTIFICATION CLICK
========================== */

self.addEventListener("notificationclick", function(event){

event.notification.close();

event.waitUntil(

clients.matchAll({type:"window", includeUncontrolled:true})
.then(function(clientList){

for(let i=0;i<clientList.length;i++){

let client = clientList[i];

if(client.url.includes("g.html") && "focus" in client){

return client.focus();

}

}

if(clients.openWindow){
return clients.openWindow("g.html");
}

})

);

});