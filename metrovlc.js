/* MagicMirror²
 * Module: MetroVLC
 *
 * By Dani Jimenez
 * MIT Licensed.
 */
Module.register("metrovlc", {
	// Default module config.
	defaults: {
		text: "Metro VLC",
		useRealtime: true,
		updateInterval: 30 * 1000, // Update 30 secs
		stationFrom: 122,
		stationTo: 182
	},
	getHeader: function () {
		if (this.origin == null || this.destination == null) {
			return (this.data.header = "MetroVLC");
		} else {
			return (this.data.header = this.origin + " - " + this.destination);
		}
	},
	start: function () {
		Log.info("Starting module: " + this.name);
		this.loaded = false;
		this.updateTimer = null;
		this.origin = null;
		this.destination = null;
		this.scheduleUpdate();
	},
	scheduleUpdate: function () {
		clearTimeout(self.updateTimer);
		self.updateTimer = setTimeout(function () {
			console.log("sending noti");
			self.sendSocketNotification("GETDATA", this.config);
		}, self.config.updateInterval);
	},

	getDom: function () {
		var wrapper = document.createElement("div");

		if (!this.loaded) {
			wrapper.innerHTML = "Loading connections ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var table = document.createElement("table");
		table.className = "small";

		this.origin = this.transports.origen;
		this.destination = this.transports.destino;
		this.data.header = this.transports.origen + " - " + this.transports.destino;

		// adding next schedules
		for (var t in this.transports.horarios) {
			var transports = this.transports.horarios[t];
			var row = document.createElement("tr");
			var lineaCell = document.createElement("td");
			lineaCell.innerHTML = transports.linea;
			lineaCell.className = "align-left bright";
			row.appendChild(lineaCell);
			var horarioCell = document.createElement("td");
			horarioCell.innerHTML = transports.hora;
			horarioCell.className = "align-right bright";
			row.appendChild(horarioCell);

			table.appendChild(row);
		}

		return table;
	},
	// using the results retrieved for the API call
	socketNotificationReceived: function (notification, payload) {
		const self = this;
		console.log(notification);
		console.log(payload);
		if (notification === "TRANSPORTS") {
			Log.info("\r\nTransports received");
			Log.info("\r\n" + payload);
			this.transports = payload;
			this.loaded = true;
			this.updateDom();
			this.scheduleUpdate();
		}
	}
});
