const mysql = require("../database/mysql");

module.exports = class TopupRepository {
	/**
	 * Initiates a top-up transaction.
	 * @param {Object} data - An object containing the data for the top-up transaction.
	 * @param {string} data.user_id - The ID of the user initiating the top-up.
	 * @param {string} data.user_type - The type of user initiating the top-up.
	 * @param {number} data.amount - The amount to be topped up.
	 * @param {string} data.type - The type of top-up transaction.
	 * @param {string} data.payment_type - The payment type for the top-up.
	 * @returns {Promise<any>} A promise that resolves to the result of the top-up transaction.
	 * @throws {Error} Throws an error if the top-up transaction fails.
	 */
	Topup(data) {
		const QUERY = `
            CALL WEB_USER_TOPUP(?,?,?,?,?)
        `;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[
					data.user_id,
					data.user_type,
					data.amount,
					data.type,
					data.payment_type,
				],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * Initiates a Maya top-up transaction.
	 * @param {Object} data - An object containing the data for the Maya top-up transaction.
	 * @param {string} data.user_id - The ID of the user initiating the top-up.
	 * @param {string} data.user_type - The type of user initiating the top-up.
	 * @param {number} data.amount - The amount to be topped up.
	 * @param {string} data.type - The type of top-up transaction.
	 * @param {string} data.payment_type - The payment type for the top-up.
	 * @param {string} data.transaction_id - The ID of the transaction.
	 * @param {string} data.client_key - The client key for the Maya transaction.
	 * @returns {Promise<any>} A promise that resolves to the result of the Maya top-up transaction.
	 * @throws {Error} Throws an error if the Maya top-up transaction fails.
	 */
	TopupMaya(data) {
		const QUERY = `CALL WEB_USER_TOPUP_MAYA(?,?,?,?,?,?,?)`;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[
					data.user_id,
					data.user_type,
					data.amount,
					data.type,
					data.payment_type,
					data.transaction_id,
					data.client_key,
				],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * Updates the status of a GCash payment top-up transaction.
	 * @param {Object} data - An object containing the data for updating the GCash payment top-up.
	 * @param {string} data.status - The status to be updated for the transaction.
	 * @param {string} data.transaction_id - The ID of the transaction to be updated.
	 * @param {string} data.description - The description of the transaction.
	 * @param {string} data.topup_id - The ID of the top-up transaction.
	 * @returns {Promise<any>} A promise that resolves to the result of updating the GCash payment top-up.
	 * @throws {Error} Throws an error if the update operation fails.
	 */
	UpdateTopup(data) {
		const QUERY = `
           CALL WEB_USER_UPDATE_GCASH_PAYMENT_TOPUP(?,?,?,?)
        `;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[data.status, data.transaction_id, data.description, data.topup_id],
				(err, result) => {
					if (err) {
						console.log(err);
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * Retrieves details of a user's top-up transaction.
	 * @param {string} topupID - The ID of the top-up transaction to retrieve details for.
	 * @returns {Promise<Array<Object>>} A promise that resolves to an array containing details of the user's top-up transaction.
	 * @throws {Error} Throws an error if the retrieval operation fails.
	 */
	GetUserTopupDetails(topupID) {
		const QUERY = `
            SELECT
                amount, transaction_id, payment_status, transaction_id
            FROM 
                topup_logs
            WHERE id = ?
        `;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [topupID], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	/**
	 * Retrieves details of a Maya top-up transaction.
	 * @param {string} transactionID - The ID of the Maya top-up transaction to retrieve details for.
	 * @returns {Promise<Array<Object>>} A promise that resolves to an array containing details of the Maya top-up transaction.
	 * @throws {Error} Throws an error if the retrieval operation fails.
	 */
	GetMayaTopupDetails(transactionID) {
		const QUERY = `
			SELECT
				amount, client_key, payment_status 
			FROM topup_logs
			WHERE transaction_id = ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [transactionID], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	/**
	 * Updates the status of a Maya top-up transaction.
	 * @param {Object} data - An object containing data for updating the Maya top-up transaction.
	 * @param {string} data.status - The status to update for the Maya top-up transaction.
	 * @param {string} data.transaction_id - The ID of the Maya top-up transaction to update.
	 * @param {string} data.description_id - The description ID associated with the Maya top-up transaction.
	 * @returns {Promise<any>} A promise that resolves with the result of the update operation.
	 * @throws {Error} Throws an error if the update operation fails.
	 */
	UpdateMayaTopup({ status, transaction_id, description_id }) {
		const QUERY = `CALL WEB_USER_UPDATE_MAYA_PAYMENT_TOPUP(?,?,?)`;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[status, transaction_id, description_id],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	/**
	 * Retrieves the payment status and transaction ID for a given transaction ID.
	 * @param {string} transactionID - The ID of the transaction to verify.
	 * @returns {Promise<any>} A promise that resolves with the payment status and transaction ID.
	 * @throws {Error} Throws an error if the retrieval operation fails.
	 */
	VerifyPayment(transactionID) {
		const QUERY = `
			SELECT payment_status AS topup_status, transaction_id FROM topup_logs WHERE transaction_id = ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [transactionID], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	/**
	 * Retrieves transaction records associated with a specific RFID card tag.
	 * @param {string} rfidCardTag - The RFID card tag to retrieve transactions for.
	 * @param {number} limit - The maximum number of transactions to retrieve.
	 * @param {number} offset - The offset for pagination.
	 * @returns {Promise<Array>} A promise that resolves with an array of transaction records.
	 * @throws {Error} Throws an error if the retrieval operation fails.
	 */
	GetTransactions(rfidCardTag, limit, offset) {
		const QUERY = `
		SELECT * FROM (
			SELECT 
				'CHARGING' AS type,
				id, 
				rfid_card_tag, 
				charge_in_datetime, 
				initial_rfid_balance, 
				charge_out_datetime, 
				plug_out_datetime, 
				price, 
				current_rfid_balance, 
				'-' AS payment_type, 
				'-' AS payment_status, 
				date_created
			FROM evse_records
				UNION ALL
			SELECT 
				type,
				id, 
				rfid_card_tag, 
				'-' AS charge_in_datetime, 
				initial_rfid_balance, 
				'-' AS charge_out_datetime, 
				'-' AS plug_out_datetime, 
				amount, 
				current_rfid_balance,  
				payment_type, 
				payment_status, 
				date_created
			FROM topup_logs
			WHERE payment_status IN ('paid', 'expired')
			) AS transactions
		WHERE rfid_card_tag = ?
		ORDER BY date_created DESC
		LIMIT ? OFFSET ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [rfidCardTag, limit, offset], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}
};
