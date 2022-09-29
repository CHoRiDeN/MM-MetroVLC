/* MagicMirror²
 * Module: MetroVLC
 *
 * By Dani Jimenez
 * MIT Licensed.
 */
const NodeHelper = require("node_helper");
const forge = require("node-forge");
const unirest = require("unirest");

module.exports = NodeHelper.create({
	updateTimer: "",
	start: function () {
		this.started = false;
		console.log("MMM-Ratp- NodeHelper started");
	},

	updateTimetable: function(config) {
		var self = this;
		var retry = false;
		// calling this API
		var today = new Date();
		let requData = "action=horarios-ruta&origen="+config.stationFrom+"&destino="+config.stationTo+"&dia=" + this.formatDate(new Date, "-") + "&horaDesde=" + today.getHours() + "%3A" + String(today.getMinutes()).padStart(2, "0") + "&horaHasta=23%3A59";
		console.log(requData);
		unirest.post("https://www.metrovalencia.es/wp-admin/admin-ajax.php")

			.send({ action: "formularios_ajax", data: requData })
			.end(function(r) {
				console.log("response:");
				//console.log(r.body);
				let jsonResponse = JSON.parse(r.body);
				console.log(jsonResponse);
				let horarios = jsonResponse.horarios[0].horas;
				let trenes = jsonResponse.horarios[0].trenes;
				const origen = jsonResponse.origen.nombre;
				const destino = jsonResponse.destino.nombre;

				self.processResponse(horarios, trenes, origen, destino);
			});
	},

	padTo2Digits: function(num) {
		return num.toString().padStart(2, "0");
	},

	formatDate: function(date, separator) {
		return [
			date.getFullYear(),
			this.padTo2Digits(date.getMonth() + 1),
			this.padTo2Digits(date.getDate())
		].join(separator);
	},


	processResponse: function(horarios, trenes, origen, destino) {
		this.transports = [];
		let maxResults;
		horarios.length > 3 ? (maxResults = 3) : (maxResults = horarios.length);

		const today = this.formatDate(new Date, "/");
		for (var i = 0; i < maxResults; i++) {
			let hora = horarios[i][0];
			var diff = Math.abs(new Date(today + " " + hora) - new Date());
			var minutes = Math.floor((diff / 1000) / 60);
			let linea = trenes[horarios[i][1]].linea;
			console.log(horarios[i]);
			console.log(linea);
			this.transports.push({
				hora: minutes > 60 ? hora : minutes + " min",
				linea: linea
			});
		}
		this.loaded = true;

		this.sendSocketNotification("TRANSPORTS", {
			horarios: this.transports,
			origen: origen,
			destino: destino
		});
	},


	socketNotificationReceived: function(notification, config) {

		const self = this;

		if (notification === "GETDATA") {
			self.updateTimetable(config);
		}
	}
});
