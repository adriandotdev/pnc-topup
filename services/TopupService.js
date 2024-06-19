const TopupRepository = require("../repository/TopupRepository");
const { v4: uuidv4 } = require("uuid");
const {
	HttpBadRequest,
	HttpInternalServerError,
	HttpNotFound,
} = require("../utils/HttpError");
const axios = require("axios");
const logger = require("../config/winston");

module.exports = class TopupService {
	#repository;

	constructor() {
		this.#repository = new TopupRepository();
	}

	/**
	 * Requests authorization from the authentication module.
	 *
	 * This method sends a POST request to the authentication module's URL to obtain authorization.
	 *
	 * @returns {Promise<Object>} A promise that resolves to an object containing the status and data of the request.
	 * @throws {Error} Throws an error if there is any issue with the request.
	 */
	async #RequestAuthmodule() {
		logger.info({
			method: "RequestAuthmodule",
			class: "TopupService",
		});

		const result = await axios.post(
			process.env.AUTHMODULE_URL,
			{
				grant_type: String(process.env.AUTHMODULE_GRANT_TYPE),
			},
			{
				headers: {
					Accept: "application/json",
					Authorization: "Basic " + process.env.AUTHMODULE_AUTHORIZATION,
					"Content-Type": "application/json",
				},
			}
		);

		return { status: result.status, data: result.data };
	}

	/**
	 * Requests to the GCash source URL.
	 *
	 * This method sends a POST request to the GCash source URL to initiate a top-up transaction.
	 *
	 * @param {Object} params - The parameters for the request.
	 * @param {string} params.auth_token - The authentication token.
	 * @param {string} params.user_id - The user ID.
	 * @param {number} params.amount - The amount to top up.
	 * @param {string} params.topup_id - The ID of the top-up transaction.
	 * @returns {Promise<Object>} A promise that resolves to an object containing the status and data of the request.
	 * @throws {Error} Throws an error if there is any issue with the request.
	 */
	async #RequestToGCashSourceURL({ auth_token, user_id, amount, topup_id }) {
		logger.info({
			data: {
				auth_token,
				user_id,
				amount,
				topup_id,
			},
			method: "RequestToGCashSourceURL",
			class: "TopupService",
		});

		const result = await axios.post(
			process.env.GCASH_SOURCE_URL,
			{
				user_id,
				amount,
				topup_id,
				user_type: "tenant",
				pnc_type: "pnc",
			},
			{
				headers: {
					Accept: "application/json",
					Authorization: "Bearer " + auth_token,
					"Content-Type": "application/json",
				},
			}
		);

		return { status: result.status, data: result.data.result.data };
	}

	/**
	 * Requests to the Maya source URL.
	 *
	 * This method sends a POST request to the Maya source URL to initiate a payment transaction.
	 *
	 * @param {Object} params - The parameters for the request.
	 * @param {string} params.auth_token - The authentication token.
	 * @param {string} params.user_id - The user ID.
	 * @param {string} params.description - The description of the transaction.
	 * @param {number} params.amount - The amount of the transaction.
	 * @returns {Promise<Object>} A promise that resolves to the data of the request.
	 * @throws {Error} Throws an error if there is any issue with the request.
	 */
	async #RequestToMayaSourceURL({ auth_token, user_id, description, amount }) {
		const result = await axios.post(
			process.env.MAYA_PAYMENT_URL,
			{
				user_id,
				type: "paymaya",
				description,
				amount,
				payment_method_allowed: "paymaya",
				statement_descriptor: "ParkNcharge",
				user_type: "tenant",
				pnc_type: "pnc",
			},
			{
				headers: {
					Accept: "application/json",
					Authorization: "Bearer " + auth_token,
					"Content-Type": "application/json",
				},
			}
		);

		return result.data;
	}

	/**
	 * Requests to the GCash payment URL.
	 *
	 * This method sends a POST request to the GCash payment URL to initiate a payment transaction.
	 *
	 * @param {Object} params - The parameters for the request.
	 * @param {number} params.amount - The amount of the transaction.
	 * @param {string} params.description - The description of the transaction.
	 * @param {string} params.id - The ID of the transaction.
	 * @param {string} params.token - The authentication token.
	 * @returns {Promise<Object>} A promise that resolves to the data of the request.
	 * @throws {Error} Throws an error if there is any issue with the request.
	 */
	async #RequestToGCashPaymentURL({ amount, description, id, token }) {
		const result = await axios.post(
			process.env.GCASH_PAYMENT_URL,
			{
				amount,
				description,
				currency: "PHP",
				statement_descriptor: "ParkNcharge",
				id,
				type: "source",
			},
			{
				headers: {
					Accept: "application/json",
					Authorization: "Bearer " + token,
					"Content-Type": "application/json",
				},
			}
		);

		return result.data;
	}

	/**
	 * Requests to the Maya payment URL.
	 *
	 * This method sends a POST request to the Maya payment URL to get the payment status of a transaction.
	 * If the status of the transaction is "processing", it recursively calls itself until the status changes.
	 *
	 * @param {Object} params - The parameters for the request.
	 * @param {string} params.token - The authentication token.
	 * @param {string} params.transaction_id - The ID of the transaction.
	 * @param {string} params.client_key - The client key.
	 * @returns {Promise<string>} A promise that resolves to the status of the transaction.
	 * @throws {Error} Throws an error if there is any issue with the request.
	 */
	async #RequestToMayaPaymentURL({ token, transaction_id, client_key }) {
		const result = await axios.post(
			process.env.MAYA_GET_PAYMENT_URL,
			{
				payment_intent: transaction_id,
				client_key,
			},
			{
				headers: {
					Accept: "application/json",
					Authorization: "Bearer " + token,
					"Content-Type": "application/json",
				},
			}
		);

		const status = result.data.data.attributes.status;

		if (status === "processing") {
			return await this.#RequestToMayaPaymentURL({
				token,
				transaction_id,
				client_key,
			});
		}

		return status;
	}

	/**
	 * Initiates a top-up transaction.
	 *
	 * This method performs a top-up transaction for a user with the specified amount and top-up type.
	 * It first cleans the amount for top-up and checks if the top-up type is valid.
	 * Then it requests authentication data from the authentication module.
	 * If the authentication request is successful, it verifies the amount and initiates the top-up process accordingly.
	 * For GCash top-ups, it calls the GCash source URL request function and updates the top-up status accordingly.
	 * For Maya top-ups, it calls the Maya source URL request function and initiates the top-up process based on the response.
	 *
	 * @param {Object} params - The parameters for the top-up transaction.
	 * @param {string} params.user_id - The ID of the user initiating the top-up.
	 * @param {string} params.topup_type - The type of top-up (gcash, maya, or card).
	 * @param {number} params.amount - The amount to be topped up.
	 * @returns {Promise<Object>} A promise that resolves to an object containing the checkout URL for initiating the top-up.
	 * @throws {HttpBadRequest | HttpInternalServerError} Throws an error if there is any issue with the request or if the top-up type or amount is invalid.
	 */
	async Topup({ user_id, topup_type, amount }) {
		function cleanAmountForTopup(amount) {
			const numberStr = amount.toString();

			let cleanedNumber = null;

			if (numberStr.includes(".")) {
				const cleanedStr = numberStr.replace(".", "");
				const numberAfterDecimal = numberStr.split(".")[1];

				if (numberAfterDecimal[0] === "0")
					cleanedNumber = parseFloat(cleanedStr);
				else
					cleanedNumber =
						parseFloat(cleanedStr) +
						(parseInt(numberAfterDecimal) <= 9 ? "0" : "");
			} else {
				cleanedNumber = parseInt((amount += "00"));
			}

			return cleanedNumber;
		}

		// Check if topup type is valid. Valid types are: gcash, maya, and card
		if (!["gcash", "maya", "card"].includes(topup_type))
			throw new HttpBadRequest("INVALID_TOPUP_TYPE", {
				message: "Valid types are: gcash, maya, and card",
			});

		const description = uuidv4();

		const modifiedAmountValueForPaymongo = cleanAmountForTopup(amount);

		const authmoduleData = await this.#RequestAuthmodule();

		console.log(modifiedAmountValueForPaymongo);
		if (authmoduleData.status >= 400 && authmoduleData.status < 500) {
			logger.info({
				AUTHMODULE_API_ERROR: {
					message: "Bad Request",
					status: authmoduleData.status,
				},
			});

			throw new HttpBadRequest("BAD_REQUEST", []);
		} else if (authmoduleData.status >= 500 && authmoduleData.status < 600) {
			logger.info({
				AUTHMODULE_API_ERROR: {
					message: "Internal Server Error",
					status: 500,
				},
			});

			throw new HttpInternalServerError("INTERNAL_SERVER_ERROR", []);
		}

		// Topup must be minimum of 100 pesos.
		if (amount < 100)
			throw new HttpBadRequest("INVALID_MINIMUM_AMOUNT", {
				message: "Amount must be greater than 100",
			});

		let result = null;

		// GCash Initial Topup
		if (topup_type === "gcash") {
			result = await this.#repository.Topup({
				user_id,
				user_type: "USER_DRIVER",
				amount,
				type: "TOPUP",
				payment_type: "GCASH",
			});

			const status = result[0][0].STATUS;
			const topup_id = result[0][0].topup_id;
			const topupResult = null;

			if (status === "SUCCESS") {
				logger.info({
					data: {
						auth_token: authmoduleData.data.access_token,
						user_id,
						amount,
						topup_id,
					},
					method: "Topup",
					class: "TopupService",
				});

				const result = await this.#RequestToGCashSourceURL({
					auth_token: authmoduleData.data.access_token,
					user_id,
					amount: modifiedAmountValueForPaymongo,
					topup_id,
				});

				const checkout_url = result.data.attributes.redirect.checkout_url; // checkout_url, failed, success
				const status = result.data.attributes.status;
				const transaction_id = result.data.id;

				await this.#repository.UpdateTopup({
					status,
					transaction_id,
					topup_id,
				});

				return { checkout_url };
			} else {
				throw new HttpInternalServerError(status, []);
			}
		}
		// Maya Initial Topup
		else if (topup_type === "maya") {
			logger.info({
				TOPUP: {
					type: topup_type,
					amount,
				},
			});

			try {
				const result = await this.#RequestToMayaSourceURL({
					auth_token: authmoduleData.data.access_token,
					user_id,
					description,
					amount: cleanAmountForTopup(String(amount)),
				});

				if (result) {
					if (result.data.attributes.status === "awaiting_next_action") {
						const topupResult = await this.#repository.TopupMaya({
							user_id,
							user_type: "USER_DRIVER",
							amount,
							type: "TOPUP",
							payment_type: "MAYA",
							transaction_id: result.data.id,
							client_key: result.data.attributes.client_key,
						});

						if (topupResult[0][0].STATUS === "SUCCESS")
							return {
								checkout_url: result.data.attributes.next_action.redirect.url,
							};
					}
				}

				return result;
			} catch (err) {
				throw new HttpInternalServerError("Internal Server Error", []);
			}
		}
	}

	/**
	 * Initiates a GCash payment for a top-up transaction.
	 *
	 * This method performs a GCash payment for a specific top-up transaction using the provided token.
	 * It first cleans the amount for top-up and retrieves details of the top-up transaction.
	 * Then it validates the payment token and updates the top-up status accordingly.
	 *
	 * @param {Object} params - The parameters for the GCash payment.
	 * @param {string} params.token - The token for the GCash payment.
	 * @param {string} params.topup_id - The ID of the top-up transaction.
	 * @param {boolean} params.payment_token_valid - Indicates whether the payment token is valid.
	 * @returns {Promise<Object>} A promise that resolves to an object containing the status of the top-up transaction.
	 * @throws {HttpBadRequest} Throws an error if the top-up ID is not found, if the top-up has already been paid or failed,
	 * or if there is an issue with the payment request.
	 */
	async GCashPayment({ token, topup_id, payment_token_valid }) {
		logger.info({
			PAYMENT_METHOD: {
				class: "TopupService",
				method: "GCashPayment",
			},
		});

		function cleanAmountForTopup(amount) {
			amount = amount.replace(" ", "");
			amount = amount.replace(".", "");
			amount = amount.replace(",", "");
			amount = amount.replace(/ /g, "");
			amount = amount.replace(/[^A-Za-z0-9\-]/, "");
			return amount;
		}

		let details = await this.#repository.GetUserTopupDetails(topup_id);
		let status = token.substring(token.length - 1);
		let parsedToken = token.substring(0, token.length - 2);

		if (details.length === 0)
			throw new HttpBadRequest("TOPUP_ID_NOT_FOUND", []);

		if (details[0]?.payment_status === "paid")
			throw new HttpBadRequest("ALREADY_PAID", []);

		if (details[0]?.payment_status === "failed")
			throw new HttpBadRequest("ALREADY_FAILED", []);

		if (status === "0") {
			logger.info({
				TOPUP_FAILED: {
					status,
					class: "TopupService",
				},
			});

			await this.#repository.UpdateTopup({
				status: "failed",
				transaction_id: details[0].transaction_id,
				topup_id,
			});

			logger.info({
				TOPUP_FAILED_EXIT: {
					message: "SUCCESS",
				},
			});
			return {
				topup_status: "FAILED",
				transaction_id: details[0].transaction_id,
			};
		}

		// If payment is valid
		if (payment_token_valid) {
			if (details.length === 0)
				throw new HttpBadRequest("TOPUP_ID_NOT_FOUND", []);

			if (details[0]?.payment_status === "paid")
				throw new HttpBadRequest("ALREADY_PAID", []);
			else if (details[0]?.payment_status === "failed")
				throw new HttpBadRequest("ALREADY_FAILED", []);
			else {
				const description = uuidv4();

				logger.info({
					data: {
						amount: cleanAmountForTopup(String(details[0].amount)),
						description,
						id: details[0].transaction_id,
						token: parsedToken,
					},
				});

				const result = await this.#RequestToGCashPaymentURL({
					amount: cleanAmountForTopup(String(details[0].amount)),
					description,
					id: details[0].transaction_id,
					token: parsedToken,
				});

				const paymentUpdateResult = await this.#repository.UpdateTopup({
					status: result.data.attributes.status,
					transaction_id: details[0].transaction_id,
					description: description,
					topup_id,
				});

				const status = paymentUpdateResult[0][0].STATUS;
				const status_type = paymentUpdateResult[0][0].status_type;

				if (status_type === "bad_request") throw new HttpBadRequest(status, []);

				if (result.data.attributes.status === "paid")
					return {
						topup_status: "PAID",
						transaction_id: details[0].transaction_id,
					};
			}
		}

		return {
			topup_status: "FAILED",
			transaction_id: details[0].transaction_id,
		};
	}

	/**
	 * Initiates a Maya payment for a top-up transaction.
	 *
	 * This method performs a Maya payment for a specific top-up transaction using the provided token and transaction ID.
	 * It first checks the validity of the payment token and retrieves details of the top-up transaction.
	 * Then it updates the top-up status based on the Maya payment result.
	 *
	 * @param {Object} params - The parameters for the Maya payment.
	 * @param {string} params.token - The token for the Maya payment.
	 * @param {string} params.transaction_id - The ID of the top-up transaction.
	 * @param {boolean} params.payment_token_valid - Indicates whether the payment token is valid.
	 * @returns {Promise<Object>} A promise that resolves to an object containing the status of the top-up transaction.
	 * @throws {HttpBadRequest} Throws an error if the transaction ID is not found, if the top-up has already been paid or failed,
	 * or if there is an issue with the Maya payment request.
	 */
	async MayaPayment({ token, transaction_id, payment_token_valid }) {
		if (payment_token_valid) {
			let details = await this.#repository.GetMayaTopupDetails(transaction_id);

			if (details.length === 0)
				throw new HttpBadRequest("TRANSACTION_ID_NOT_FOUND", []);

			const currentTopupStatus = details[0].payment_status;

			if (currentTopupStatus === "paid")
				throw new HttpBadRequest("ALREADY_PAID");
			else if (currentTopupStatus === "failed")
				throw new HttpBadRequest("ALREADY_FAILED");
			else {
				const result = await this.#RequestToMayaPaymentURL({
					token,
					transaction_id,
					client_key: details[0].client_key,
				});

				let status =
					result === "succeeded"
						? "paid"
						: result === "awaiting_payment_method" && "failed";

				await this.#repository.UpdateMayaTopup({
					status,
					transaction_id,
					description_id: uuidv4(),
				});

				return status === "paid"
					? { topup_status: "PAID", transaction_id }
					: { topup_status: "FAILED", transaction_id };
			}
		}
	}

	/**
	 * Verifies a payment transaction.
	 *
	 * This method verifies a payment transaction based on the provided transaction ID.
	 * It retrieves the payment details from the repository and returns the result.
	 *
	 * @param {string} transactionID - The ID of the payment transaction to verify.
	 * @returns {Promise<Object>} A promise that resolves to an object containing the details of the payment transaction.
	 * @throws {HttpNotFound} Throws an error if the transaction ID is not found.
	 */
	async VerifyPayment(transactionID) {
		try {
			const result = await this.#repository.VerifyPayment(transactionID);

			if (result.length === 0)
				throw new HttpNotFound("TRANSACTION_ID_NOT_FOUND", []);

			return result[0];
		} catch (err) {
			throw err;
		}
	}

	/**
	 * Retrieves transactions associated with an RFID card tag.
	 *
	 * This method retrieves transactions associated with the provided RFID card tag.
	 * It accepts optional parameters for limit and offset to paginate the results.
	 *
	 * @param {string} rfidCardTag - The RFID card tag for which transactions are to be retrieved.
	 * @param {number} [limit=10] - The maximum number of transactions to retrieve (default: 10).
	 * @param {number} [offset=0] - The offset for pagination (default: 0).
	 * @returns {Promise<Array>} A promise that resolves to an array containing the transactions.
	 * @throws {HttpBadRequest} Throws an error if limit or offset are not positive whole numbers.
	 */
	async GetTransactions(rfidCardTag, limit, offset) {
		try {
			if (typeof limit !== "number" || typeof offset !== "number")
				throw new HttpBadRequest("LIMIT_AND_OFFSET_MUST_BE_TYPE_OF_NUMBER", []);

			if (limit < 0 || offset < 0)
				throw new HttpBadRequest(
					"LIMIT_AND_OFFSET_MUST_BE_POSITIVE_NUMBER",
					[]
				);

			if (limit !== parseInt(limit) || offset !== parseInt(offset))
				throw new HttpBadRequest("LIMIT_AND_OFFSET_MUST_BE_A_WHOLE_NUMBER", []);

			const result = await this.#repository.GetTransactions(
				rfidCardTag,
				parseInt(limit) || 10,
				parseInt(offset) || 0
			);

			return result;
		} catch (err) {
			throw err;
		}
	}
};
