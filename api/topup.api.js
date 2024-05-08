const TokenMiddleware = require("../middlewares/TokenMiddleware"); // Remove this if unused
const { validationResult, body } = require("express-validator");

const logger = require("../config/winston");

// Import your SERVICE HERE
// Import MISC HERE

const TopupService = require("../services/TopupService");

/**
 * @param {import('express').Express} app
 */
module.exports = (app) => {
	const service = new TopupService();
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

	app.post(
		"/topup/api/v1/payments/topup",
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
				const result = await service.Topup({
					user_id: req.id,
					topup_type,
					amount,
				});

				logger.info({
					TOPUP_API_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
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

	app.get(
		"/topup/api/v1/payments/tenant/gcash/:token/:topup_id",
		[tokenMiddleware.AuthenticateGCashPaymentToken()],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res) => {
			try {
				const { token, topup_id } = req.params;

				logger.info({
					GCASH_PAYMENT_API_REQUEST: {
						data: {
							...req.params,
						},
						message: "SUCCESS",
					},
				});

				const result = await service.GCashPayment({
					token,
					topup_id,
					payment_token_valid: req.payment_token_valid,
				});

				logger.info({
					GCASH_PAYMENT_API_RESPONSE: {
						message: "SUCCESS",
					},
				});
				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				logger.error({
					GCASH_PAYMENT_API_ERROR: {
						err,
						message: err.message,
					},
				});
				console.log(err);
				return res.status(err.status || 500).json({
					status: err.status || 500,
					data: err.data || [],
					message: err.message || "Internal Server Error",
				});
			}
		}
	);

	app.get(
		"/topup/api/v1/payments/tenant/maya/:token/:transaction_id",
		[tokenMiddleware.AuthenticateMayaPaymentToken()],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res) => {
			try {
				const { token, transaction_id } = req.params;
				logger.info({
					MAYA_PAYMENT_API_REQUEST: {
						data: {
							...req.params,
						},
						message: "SUCCESS",
					},
				});

				const result = await service.MayaPayment({
					token,
					transaction_id,
					payment_token_valid: req.payment_token_valid,
				});

				logger.info({
					MAYA_PAYMENT_API_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				logger.error({
					MAYA_PAYMENT_API_ERROR: {
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

	app.get(
		"/topup/api/v1/payments/tenant/verify/:transaction_id",
		[],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res) => {
			try {
				const { transaction_id } = req.params;

				logger.info({
					PAYMENT_VERIFICATION_API_REQUEST: {
						data: {
							transaction_id,
						},
						message: "SUCESS",
					},
				});

				const result = await service.VerifyPayment(transaction_id);

				logger.info({
					PAYMENT_VERIFICATION_API_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "SUCCESS" });
			} catch (err) {
				logger.error({
					PAYMENT_VERIFICATION_API_ERROR: {
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
