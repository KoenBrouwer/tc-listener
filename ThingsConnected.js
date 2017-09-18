let request = require("request");
let ws = require("ws");

let API = {
	login: "https://backend.thingsconnected.nl/api_v1/login",
	websocket: "https://backend.thingsconnected.nl/api_v1/websocket",
};

class TC {
	constructor(config, listenCallback) {
		this.config = config;
		this.loggedIn = false;
		this.payload = {
			username: config.user,
			password: config.pass
		};

		/* Enable cookieJar */
		request = request.defaults({jar: true});

		/* Start login */
		this._login(() => {
			/* Retrieve a new WebsocketUrl */
			this._getWebsocketUrl((url, protocol) => {
				this.Websocket = {
					url: url,
					protocol: protocol
				};
				this._listen(listenCallback);
			});
		});
	}

	/**
	 * Method to login into the API
	 * @param callback
	 * @private
	 */
	_login(callback) {
		request.post(API.login, {body: JSON.stringify(this.payload)}, (err, body, res) => {
			/* Check if there is a response */
			if(res.length > 0){
				/* Parse JSON data */
				res = JSON.parse(res);

				/* Check if the "ok" field has a value of 1 */
				if(res.ok == 1){
					/* Set logged in to true */
					this.loggedIn = true;

					/* Execute the callback */
					callback();
					return true;
				}
				else{
					console.error("Error: ", res);
				}
			}
		});
	}

	/**
	 * Method to get the Websocket URL from the API
	 * @param callback
	 * @private
	 */
	_getWebsocketUrl(callback) {
		request.get(API.websocket, (err, body, res) => {
			let data = JSON.parse(res);
			callback(data.endpoint, data.protocol);
		});
	}

	/**
	 * Method that opens a websocket to ThingsConnected and executes callback when a message arrives
	 * @param callback
	 */
	_listen(callback) {
		let tcws = new ws(this.Websocket.url, this.Websocket.protocol);
		tcws.on("open", () => {
			console.log("Connected to ThingsConnected.");
			tcws.on("message", callback);
			tcws.on("close", () => {
				console.log("Closed connection to ThingsConnected.");
			});
		});
	}
}

module.exports = TC;