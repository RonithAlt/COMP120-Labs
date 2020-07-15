var map;
var xhr;

function initMap() {
    locateUser(function(position) {
        map = new google.maps.Map(document.getElementById("map"), {
            center: {lat: position["lat"], lng: position["lng"]},
            zoom: 4
        });
        populateMap(position);
    });
};

function locateUser(successHandler) {
    navigator.geolocation.getCurrentPosition(function(position) {
        position = {lat: position.coords.latitude, lng: position.coords.longitude};
        successHandler(position);
    }, function(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    });
}

function populateMap(position) {
    myMarker = new google.maps.Marker({position: position, map: map});
    locateVehicles(position, function(responseText) {
        vehicles = getVehicleData(responseText);
        markVehicles(vehicles);

        closest = closestVehicle(position, vehicles);
        closestVehiclePosition = {lat: closest.lat, lng: closest.lng};
        new google.maps.Polyline({path: [position, closestVehiclePosition], map: map});

        closestVehicleInfo = "Closest Vehicle ID: " + closest["id"] + "<br>Distance to Vehicle: " + closest.distance + " mi";
        var infowindow = new google.maps.InfoWindow({
            content: closestVehicleInfo
        });
        myMarker.addListener('click', function() {
            infowindow.open(map, myMarker);
        });
    });
}

function locateVehicles(position, successHandler) {
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            successHandler(this.responseText);
        }
    };
    xhr.open("POST", "https://warm-thicket-86100.herokuapp.com/rides");
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send("username=tXhMDHXE&lat=" + position["lat"] + "&lng="+ position["lng"]);
}

function getVehicleData(data) {
    vehicles = JSON.parse(data);
    return vehicles;
};

function markVehicles(vehicles) {
    var ii;
    for (ii = 0; ii < vehicles.length; ii++) {
        position = {lat: vehicles[ii]["lat"], lng: vehicles[ii]["lng"]};
        icon = "assets/car.png";
        new google.maps.Marker({position: position, icon: icon, map: map});
    }
}

function closestVehicle(me, vehicles) {
    var ii;
    var closest;
    shortestDistance = Number.MAX_SAFE_INTEGER;
    for (ii = 0; ii < vehicles.length; ii++) {
        vehiclePosition = new google.maps.LatLng({lat: vehicles[ii].lat, lng: vehicles[ii].lng})
        myPosition = new google.maps.LatLng({lat: me.lat, lng: me.lng})
        distance = google.maps.geometry.spherical.computeDistanceBetween(myPosition, vehiclePosition);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            closest = vehicles[ii];
        }
    }
    shortestDistanceMiles = shortestDistance * 0.000621371;
    shortestDistanceMiles = {distance: shortestDistanceMiles};
    closest = {...closest, ...shortestDistanceMiles};
    return closest;
}
