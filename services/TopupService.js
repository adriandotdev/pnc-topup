const TopupRepository = require("../repository/TopupRepository");

module.exports = class TopupService {
	#repository;

	constructor() {
		this.#repository = new TopupRepository();
	}
};
