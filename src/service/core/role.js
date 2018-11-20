import ApiError from '../../lib/api_error';
import {
	ErrorCode
} from '../../lib/enum';
import m_role from '../../model/core/role';
import {
	isNull
} from '../../lib/utils';
import {
	Op
} from 'sequelize';
class RoleService {
	constructor() {}

	/**
     * 创建角色
     * @param {*} params 
     */
	async create(params) {
		const {
			role_name,
			role_desc,
			sort_no
		} = params;
		let is_exist = await m_role.isExist(role_name);
		if (is_exist) {
			throw new ApiError(ErrorCode.VerifyFail, '角色名称已存在');
		}
		let role = {
			role_name,
			role_desc,
			sort_no
		};
		return m_role.create(role);
	}

	/**
     * 修改用户
     * @param {*} params 
     */
	async update(params) {
		const {
			role_id,
			role_name,
			role_desc,
			sort_no
		} = params;
		let is_exist = await m_role.isExist(role_name, role_id);
		if (is_exist) {
			throw new ApiError(ErrorCode.VerifyFail, '角色名称已存在');
		}
		let role = {
			role_id: role_id,
			role_name: role_name,
			role_desc: role_desc,
			sort_no: sort_no
		};
		const role_exist = await m_role.getRoleById(role_id);
		if (!role_exist) {
			throw new ApiError(ErrorCode.ParamError, '角色ID不存在');
		}
		let result = await m_role.update(role);
		return result[0];
	}

	/**
     * 删除角色
     * @param {*} params 
     */
	async delete(params) {
		const {
			role_id
		} = params;
		let result = await m_role.delete(role_id);
		return result;
	}

	/**
     * 根据ID获取角色详情信息
     * @param {*} params 
     */
	async details(params) {
		const {
			role_id
		} = params;
		return await m_role.getRoleById(role_id, ['role_id', 'role_name', 'role_desc']);
	}

	/**
     * 获取角色列表
     * @param {*} params 
     */
	async getList(params) {
		const {
			role_name,
			orderBy
		} = params;
		let where = {};
		if (!isNull(role_name)) {
			where.role_name = {
				[Op.like]: role_name + '%'
			};
		}
		let order = [
			['is_system', 'desc'],
			['create_time']
		]; //排序
		if (orderBy) {
			order.unshift(orderBy.split('|'));
		}
		let attr = ['role_id', 'role_name', 'role_desc', 'create_time'];
		return await m_role.getList(attr, where, order);
	}

}

export default new RoleService();