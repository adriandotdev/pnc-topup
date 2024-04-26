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

	UpdateTopup(data) {
		const QUERY = `
            UPDATE topup_logs
            SET 
                payment_status = ?,
                transaction_id = ?,
                date_modified = NOW()
            WHERE id = ?
        `;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[data.status, data.transaction_id, data.topup_id],
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
			});
		});
	}
};
