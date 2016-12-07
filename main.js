// >$ npm install request --save 
var request = require("request");
var dal = require('./storage.js');

// http://stackoverflow.com/questions/10888610/ignore-invalid-self-signed-ssl-certificate-in-node-js-with-https-request
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


var BASE_URL = "https://web-ims.thomasmore.be/datadistribution/API/2.0";
var Settings = function (url) {
	this.url = BASE_URL + url;
	this.method = "GET";
	this.qs = {format: 'json'};
	this.headers = {
		authorization: "Basic aW1zOno1MTJtVDRKeVgwUExXZw=="
	};
};

var Drone = function (id, name, mac, location, date, files_count) {
	this._id = id
	this.name = name;
	this.mac = mac;
        this.location = location;
        this.date = date;
        this.files_count = files_count;
};

var File = function (id, date_loaded, date_first_record, date_last_record, contents_count) {
	this._id = id
	this.date_loaded = date_loaded;
	this.date_first_record = date_first_record;
        this.date_last_record = date_last_record;
        this.contents_count = contents_count;
};

var dronesSettings = new Settings("/drones?format=json");

dal.clearDrone();
dal.clearFile();

request(dronesSettings, function (error, response, dronesString) {
	var drones = JSON.parse(dronesString);
	/*console.log(drones);
	console.log("***************************************************************************");*/
	drones.forEach(function (drone) {
		var droneSettings = new Settings("/drones/" + drone.id + "?format=json");
		request(droneSettings, function (error, response, droneString) {
			var drone = JSON.parse(droneString);
			dal.insertDrone(new Drone(drone.id, drone.name, drone.mac_address, drone.location, drone.last_packet_date, drone.files_count));
                        
                        var filesSettings = new Settings("/files?drone_id.is="+drone.id+"&format=json");
                        request(filesSettings, function (error, response, filesString){
                            var files = JSON.parse(filesString);
                            /*console.log(files);
                            console.log("***************************************************************************");*/
                            files.forEach(function (file){
                                var fileSettings = new Settings("/files/" + file.id + "?format=json");
                                request(fileSettings, function (error, response, fileString){
                                    var file = JSON.parse(fileString);
                                    console.log(file);
                                    dal.insertFile(new File(file.id, file.date_loaded, file.date_first_record, file.date_last_record, file.contents_count));
                                });
                            });
                        });
		});
	});
});

console.log("Hello World!");