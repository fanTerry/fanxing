import Vue from 'vue';
import $ from 'webpack-zepto';
import VueRouter from 'vue-router';
import filters from './filters';
import routes from './routers';
import Alert from './libs/alert';
import './libs/rem';
import store from './vuex';
import FastClick from './libs/fastclick';
import 'vue-photo-preview/dist/skin.css';
import './assets/common/iconfont.css';
import './assets/common/main.scss';
import './assets/common/swiper';
import 'jquery';
import toastRegistry from './components/common/toast/index';
import {
    post,
    get
} from './libs/request/http';
import wxApi from "./libs/weixinShare";
import axios from 'axios';
import VConsole from 'vconsole';
import globalConst from './globalConst';
import baseParamConfig from './baseParamConfig';
import * as socketApi from './libs/websocket/socketService';
import * as socketToolApi from './libs/websocket/socketServiceTool';
import wx from 'weixin-js-sdk';
import preview from 'vue-photo-preview';
import vueHashCalendar from 'vue-hash-calendar'
import 'vue-hash-calendar/lib/vue-hash-calendar.css'
Vue.use(vueHashCalendar)
Vue.prototype.socketApi = socketApi;
Vue.prototype.socketToolApi = socketToolApi;
Vue.prototype.wx = wx
// 定义全局变量
Vue.prototype.$post = post;
Vue.prototype.$get = get;
Vue.prototype.$axios = axios;
Vue.prototype.globalConst = globalConst;
Vue.prototype.baseParamConfig = baseParamConfig;
Vue.prototype.$wxApi = wxApi;
Vue.use(VueRouter);
Vue.use(Alert);
Vue.use(toastRegistry);
let options = {
    fullscreenEl: true,
    history: true //点击返回键可以回退
};
Vue.use(preview, options);
Vue.use(preview);
console.log(process.env.NODE_ENV, 'process.env.NODE_ENV');
if (process.env.NODE_ENV === 'daily') {
    new VConsole();
}
//事件总线
var eventBus = {
    install(Vue, options) {
        Vue.prototype.$bus = new Vue()
    }
};
Vue.use(eventBus);


// 实例化Vue的filter
Object.keys(filters).forEach(k => Vue.filter(k, filters[k]));

// 实例化VueRouter
const router = new VueRouter({
    mode: 'history',
    routes
});
if ('addEventListener' in document) {
    document.addEventListener('DOMContentLoaded', function () {
        FastClick.attach(document.body);
    }, false);
}
if (window.localStorage.user) {
    store.dispatch('setUserInfo', JSON.parse(window.localStorage.user));
}


function getCookie(sName) {
    var aCookie = document.cookie.split("; ");
    for (var i = 0; i < aCookie.length; i++) {
        var aCrumb = aCookie[i].split("=");
        if (sName == aCrumb[0])
            return unescape(aCrumb[1]);
    }
    return null;
}

