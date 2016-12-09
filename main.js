// npm install request --save 
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

var Drone = function (id, name, mac, location, date, files, files_count) {
	this._id = id;
	this.name = name;
	this.mac = mac;
        this.location = location;
        this.date = date;
        this.files = files;
        this.files_count = files_count;
};

var File = function (id, date_loaded, date_first_record, date_last_record, url, ref, contents, contents_count, droneid) {
	this._id = id;
	this.date_loaded = date_loaded;
	this.date_first_record = date_first_record;
        this.date_last_record = date_last_record;
        this.url = url;
        this.ref = ref;
        this.contents = contents;
        this.contents_count = contents_count;
        this.droneid = droneid;
};

var Content = function (id, mac, datetime, rssi, url, ref, droneid, fileid) {
	this._id = id;
	this.mac = mac;
	this.datetime = datetime;
        this.rssi = rssi;
        this.url = url;
        this.ref = ref;
        this.droneid = droneid;
        this.fileid = fileid;
};

var dronesSettings = new Settings("/drones?format=json");

dal.clearDrone();
dal.clearFile();
dal.clearContent();

request(dronesSettings, function (error, response, dronesString) {
	var drones = JSON.parse(dronesString);
	/*console.log(drones);
	console.log("***************************************************************************");*/
	drones.forEach(function (drone) {
		var droneSettings = new Settings("/drones/" + drone.id + "?format=json");
		request(droneSettings, function (error, response, droneString) {
			var drone = JSON.parse(droneString);
			dal.insertDrone(new Drone(
                                drone.id, 
                                drone.name, 
                                drone.mac_address, 
                                drone.location, 
                                drone.last_packet_date, 
                                drone.files, 
                                drone.files_count));
                        
                        var filesSettings = new Settings("/files?drone_id.is="+drone.id+"&format=json");
                        console.log(filesSettings);
                        request(filesSettings, function (error, response, filesString){
                            var files = JSON.parse(filesString);
                            /*console.log(files);
                            console.log("***************************************************************************");*/
                            files.forEach(function (file){
                                var fileSettings = new Settings("/files/" + file.id + "?format=json");
                                request(fileSettings, function (error, response, fileString){
                                    var file = JSON.parse(fileString);
                                    //console.log(file);
                                    dal.insertFile(new File(
                                            file.id, 
                                            file.date_loaded, 
                                            file.date_first_record, 
                                            file.date_last_record,
                                            file.url,
                                            file.ref,
                                            file.contents,
                                            file.contents_count,
                                            drone.id));
                                          
                                    var contentsSettings = new Settings("/files/" + file.id + "/contents?format=json");
                                    request(contentsSettings, function (error, response, contentsString){
                                        var contents = JSON.parse(contentsString);
                                        /*console.log(contents);
                                        console.log("***************************************************************************");*/
                                        contents.forEach(function (content){
                                           var contentSettings = new Settings("/files/" + file.id + "/contents/"+content.id+"?format=json");
                                           request(contentSettings, function (error, response, contentString){
                                               var content = JSON.parse(contentString);
                                               //console.log(content);
                                               dal.insertContent(new Content(
                                                       content.id,
                                                       content.mac_address,
                                                       content.datetime,
                                                       content.rssi,
                                                       content.url,
                                                       content.ref,
                                                       file.id,
                                                       drone.id));
                                           });
                                        });
                                    });
                                });
                            });
                        });
		});
	});
});

console.log("Hello World!");