import m_log from '../service/core/log';
import {
	getClientIp
} from '../lib/utils';


const whiteList = [
	'/core/user/login',
	'/core/user/register',
	'/core/user/updatePassword'
];

/**
 * 记录操作日志
 * @param {Koa.Context} ctx
 */
export default async (ctx, next) => {
	if (ctx.method === 'GET') {
		await next();
	} else {
		const url = ctx.url.split('/');
		let params = ctx.request.body || ctx.params;
		let log = {
			system: url[0],
			module: url[1],
			action: url[2],
			path: ctx.url,
			params: params,
			option_user: ctx.user_info ? JSON.parse(ctx.user_info).user_name : '',
			option_ip: getClientIp(ctx)
		};

		// 不保存涉及密码的参数
		if (whiteList.findIndex((item) => {
			return item === ctx.url;
		}) > -1) {
			log.params = null;
			log.option_user = params.user_name;
		}
		await next();
		if (ctx.body.code === 0) {
			log.state = 1;
		} else {
			log.state = 0;
			log.error_code = ctx.body.code;
		}
		log.message = ctx.body.message;
		log.description = ctx.body.desc;
		m_log.create(log);
	}


};