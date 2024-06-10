const TokenMiddleware = require("../middlewares/TokenMiddleware"); // Remove this if unused
const { validationResult, body, param } = require("express-validator");

const logger = require("../config/winston");

// Import your SERVICE HERE
// Import MISC HERE

const TopupService = require("../services/TopupService");

const { HttpUnprocessableEntity } = require("../utils/HttpError");

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
		[
			tokenMiddleware.AccessTokenVerifier(),
			body("topup_type")
				.notEmpty()
				.withMessage("Missing required property: topup_type")
				.custom((value) => ["maya", "gcash"].includes(value))
				.withMessage("Invalid topup: Valid values are: gcash, maya, and card"),
			body("amount")
				.notEmpty()
				.withMessage("Missing required property: amount")
				.custom((value) => typeof value === "number")
				.withMessage("Property amount must be in type of number"),
		],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				validate(req, res);

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
				req.error_name = "TOPUP_API_ERROR";
				next(err);
			}
		}
	);

	app.get(
		"/topup/api/v1/payments/tenant/gcash/:token/:topup_id",
		[
			tokenMiddleware.BasicTokenVerifier(),
			tokenMiddleware.AuthenticateGCashPaymentToken(),
			param("token").notEmpty().withMessage("Missing required property: token"),
			param("topup_id")
				.notEmpty()
				.withMessage("Missing required property: topup_id"),
		],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				validate(req, res);

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
				req.error_name = "GCASH_PAYMENT_API_ERROR";
				next(err);
			}
		}
	);

	app.get(
		"/topup/api/v1/payments/tenant/maya/:token/:transaction_id",
		[
			tokenMiddleware.BasicTokenVerifier(),
			tokenMiddleware.AuthenticateMayaPaymentToken(),
			param("token").notEmpty().withMessage("Missing required property: token"),
			param("transaction_id")
				.notEmpty()
				.withMessage("Missing required property: transaction_id"),
		],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
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
				req.error_name = "MAYA_PAYMENT_API_ERROR";
				next(err);
			}
		}
	);

	app.get(
		"/topup/api/v1/payments/tenant/verify/:transaction_id",
		[
			tokenMiddleware.BasicTokenVerifier(),
			param("transaction_id")
				.notEmpty()
				.withMessage("Missing required property: transaction_id"),
		],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
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
				req.error_name = "PAYMENT_VERIFICATION_API_ERROR";
				next(err);
			}
		}
	);

	app.get(
		"/topup/api/v1/transactions",
		[tokenMiddleware.AccessTokenVerifier()],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				const { limit, offset } = req.query;

				logger.info({
					TRANSACTIONS_API_REQUEST: {
						data: {
							rfid_card_tag: req.rfid_card_tag,
						},
						message: "SUCCESS",
					},
				});

				const result = await service.GetTransactions(
					req.rfid_card_tag,
					+limit,
					+offset
				);

				logger.info({
					TRANSACTIONS_API_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "TRANSACTIONS_API_ERROR";
				next(err);
			}
		}
	);

	app.use((err, req, res, next) => {
		logger.error({
			API_REQUEST_ERROR: {
				error_name: req.error_name || "UNKNOWN_ERROR",
				message: err.message,
				stack: err.stack.replace(/\\/g, "/"), // Include stack trace for debugging
				request: {
					method: req.method,
					url: req.url,
					code: err.status || 500,
				},
				data: err.data || [],
			},
		});

		const status = err.status || 500;
		const message = err.message || "Internal Server Error";

		res.status(status).json({
			status,
			data: err.data || [],
			message,
		});
	});
};