if (window.localStorage.token) {
    if (!getCookie("h5_login_cookie_sid")) {
        console.log("进来获取本地缓存的token");
        var token = window.localStorage.token
        var day = 1;
        var exp = new Date();
        var name = "h5_login_cookie_sid";
        exp.setTime(exp.getTime() + day*24*60*60*1000);
        document.cookie = name + "="+ escape (token) + ";expires=" + exp.toGMTString();
    }

}
//统一加渠道号&登录中间验证，页面需要登录而没有登录的情况直接跳转登录 from 上一个路由,to现在的路由
router.beforeEach((to, from, next) => {
    if (to.query.debug && to.query.debug == 1) {
        new VConsole();
    }
    if (to.meta.title) {
        document.title = to.meta.title
    }
    //有cookie在加loginFlag判断的原因是避免服务端redis缓存失效
    //在全局配置中添加的原因是避免已经登录的状态下多次调用第三方登录接口
    var path = to.path;
    var agentId = to.query.agentId ? to.query.agentId : baseParamConfig.agentId;
    var biz = to.query.biz ? to.query.biz : baseParamConfig.biz;
    console.log("agentId", agentId);
    var ADTAG = baseParamConfig.ADTAGTable[agentId] ? baseParamConfig.ADTAGTable[agentId] : baseParamConfig.ADTAG;
    var loginflag = to.query.loginflag
    if (loginflag) {
        baseParamConfig.setLoginFlag(loginflag);
    }
    var clientType = to.query.clientType ? to.query.clientType : baseParamConfig.clientType;
    baseParamConfig.setClientType(clientType);
    console.log("to.fullPath=" + to.fullPath + ",agentId=" + agentId + ",biz=" + biz + ",loginflag=" + loginflag + ",clientType=" + clientType + ",ADTAG=" + ADTAG);
    if (biz && biz == 2) { //友宝业务系统
        var cookieSid = null;
        var aCookie = document.cookie.split("; ");
        for (var i = 0; i < aCookie.length; i++) {
            var aCrumb = aCookie[i].split("=");
            if ("ubox_login_cookie_sid" == aCrumb[0]) {
                cookieSid = unescape(aCrumb[1]);
            }
        }
        console.log(cookieSid, "beforeEach，友宝进入获取登录cookie");
        if (!cookieSid || cookieSid == "" || cookieSid == '""') {
            console.log("无cookie值，进入友宝登录");
            window.location.href = "/api/third/login?agentId=" + agentId + "&biz=" + biz + "&redirect=" + encodeURIComponent(window.location.href);
            return;
        } else {
            if (!baseParamConfig.loginFlag) {
                console.log("有cookie,但没有登录标记，进入友宝登录");
                window.location.href = "/api/third/login?agentId=" + agentId + "&biz=" + biz + "&redirect=" + encodeURIComponent(window.location.href);
                return;
            }
        }
    }
    if (clientType == 7) { //微信公众号进入
        var cookieSid = null;
        var aCookie = document.cookie.split("; ");
        for (var i = 0; i < aCookie.length; i++) {
            var aCrumb = aCookie[i].split("=");
            if ("wx_account_login_cookie_sid" == aCrumb[0]) {
                cookieSid = unescape(aCrumb[1]);
            }
        }
        console.log(cookieSid, "beforeEach，微信公众号进入获取登录cookie");
        if (!cookieSid || cookieSid == "" || cookieSid == '""') {
            console.log("无cookie值，进入微信公众号登录");
            window.location.href = "/api/wxlogin/toAuth?agentId=" + agentId + "&biz=" + biz + "&clientType=7" + "&backUrl=" + encodeURIComponent(window.location.href);
            return;
        }
    }
    window.sessionStorage.setItem("redirectUrl", encodeURIComponent(to.fullPath));
    globalConst.entryUrl = to.fullPath
    window.sessionStorage.setItem("entryUrl", to.fullPath);
    if (to.query.agentId && to.query.biz && to.query.clientType && to.query.ADTAG && (to.query.ADTAG === ADTAG)) {
        baseParamConfig.setAgentId(to.query.agentId);
        baseParamConfig.setBiz(to.query.biz);
        baseParamConfig.setClientType(to.query.clientType);
        baseParamConfig.setADTAG(ADTAG);
        next();
        return;
    }
    if (agentId || biz || clientType) {
        baseParamConfig.setAgentId(agentId);
        baseParamConfig.setBiz(biz);
        baseParamConfig.setClientType(clientType);
        baseParamConfig.setADTAG(ADTAG);
        let toQuery = JSON.parse(JSON.stringify(to.query));
        let toParams = JSON.parse(JSON.stringify(to.params)) || {};
        console.log(toParams, 'toparams');
        toQuery.agentId = agentId;
        toQuery.biz = biz;
        toQuery.clientType = clientType;
        toQuery.ADTAG = ADTAG;
        globalConst.entryUrl = to.fullPath
        window.sessionStorage.setItem("entryUrl", to.fullPath);
        if (JSON.stringify(toParams) != '{}') {
            console.log('toParams不为空');
            next({
                name: to.name,
                params: toParams,
                query: toQuery

            })
        } else {
            next({
                path: to.path,
                query: toQuery
            })
        }
    } else {
        globalConst.entryUrl = to.fullPath
        window.sessionStorage.setItem("entryUrl", to.fullPath);
        next();
    }
});

