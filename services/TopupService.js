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

	/**
     * global.token = function(){
        return new Promise((resolve,reject)=>{
            //fetch api authmodule, for marv's api auth
            let url = config.authmodule.url;
            let options = {
            method: 'POST',
            headers: {
                'Accept':'application/json',
                'Authorization':config.authmodule.authorization,
                'Content-Type':'application/json'
            },
                body: JSON.stringify({grant_type: config.authmodule.grantType})
            };

            winston.info({GET_AUTHMODULE_REQUEST:options});
            fetch(url, options)
            .then(res => res.json())
            .then((result)=>{
                winston.info({GET_AUTHMODULE_RESPONSE:result});
                resolve(result);
            })
            .catch((err)=>{
                reject(err);
            });     
        });
    }
     */
	async #RequestAuthmodule() {
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

	async #RequestToGCashSourceURL({ auth_token, user_id, amount, topup_id }) {
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

	async Topup({ user_id, topup_type, amount }) {
		function cleanAmountForTopup(amount) {
			amount = amount.replace(" ", "");
			amount = amount.replace(".", "");
			amount = amount.replace(",", "");
			amount = amount.replace(/ /g, "");
			amount = amount.replace(/[^A-Za-z0-9\-]/, "");
			amount = amount + "00";
			return amount;
		}

		// Check if topup type is valid. Valid types are: gcash, maya, and card
		if (!["gcash", "maya", "card"].includes(topup_type))
			throw new HttpBadRequest("INVALID_TOPUP_TYPE", {
				message: "Valid types are: gcash, maya, and card",
			});

		const description_id = uuidv4();
		const modifiedAmountValueForPaymongo = parseInt(
			cleanAmountForTopup(String(amount))
		);

		const authmoduleData = await this.#RequestAuthmodule();

		if (authmoduleData.status >= 400 && authmoduleData.status < 500) {
			logger.info({
				AUTHMODULE_API_ERROR: {
					message: "Bad Request",
					status: 400,
				},
			});

			return "BAD_REQUEST";
		} else if (authmoduleData.status >= 500 && authmoduleData.status < 600) {
			logger.info({
				AUTHMODULE_API_ERROR: {
					message: "Internal Server Error",
					status: 500,
				},
			});

			return "INTERNAL_SERVER_ERROR";
		}

		if (amount < 100)
			throw new HttpBadRequest("INVALID_MINIMUM_AMOUNT", {
				message: "Amount must be greater than 100",
			});

		const result = await this.#repository.Topup({
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
				auth_token: authmoduleData.data.access_token,
				user_id,
				amount,
				topup_id,
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

			await this.#repository.UpdateTopup({ status, transaction_id, topup_id });

			return { status: 200, checkout_url };
		} else {
			throw new HttpInternalServerError(status, []);
		}
	}
};
