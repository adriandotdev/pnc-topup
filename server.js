const app = require("./app");

const httpServer = require("http").createServer(app);

httpServer.listen(process.env.PORT, () => {
	console.log("Server is running on port: " + process.env.PORT);
});