//统一在页面上做分享,按需求做页面级别分享--2019/10/11 Wj
// router.afterEach((to, from) => {
//     const u = navigator.userAgent.toLowerCase()
//     if (u.indexOf("like mac os x") < 0 || u.match(/MicroMessenger/i) != 'micromessenger') return
//     if (to.path !== global.location.pathname) {
//         location.assign(to.fullPath)
//     }
// })

// router.afterEach((to, from) => {
//     console.log(to,"进入afterEach-to");
//     console.log(from,"进入afterEach-from");
//     let desc = '风靡国内外的资讯，多种比赛，超多专家入驻，观看比赛必备',
//         title = '动动电竞',
//         imgUrl = 'https://rs.esportzoo.com/svn/esport-res/mini/images/default/juzi_logo.jpg';
//     if (JSON.stringify(to.meta)!='{}'&&to.meta.shareTitle) {//路由中设置了相关分享描述
//         console.log(to.meta.shareTitle);
//         desc = to.meta.shareDesc || desc;
//         title = to.meta.shareTitle || title;
//         imgUrl = to.meta.shareImgUrl || imgUrl;
//     }else{
//         console.log("未设置分享相关的信息,不处理");
//         return;
//     }
//     if(to.meta.pageShare){
//         console.log("当前页面,在页面上设置分享");
//         return;
//     }
//     console.log(JSON.stringify(to.meta)=='{}', 'to.meta');
//     let u = navigator.userAgent;
//     if (u.toLowerCase().match(/MicroMessenger/i) != 'micromessenger'){
//         console.log("当前不是微信环境,不设置分享");
//         return;
//     } 
//     let isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
//     let _url = window.location.origin + to.fullPath
//     if (isiOS) {
//         console.log(_url, 'ios设备');
//         _url = window.location.href.split('#')[0];
//     } else {
//         console.log(_url, '非ios设备');
//     }
//     axios.post('/api/wxlogin/jsCheck', {
//         reqUrl: _url
//     }, {
//         timeout: 5000,
//         withCredentials: true
//     }).then(function (res) {
//         let _lists = res.data
//         wx.config({
//             debug: false,
//             appId: _lists.appId,
//             timestamp: _lists.timestamp,
//             nonceStr: _lists.nonceStr,
//             signature: _lists.signature,
//             jsApiList: ["updateAppMessageShareData", "updateTimelineShareData"] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
//         })
//     })
//     // 微信分享配置
//     wx.ready(function () {
//         wx.updateAppMessageShareData({
//             title: title, // 分享标题, 请自行替换
//             desc: desc, // 分享描述
//             link: window.location.origin + to.fullPath, // 分享链接，根据自身项目决定是否需要split
//             imgUrl: imgUrl, // 分享图标, 请自行替换，需要绝对路径
//             success: function () {
//                 console.log("用户成功分享给朋友执行的回调函数");
//             }
//         })
//         wx.updateTimelineShareData({
//             title: title, // 分享标题, 请自行替换
//             link: window.location.origin + to.fullPath, // 分享链接，根据自身项目决定是否需要split
//             imgUrl: imgUrl, // 分享图标, 请自行替换，需要绝对路径
//             success: function () {
//                 // 用户成功分享后执行的回调函数
//                 console.log("用户成功分享到朋友圈执行的回调函数");
//                 // option.success()
//             },
//         })
//     })
// })


router.onError((error) => {
    console.log("cuowu", error);
    const pattern = /Loading chunk (\d)+ failed/g;
    const isChunkLoadFailed = error.message.match(pattern);
    const targetPath = router.history.pending.fullPath;
    if (isChunkLoadFailed) {
        router.replace(targetPath);
    }
});


new Vue({
    router,
    store
}).$mount('#app');
