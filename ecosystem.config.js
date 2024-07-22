//config app for PM2
module.exports = {
	apps: [
		{
			name: "pnc-topup:4014", //label
			script: "server.js", //entrypoint
		},
	],
};
