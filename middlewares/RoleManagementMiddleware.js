const logger = require("../config/winston");
const { HttpForbidden } = require("../utils/HttpError");

const ROLES = {
	ADMIN: "ADMIN",
	CPO_OWNER: "CPO_OWNER",
	USER_DRIVER: "USER_DRIVER",
	ADMIN_MARKETING: "ADMIN_MARKETING",
};

/**
 * @class RoleManagementMiddleware
 */
class RoleManagementMiddleware {
	CheckRole(...role) {
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 * @param {import('express').NextFunction} next
		 */
		return (req, res, next) => {
			logger.info({
				CHECK_ROLE_METHOD: {
					role: req.role,
					valid_roles: [...role],
				},
			});

			try {
				if (req.role && role.includes(req.role)) next();
				else {
					logger.error({
						CHECK_ROLE_METHOD_ERROR: {
							message: "FORBIDDEN",
						},
					});
					throw new HttpForbidden("Forbidden", []);
				}
			} catch (err) {
				next(err);
			}
		};
	}
}

module.exports = { RoleManagementMiddleware: RoleManagementMiddleware, ROLES };
