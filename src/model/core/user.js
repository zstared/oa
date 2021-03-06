import sequelize from '../db_init';
import db_common from '../db_common';
const Op = sequelize.Sequelize.Op;
const t_user = require('../table/cs_user')(sequelize, sequelize.Sequelize);
const t_user_role = require('../table/cs_user_role')(sequelize, sequelize.Sequelize);
const t_resource_user = require('../table/cs_resource_user')(sequelize, sequelize.Sequelize);
class UserModel {
	constructor() {}


	/**
	 * 根据用户id获取用户
	 * @param {string} id 
	 * @param {string} password 
	 * @param {array}  attr
	 */
	async getDetailsById(id, attr = null) {
		let option = {};
		if (attr) {
			option.attributes = attr;
		}
		return await t_user.findByPk(id, option);
	}

	/**
	 * 根据用户名与密码获取用户
	 * @param {string} user_name 
	 * @param {string} password 
	 */
	async getUserByName(user_name, password = '') {
		let where = {
			user_name: user_name,
			status: {
				[Op.ne]: 2
			}
		};
		if (password) {
			where.password = password;
		}
		return await t_user.findOne({
			where: where
		});
	}

	/**
	 * 根据手机号码获取用户
	 * @param {string} mobile 
	 */
	async getUserByMobile(mobile, id = '') {
		let where = {
			mobile: mobile,
			status: {
				[Op.ne]: 2
			}
		};
		if (id) {
			where.id = {
				[Op.ne]: id
			};
		}
		return await t_user.findOne({
			where: where
		});
	}

	/**修改用户密码 */
	async updatePassword(id, password, encrypt, strength) {
		return await t_user.update({
			password: password,
			encrypt: encrypt,
			password_strength: strength
		}, {
			where: {
				id
			}
		});
	}

	/**
	 * 新增用户
	 * @param {object} user 
	 */
	async create(user) {
		const t = await db_common.transaction();
		try {
			//用户
			let user_new = await t_user.create(user, {
				transaction: t
			});
			let list_role = [];
			for (let role_id of user.role) {
				list_role.push({
					user_id: user_new.id,
					role_id: role_id
				});
			}
			//用户关联角色
			await t_user_role.bulkCreate(list_role, {
				transaction: t
			});
			await t.commit();
			return user_new;
		} catch (e) {
			await t.rollback();
			throw e;
		}
	}
	/**
	 * 修改用户
	 * @param {*} user 
	 * @param {Boolean} is_role 是否修改角色
	 */
	async update(user, is_role = true) {
		const t = await db_common.transaction();
		try {
			await t_user.update(user, {
				where: {
					id: user.id
				},
				transaction: t
			});
			if (is_role) {
				//1.删除之前关联的角色
				await t_user_role.destroy({
					where: {
						user_id: user.id
					}
				});
				let list_role = [];
				for (let role_id of user.role) {
					list_role.push({
						user_id: user.id,
						role_id: role_id
					});
				}
				//2.重新用户关联角色
				await t_user_role.bulkCreate(list_role, {
					transaction: t
				});
			}
			await t.commit();
			return true;
		} catch (e) {
			await t.rollback();
			throw e;
		}
	}

	/**
	 * 关联角色
	 * @param {*} user_id 
	 * @param {*} roles 
	 */
	async relateRole(user_id, roles) {
		const t = await db_common.transaction();
		try {
			//1.删除之前关联的角色
			await t_user_role.destroy({
				where: {
					user_id: user_id
				}
			});
			let list_role = [];
			for (let role_id of roles) {
				list_role.push({
					user_id: user_id,
					role_id: role_id
				});
			}
			//2.重新用户关联角色
			await t_user_role.bulkCreate(list_role, {
				transaction: t
			});
			await t.commit();
			return true;
		} catch (e) {
			await t.rollback();
			throw e;
		}
	}

	/**
	 * 逻辑删除用户(只能删除非内置账号)
	 * @param {*} id 
	 */
	async delete(id) {
		let result = await t_user.update({
			status: 2,
		}, {
			where: {
				id: id,
				is_system: 0
			}
		});
		return result[0];
	}

	/**
	 * 获取用户列表
	 * @param {array} attrs  查询字段
	 * @param {object} where  查询条件
	 * @param {array} order   排序
	 */
	async getList(attrs, where, order) {
		let option = {
			where: where
		};
		if (order) {
			option.order = order;
		}
		if (attrs) {
			option.attributes = attrs;
		}
		return await t_user.findAll(option);
	}

	/**
	 * @method 获取分页数据与总记录数
	 * @param {*} params 参数对象 包含pageInex,pageSize
	 * @param {*} attrs  查询字段 
	 * @param {*} table  查询表
	 * @param {*} where  查询条件
	 * @param {*} group  分组
	 * @param {*} order  排序
	 * @returns {object}
	 */
	async getPageList(params, attrs, table, where, order = '', group = '') {
		return db_common.excutePagingProc(params, attrs, table, where, group, order);
	}

	/**
	 * 关联资源（菜单、权限、接口)
	 * @param {*} user_id 
	 * @param {*} list 
	 */
	async relateResource(user_id, list) {
		let t = await db_common.transaction();
		try {
			await t_resource_user.destroy({
				where: {
					user_id: user_id
				}
			});
			await t_resource_user.bulkCreate(list);
			await t.commit();
			return true;
		} catch (e) {
			await t.rollback();
			throw e;
		}
	}

	/**
	 * 根据用户ID获取角色
	 * @param {*} user_id 
	 */
	async getRoleByUserId(user_id) {
		return await db_common.query('select b.id,b.role_name from cs_user_role a join cs_role b on a.role_id=b.id where user_id=:user_id', {
			user_id: user_id
		});
	}

	/**
	 * 获取用户权限
	 * @param {Number} id 
	 */
	async getPermissionByUserId(user_id, oauth = false) {
		if (!oauth) {
			return await t_resource_user.findAll({
				attributes: ['resource_id'],
				where: {
					user_id: user_id
				}
			});
		}else{
			//用于鉴权
			let permissions = await db_common.query('SELECT b.path from cs_resource_user a join cs_resource b on a.resource_id=b.parent_id  where user_id=:user_id and resource_type=4 ', {
				user_id: user_id
			});
			permissions = permissions.map(item => item.path);
			return permissions;
		}
	}

}

export default new UserModel();