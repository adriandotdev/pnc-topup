const config = {}; //variable init of configuration files
config.server = {};
config.db = {};
config.nodemailer = {};
config.jwt = {};
config.secretKey = {};
config.logger = {};
config.googleAuth = {};
config.parkncharge = {};
config.encryption = {};

/* app settings */
config.server.port = 4001; // Change this port depending on your project.
config.server.env = "test";

/* MySQL Database Setup */
config.db.host =
	process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
		? "localhost"
		: process.env.NODE_ENV === "stg"
		? "192.46.227.227"
		: "";
config.db.user = "root";
config.db.password = "4332wurx";
config.db.database =
	process.env.NODE_ENV === "dev"
		? "parkncharge"
		: process.env.NODE_ENV === "test"
		? "parkncharge_test"
		: process.env.NODE_ENV === "stg"
		? "parkncharge"
		: "";
config.db.connection_limit =
	process.env.NODE_ENV === "test" || process.env.NODE_ENV === "dev" ? 10 : 20;

/** Nodemailer Setup */
config.nodemailer.name = process.env.NODE_ENV === "stg" ? "hostgator" : "";
config.nodemailer.host =
	process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
		? "smtp.ethereal.email"
		: process.env.NODE_ENV === "stg"
		? "mail.parkncharge.com.ph"
		: "";

config.nodemailer.port =
	process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
		? 587
		: process.env.NODE_ENV === "stg"
		? 465
		: 0;

config.nodemailer.user =
	process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
		? "maud86@ethereal.email"
		: process.env.NODE_ENV === "stg"
		? "no-reply@parkncharge.com.ph"
		: "";

config.nodemailer.password =
	process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
		? "WhszSwcqeJdbpSpzTY"
		: process.env.NODE_ENV === "stg"
		? "4332wurx-2023"
		: "";

config.nodemailer.transport = "smtp";
config.nodemailer.secure =
	process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
		? false
		: process.env.NODE_ENV === "stg"
		? true
		: "";

config.nodemailer.path = "http://localhost:3002";

// JWT Secret Keys
config.jwt.accessTokenSecretKey = "parkncharge-4332wurx-access";
config.jwt.refreshTokenSecretKey = "parkncharge-4332wurx-refresh";

// username and secret key
config.secretKey.username = "sysnetparkncharge";
config.secretKey.password = "4332wurxparkncharge";

/* Winston Logger */
config.logger.maxsize = 52428800; // In Bytes
config.logger.maxFiles = 5;

// Google API
config.googleAuth.GEO_API_KEY = "AIzaSyASXoodW78ADiwCRsBog4MI9U_he10aTV8";

// HUB AuthModule SECRET KEY
config.parkncharge.secretKey = "sysnetintegratorsinc:parkncharge";

// Crypto Encryption
config.encryption.algorithm = "aes-256-cbc";
config.encryption.secret_key = "d6F3Efeqd6F3Efeqd6F3Efeqd6F3Efeq";
config.encryption.iv = "3bd269bc5b740457";

module.exports = config;
