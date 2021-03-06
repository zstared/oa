import ApiError from '../../lib/api_error';
import {
	RCode
} from '../../lib/enum';
import m_user from '../../model/core/user';
import m_file from '../../model/core/file';
import m_role from '../../model/core/role';
import m_resource from '../../model/core/resource';
import {
	md5,
	randomString
} from '../../lib/utils';
import config from '../../config';
import {
	isNull
} from '../../lib/utils';
import {
	Op
} from 'sequelize';

class UserService {
	constructor() {}

	/**获取用户菜单*/
	async getMenus(id) {
		let role_list = await m_user.getRoleByUserId(id);
		let role_ids = role_list.map(item => item.id);
		return await m_resource.getMenuList(role_ids, id);
		// return  [{
		// 		id: 1,
		// 		icon: 'cogs',
		// 		name: '系统管理',
		// 		path: '/system',
		// 		locale: 'system',
		// 		children: [{
		// 			id: 2,
		// 			name: '用户管理',
		// 			locale: 'system.user',
		// 			path: '/system/user',
		// 			permission: ['']
		// 		},
		// 		{
		// 			id: 3,
		// 			name: '角色管理',
		// 			locale: 'system.role',
		// 			path: '/system/role'
		// 		},
		// 		{
		// 			id: 4,
		// 			name: '菜单管理',
		// 			locale: 'system.menu',
		// 			path: '/system/menu'
		// 		},
		// 		{
		// 			id: 5,
		// 			name: '资源管理',
		// 			locale: 'system.resource',
		// 			path: '/system/resource'
		// 		},
		// 		]
		// 	}];
	}

	/**
	 * 修改密码
	 * @param {Object} params 
	 */
	async updatePassword(params) {
		const {
			user_name,
			old_password,
			new_password
		} = params;
		let user = await m_user.getUserByName(user_name);
		if (!user) {
			throw new ApiError(RCode.core.C2000005, '用户名或旧密码有误');
		}
		user = await m_user.getUserByName(user_name, md5(old_password + user.encrypt));
		if (!user) {
			throw new ApiError(RCode.core.C2000005, '用户名或旧密码有误');
		}

		const encrypt = randomString(16); //密码加盐
		const password_strength = this._checkPwdStrength(new_password);
		let result = await m_user.updatePassword(user.id, md5(new_password + encrypt), encrypt, password_strength);
		if (result) {
			return {
				password_strength: password_strength
			};
		}
		return false;
	}

	/**
	 * 检测密码强度 1-弱；2-中；3-强
	 * @param {string} password 
	 */
	_checkPwdStrength(password) {
		const upper = /[A-Z]+/.test(password); //包含大写字母
		const number = /\d+/.test(password); //包含数值
		const length6 = /.{6}/.test(password); //长度不少于6
		const length8 = /.{8}/.test(password); //长度不少于8
		const special = /[^\w\s]+/.test(password); //饱含特殊字符

		if ((upper && number && length8 && special) || (upper && length8 && special)) {
			return 3;
		}
		if ((upper && number && length6 && special) || (upper && length6 && special) || (upper && length6 && number) || (upper && number && special) || length8) {
			return 2;
		}
		return 1;

	}

	/**
	 * 新增用户
	 * @param {Object} params 
	 */
	async create(params) {
		const {
			user_name,
			sex,
			mail,
			mobile,
			name_en,
			name_cn,
			password,
			role,
		} = params;
		let user = await m_user.getUserByName(user_name);
		if (user) {
			throw new ApiError(RCode.core.C2000000, '用户名已存在');
		}
		user = await m_user.getUserByMobile(mobile);
		if (user) {
			throw new ApiError(RCode.core.C2000006, '手机号码已存在');
		}
		user = {
			user_name,
			sex,
			mail,
			mobile,
			name_en,
			name_cn,
			password,
			role,
		};
		user.encrypt = randomString(16);
		user.password = md5((user.password ? user.password : config.core.default_password) + user.encrypt);
		user.password_strength = this._checkPwdStrength(user.password);
		let result = await m_user.create(user);
		return result;
	}

	/**
	 * 修改用户
	 * @param {*} params 
	 */
	async update(params) {
		const {
			id,
			sex,
			mail,
			mobile,
			name_en,
			name_cn,
			password,
			role,
			avatar
		} = params;
		let user = {
			id,
			name_cn,
			name_en,
			avatar
		};
		const user_exist = await m_user.getDetailsById(id);
		if (!user_exist) {
			throw new ApiError(RCode.common.C1, '用户不存在');
		}
		let user_mobile = await m_user.getUserByMobile(mobile, id);
		if (user_mobile) {
			throw new ApiError(RCode.core.C2000006, '手机号码已存在');
		}
		if (sex != null) {
			user.sex = sex;
		}
		if (mail) {
			user.mail = mail;
		}
		if (mobile) {
			user.mobile = mobile;
		}
		if (role) {
			user.role = role;
		}
		if (password) {
			user.encrypt = randomString(16);
			user.password = md5((user.password ? user.password : config.core.default_password) + user.encrypt);
			user.password_strength = this._checkPwdStrength(user.password);
		}

		let result = await m_user.update(user, role ? true : false); //用户自己不能修改角色

		//更新文件关联
		if (result) {
			if (user_exist.avatar != user.avatar) {
				if (user_exist.avatar) {
					m_file.updateFileByCode(user_exist.avatar, null, null);
				}
				m_file.updateFileByCode(user.avatar, user.id, 'cs_user');
			}
		}

		return result;
	}

