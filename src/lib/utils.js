import crypto from 'crypto';
import uuidv1 from 'uuid/v1';
import uuidv4 from 'uuid/v4';
import pinyin from 'pinyin';
/**
 * 转换日期格式
 * @param {DATE} date
 * @param {Mixed} friendly 是否为友好格式 如：1分钟前
 * @return {string}
 */
export const formatDate = function(date, friendly) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();

    if (friendly) {
        var now = new Date();
        var mseconds = -(date.getTime() - now.getTime());
        var time_std = [1000, 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
        if (mseconds < time_std[3]) {
            if (mseconds > 0 && mseconds < time_std[1]) {
                return Math.floor(mseconds / time_std[0]).toString() + ' 秒前';
            }
            if (mseconds > time_std[1] && mseconds < time_std[2]) {
                return Math.floor(mseconds / time_std[1]).toString() + ' 分钟前';
            }
            if (mseconds > time_std[2]) {
                return Math.floor(mseconds / time_std[2]).toString() + ' 小时前';
            }
        }
    }

    hour = ((hour < 10) ? '0' : '') + hour;
    minute = ((minute < 10) ? '0' : '') + minute;
    second = ((second < 10) ? '0' : '') + second;

    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
};


/**
 * 是否为字符串
 *
 * @param {Mixed} str
 * @return {Boolean}
 */
export const isString = function(str) {
    return (typeof str === 'string');
};

/**
 * 是否为整数
 *
 * @param {Mixed} str
 * @return {Boolean}
 */
export const isInteger = function(str) {
    return (Math.round(str) === Number(str));
};

/**
 * 是否为null、undefined、空字符串
 * @param str
 * @return {Boolean}
 */
export const isNull = function(str) {
    if (str == undefined || str == null || str.toString().replace(/(^s*)|(s*$)/g, '').length == 0)
        return true;
    else
        return false;
};

/**
 * 是否为数字
 *
 * @param {Mixed} str
 * @return {Boolean}
 */
export const isNumber = function(str) {
    return (!isNaN(str));
};


/**
 * md5加密
 * @param text 要加密的串
 * @return  16进制加密穿2
 */
export const md5 = function(text) {
    return crypto.createHash('md5').update(text).digest('hex');
};


/**
 * 产生随机字符串
 *
 * @param size
 * @param chars
 * @return
 */
export const randomString = function(size, chars) {
    size = size || 6;
    var code_string = chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var max_num = code_string.length + 1;
    var new_pass = '';
    while (size > 0) {
        new_pass += code_string.charAt(Math.floor(Math.random() * max_num));
        size--;
    }
    return new_pass;
};


/**
 * 产生随机数字字符串
 *
 * @param size
 * @return
 */
export const randomNumber = function(size) {
    size = size || 6;
    var code_string = '0123456789';
    var max_num = code_string.length + 1;
    var new_pass = '';
    while (size > 0) {
        new_pass += code_string.charAt(Math.floor(Math.random() * max_num));
        size--;
    }
    return new_pass;
};


/**
 * 产生随机字母字符串
 *
 * @param size
 * @return
 */
export const randomLetter = function(size) {
    size = size || 6;
    var code_string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var max_num = code_string.length + 1;
    var new_pass = '';
    while (size > 0) {
        new_pass += code_string.charAt(Math.floor(Math.random() * max_num));
        size--;
    }
    return new_pass;
};


/**
 * 字典排序
 * @param dict 如:dict={a:1,b:2,c:3}
 */
export const sortDict = function(dict) {
    var dict2 = {},
        keys = Object.keys(dict).sort();

    for (var i = 0, n = keys.length, key; i < n; ++i) {
        key = keys[i];
        dict2[key] = dict[key];
    }

    return dict2;
};

/**
 * 获取客户端IP
 */
export const getClientIp = function(ctx) {
    let ip = ctx.ip || ctx.headers['x-forwarded-for'];
    if (ip != undefined) {
        ip = ip.replace('::ffff:', '').replace('::1', '');
        return ip;
    } else {
        return '';
    }

};


/**获取当前时间 */
export const getCurDate = function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    var date = now.getDate();
    date = date < 10 ? '0' + date : date;
    var hours = now.getHours();
    hours = hours < 10 ? '0' + hours : hours;
    var min = now.getMinutes();
    min = min < 10 ? '0' + min : min;
    return '' + year + month + date + hours + min;
};

export const getCurDateFormat = function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    var date = now.getDate();
    date = date < 10 ? '0' + date : date;
    var hours = now.getHours();
    hours = hours < 10 ? '0' + hours : hours;
    var min = now.getMinutes();
    min = min < 10 ? '0' + min : min;
    var sec = now.getSeconds();
    sec = sec < 10 ? '0' + sec : sec;
    return '' + year + '-' + month + '-' + date + ' ' + hours + ':' + min + ':' + sec;
};

/**
 * 文件名添加后缀
 * @param {string} file_name 
 */
export const fixFileName = (file_name, fix) => {
    let lastDotIndex = file_name.lastIndexOf('.');
    let name = file_name.substring(0, lastDotIndex);
    let ext = file_name.substring(lastDotIndex, file_name.length);
    return name + fix + ext;
};


/**
 * 修改文件名
 * @param {*} file_name  包含目录与后缀
 * @param {*} new_name   不包含目录与后缀
 */
export const updateFileName = (file_name, new_name) => {
    let lastDotIndex = file_name.lastIndexOf('.');
    let ext = file_name.substring(lastDotIndex, file_name.length);
    let lastDiaIndex = file_name.lastIndexOf('/');
    return file_name.substring(0, lastDiaIndex + 1) + new_name + ext;
};

/**
 * 生成36位的文件code
 */
export const genFileCode = () => {
    return uuidv1().replace(/-/g, '') + uuidv4().split('-')[2];
};


/**
 * 中文转拼音
 * @param {*} zhongwen 
 */
export const zhongWenToPinyin = (zhongwen) => {
    return pinyin(zhongwen, { style: pinyin.STYLE_NORMAL }).map(item => item[0]).join('');
};