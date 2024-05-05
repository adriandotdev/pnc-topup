const TopupRepository = require("../repository/TopupRepository");
const { v4: uuidv4 } = require("uuid");
const {
	HttpBadRequest,
	HttpInternalServerError,
} = require("../utils/HttpError");
const axios = require("axios");
const logger = require("../config/winston");

module.exports = class TopupService {
	#repository;

	constructor() {
		this.#repository = new TopupRepository();
	}

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
					Authorization:
						"Basic " + process.env.AUTHMODULE_AUTHORIZATION,
					"Content-Type": "application/json",
				},
			}
		);

		return { status: result.status, data: result.data };
	}

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

	async #RequestToMayaSourceURL({
		auth_token,
		user_id,
		description,
		amount,
	}) {
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

	async Topup({ user_id, topup_type, amount }) {
		function cleanAmountForTopup(amount) {
			const numberStr = amount.toString();

			let cleanedNumber = null;

			if (numberStr.includes(".")) {
				const cleanedStr = numberStr.replace(".", "");
				cleanedNumber = parseFloat(cleanedStr);
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

		if (authmoduleData.status >= 400 && authmoduleData.status < 500) {
			logger.info({
				AUTHMODULE_API_ERROR: {
					message: "Bad Request",
					status: authmoduleData.status,
				},
			});

			throw new HttpBadRequest("BAD_REQUEST", []);
		} else if (
			authmoduleData.status >= 500 &&
			authmoduleData.status < 600
		) {
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

				const checkout_url =
					result.data.attributes.redirect.checkout_url; // checkout_url, failed, success
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
					if (
						result.data.attributes.status === "awaiting_next_action"
					) {
						const topupResult = await this.#repository.TopupMaya({
							user_id,
							user_type: "USER_DRIVER",
							amount,
							type: "TOPUP",
							payment_type: "MAYA",
							transaction_id: result.data.id,
							client_key: result.data.attributes.client_key,
						});

						console.log(result);

						if (topupResult[0][0].STATUS === "SUCCESS")
							return {
								checkout_url:
									result.data.attributes.next_action.redirect
										.url,
							};
					}
				}

				return result;
			} catch (err) {
				throw new HttpInternalServerError("Internal Server Error", []);
			}
		}
	}

	// GCash Payment
	async GCashPayment({ user_type, token, topup_id, payment_token_valid }) {
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

		let details =
			user_type === "tenant" &&
			(await this.#repository.GetUserTopupDetails(topup_id));
		let status = token.substring(token.length - 1);
		let parsedToken = token.substring(0, token.length - 2);

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
				topup_id,
			});

			logger.info({
				TOPUP_FAILED_EXIT: {
					message: "SUCCESS",
				},
			});
			return "FAILED";
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
				console.log(
					details[0].amount,
					cleanAmountForTopup(String(details[0].amount))
				);

				const result = await this.#RequestToGCashPaymentURL({
					amount: cleanAmountForTopup(String(details[0].amount)),
					description,
					id: details[0].transaction_id,
					token: parsedToken,
				});

				if (user_type === "tenant") {
					const paymentUpdateResult =
						await this.#repository.UpdateTopup({
							status: result.data.attributes.status,
							transaction_id: details[0].transaction_id,
							description: description,
							topup_id,
						});

					const status = paymentUpdateResult[0][0].STATUS;
					const status_type = paymentUpdateResult[0][0].status_type;

					if (status_type === "bad_request")
						throw new HttpBadRequest(status, []);
				}

				if (result.data.attributes.status === "paid") return "SUCCESS";
			}
		}

		return "FAILED";
	}

	async MayaPayment({
		user_type,
		token,
		user_id,
		topup_id,
		transaction_id,
		payment_token_valid,
	}) {
		if (payment_token_valid) {
			let details =
				user_type === "tenant" &&
				(await this.#repository.GetMayaTopupDetails(transaction_id));

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

				if (user_type === "tenant") {
					console.log("UPDATING MAYA TOPUP", status);
					await this.#repository.UpdateMayaTopup({
						status,
						transaction_id,
						description_id: uuidv4(),
					});
				} else {
					// for guest
				}

				return status === "paid" ? "SUCCESS" : "FAILED";
			}

			if (currentTopupStatus === "paid") return "ALREADY_PAID";

			return "FAILED";
		}
	}
};
