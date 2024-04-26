const TokenMiddleware = require("../middlewares/TokenMiddleware"); // Remove this if unused
const { validationResult, body } = require("express-validator");

const logger = require("../config/winston");
const TokenMiddleware = require("../middlewares/TokenMiddleware");

// Import your SERVICE HERE
// Import MISC HERE

/**
 * @param {import('express').Express} app
 */
module.exports = (app) => {
	const tokenMiddleware = new TokenMiddleware();
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
		"/topup/payments/topup",
		[tokenMiddleware.AccessTokenVerifier()],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res) => {
			try {
				const { topup_type, amount } = req.body;

				logger.info({
					TOPUP_API_REQUEST: {
						data: {
							user_id: req.id,
							topup_type,
							amount,
						},
						message: "SUCCESS",
					},
				});

				/** Your logic here */
				logger.info({
					TOPUP_API_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: [], message: "Success" });
			} catch (err) {
				logger.error({
					TOPUP_API_ERROR: {
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
