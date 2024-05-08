const mysql = require("../database/mysql");

module.exports = class TopupRepository {
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

	GetTransactions(userID, limit, offset) {
		const QUERY = `
			SELECT 
				id AS topup_id,
				initial_rfid_balance,
				amount,
				current_rfid_balance,
				type,
				payment_type,
				payment_status,
				transaction_id,
				date_created
			FROM topup_logs
			WHERE user_id = ?
			ORDER BY date_created DESC
			LIMIT ? OFFSET ?
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [userID, limit, offset], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}
};
