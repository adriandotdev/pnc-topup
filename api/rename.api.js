const { AccessTokenVerifier } = require("../middlewares/TokenMiddleware"); // Remove this if unused
const { validationResult, body } = require("express-validator");

const logger = require("../config/winston");

// Import your SERVICE HERE
// Import MISC HERE

/**
 * @param {import('express').Express} app
 */
module.exports = (app) => {
	/**
	 * This function will be used by the express-validator for input validation,
	 * and to be attached to APIs middleware.
	 * @param {*} req
	 * @param {*} res
	 */
	function validate(req, res) {
		const ERRORS = validationResult(req);

		if (!ERRORS.isEmpty()) {
			throw new HttpUnprocessableEntity(
				"Unprocessable Entity",
				ERRORS.mapped()
			);
		}
	}

	app.get(
		"your_path",
		[AccessTokenVerifier],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res) => {
			try {
				logger.info({
					NAME_THIS_LOG_REQUEST: {
						// your call what data you need to log
					},
				});

				/** Your logic here */
				logger.info({
					NAME_THIS_LOG_RESPONSE: {
						// your call what data you need to log
					},
				});
				return res
					.status(200)
					.json({ status: 200, data: [], message: "Success" });
			} catch (err) {
				logger.error({
					GET_CPOS_ERROR: {
						err,
						message: err.message,
					},
				});
				return res.status(err.status || 500).json({
					status: err.status || 500,
					data: err.data || [],
					message: err.message || "Internal Server Error",
				});
			}
		}
	);
};