	/**
	 * 更新用户状态
	 * @param {*} params 
	 */
	async updateState(params) {
		const {
			id,
			status,
		} = params;
		let user = {
			id,
			status
		};
		let result = await m_user.update(user, false);
		return result;
	}

	/**
	 * 删除用户
	 * @param {*} params 
	 */
	async delete(params) {
		const {
			id
		} = params;
		let result = await m_user.delete(id);
		return result;
	}

	/**
	 * 根据ID获取用户详情信息
	 * @param {*} params 
	 */
	async details(params) {
		const {
			id
		} = params;
		let user_info = await m_user.getDetailsById(id, ['id', 'user_name', 'name_cn', 'name_en', 'avatar', 'sex', 'mail', 'mobile', 'status', 'password_strength']);
		if (user_info&&user_info.avatar) {
			let avatar_file = await m_file.getFileByCode(user_info.avatar);
			user_info.dataValues.avatar_file = avatar_file;
		}

		return user_info;
	}

	/**
	 * 获取用户列表
	 * @param {*} params 
	 */
	async getList(params) {
		const {
			user_name,
			mobile,
			status,
			sorter
		} = params;
		let where = {is_system:0};
		if (!isNull(user_name)) {
			where.user_name = {
				[Op.like]: user_name + '%'
			};
		}
		if (!isNull(mobile)) {
			where.mobile = {
				[Op.like]: mobile + '%'
			};
		}
		if (!isNull(status)) {
			where.status = status;
		}
		let order = [
			['create_time', 'desc']
		]; //排序
		if (sorter) {
			order.unshift(sorter.split('|'));
		}
		let attr = ['id', 'user_name', 'name_cn', 'name_en', 'avatar', 'sex', 'mail', 'mobile', 'status', 'password_strength', 'create_time', 'is_system'];
		return await m_user.getList(attr, where, order);
	}

	/**
	 * 获取用户分页列表
	 * @param {*} _params 
	 */
	async getPageList(_params) {
		let {
			page_index,
			page_size,
			user_name,
			mobile,
			status,
			sorter,
		} = _params;

		let attrs = ' id,user_name,name_cn,name_en,avatar,sex,mail,mobile,status,password_strength,create_time,is_system ';
		let table = ' cs_user ';
		let where = ' where is_system=0 ';
		if (!isNull(user_name)) {
			user_name = user_name + '%';
			where += ' and (user_name like  :user_name or name_cn like :user_name or name_en like :user_name) ';
		}
		if (!isNull(mobile)) {
			mobile = mobile + '%';
			where += ' and mobile like  :mobile ';
		}
		if (!isNull(status)) {
			where += ' and status=:status ';
		}
		let order = ' order by  is_system desc,create_time desc';
		if (!isNull(sorter)) {
			order = `order by ${sorter.split('|').join(' ')} `;
		}

		let params = {
			page_index,
			page_size,
			user_name,
			mobile,
			status
		};
		let pageList = await m_user.getPageList(params, attrs, table, where, order);
		if (pageList.count) {
			for (let item of pageList.rows) {
				item.role = await m_user.getRoleByUserId(item.id);
			}
		}
		return pageList;
	}

	/**
	 * 关联角色
	 * @param {*} params 
	 */
	async relateRole(params) {
		const {
			id,
			role
		} = params;
		return await m_user.relateRole(id, role);
	}

	/**
	 * 关联资源（菜单、权限、接口)
	 * @param {*} resource_user
	 */
	async relateResource(resource_user) {
		const {
			id,
			resource_list
		} = resource_user;
		let list = [];
		for (let resource_id of resource_list) {
			list.push({
				user_id: id,
				resource_id: resource_id
			});
		}
		return await m_user.relateResource(id, list);
	}

	/**
	 * 判断账号是否存在 
	 * @param {string} user_name 
	 */
	async existAccount(user_name) {
		let user = await m_user.getUserByName(user_name);
		if (user) {
			return {
				exist: true
			};
		}
		return {
			exist: false
		};
	}

	/**
	 * 判断手机号是否存在 
	 * @param {string} mobile 
	 */
	async existMobile(mobile, id) {
		let user = await m_user.getUserByMobile(mobile, id);
		if (user) {
			return {
				exist: true
			};
		}
		return {
			exist: false
		};
	}

	/**
	 * 获取权限
	 * @param {number} id
	 */
	async getPermission(id) {
		let role_list = await m_user.getRoleByUserId(id);
		let role_ids = role_list.map(item => item.id);

		let user_per = await m_user.getPermissionByUserId(id);
		let role_per = await m_role.getPermissionByRoleIds(role_ids);
		return {
			user: user_per && user_per.length > 0?user_per.map(item => item.resource_id): [],
			role: role_per && role_per.length > 0?role_per.map(item => item.resource_id): [],
		};
	}
}
export default new UserService();