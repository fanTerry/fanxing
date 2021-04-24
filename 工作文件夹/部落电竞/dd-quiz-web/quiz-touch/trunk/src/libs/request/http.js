import axios from 'axios'
import qs from 'qs';
// import {
//     Loading,
//     Message
// } from 'element-ui'
import baseParamConfig from '../../baseParamConfig';
let loading

//根据需要添加loading动画
function startLoading() {
    // loading = Loading.service({
    //     lock: true,
    //     text: '加载中....',
    //     background: 'rgba(0, 0, 0, 0.7)'
    // })
    // console.log('加载中....');
}

function endLoading() {
    // loading.close()
    // console.log('加载完成');
}
// 请求拦截
axios.interceptors.request.use(
    (config) => {
        startLoading()
        //console.log(config, 'config请求拦截');
        var param = config.data ? config.data : {};
        if (!param.agentId) {
            param.agentId = baseParamConfig.agentId;
        }
        if (!param.biz) {
            param.biz = baseParamConfig.biz;
        }
        if (!param.clientType) {
            param.clientType = baseParamConfig.clientType;
        }
        if (config.url.search("expert/apply") !== -1 || config.url.search("user/updateUserInfo") !== -1 || (isFormData(param) && param.get("isForm"))) { //表单提交
            param.append("agentId", baseParamConfig.agentId);
            param.append("biz", baseParamConfig.biz);
            param.append("clientType", baseParamConfig.clientType);
            config.data = param;
        } else {
            config.data = qs.stringify(param);
        }

        //设置请求头
        if (localStorage.eToken) {
            config.headers.Authorization = localStorage.eToken
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)
//响应拦截
axios.interceptors.response.use(
    (res) => {
        endLoading()
        // console.log("接口url:" + res.config.url + ",接口参数:", res.config.data + ",返回值:", res.data);
        if (res.status >= 200 && res.status < 300) {
            return res;
        } else if (res.status === 401) { //需要登录的但是,用户未登录,统一在error里面处理
            console.log(res.status, 'res.status');
            return res
        } else {
            return res
        }

    },
    (error) => {
        endLoading()
        // 获取状态码
        const {
            status
        } = error.response

        if (status === 401) {
            //清除token
            localStorage.removeItem('eToken')
            //跳转到登录页面
            var redirectUrl = window.sessionStorage.getItem("redirectUrl");
            console.log(redirectUrl, 'redirectUrl');
            window.location.href = '/login?agentId=' + baseParamConfig.agentId + '&biz=' + baseParamConfig.biz +
                '&clientType=' + baseParamConfig.clientType + '&redirect=' + redirectUrl;
        }
        return Promise.reject(error)
    }
)

export default axios

/**
 * 封装get方法
 * @param url
 * @param data
 * @returns {Promise}
 */
export function get(url, data = {}) {
    return new Promise((resolve, reject) => {
        axios.get(url, data)
            .then(response => {
                resolve(response.data);
            })
            .catch(err => {
                reject(err)
            })
    })
}

/**
 * 封装post请求
 * @param url
 * @param data
 * @returns {Promise}
 */

export function post(url, data = {}) {
    return new Promise((resolve, reject) => {
        axios.post(url, data)
            .then(response => {
                resolve(response.data);
            }, err => {
                reject(err)
            })
    })
}

/**
 * 封装patch请求
 * @param url
 * @param data
 * @returns {Promise}
 */
export function patch(url, data = {}) {
    return new Promise((resolve, reject) => {
        axios.patch(url, data)
            .then(response => {
                resolve(response.data);
            }, err => {
                reject(err)
            })
    })
}
/**
 * 封装put请求
 * @param url
 * @param data
 * @returns {Promise}
 */
export function put(url, data = {}) {
    return new Promise((resolve, reject) => {
        axios.put(url, data)
            .then(response => {
                resolve(response.data);
            }, err => {
                reject(err)
            })
    })
}


let isFormData = (v) => {
    return Object.prototype.toString.call(v) === '[object FormData]';
}
