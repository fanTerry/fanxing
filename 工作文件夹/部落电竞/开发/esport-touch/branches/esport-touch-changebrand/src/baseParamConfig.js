const biz = 1;
const agentId = 10002;
const loginFlag = 0;
const clientType = 6;
let inviteCode;
//腾讯统计渠道参数
const ADTAG = "bz.h5";
const ADTAGTable = {
    100104: "yb.gzhdh", //友宝.公众号大号
    100103: "yb.gzhxh", //友宝.公众号小号
    10006: "bz.gzh", //本站.公众号
    10002: "bz.h5", //本站.h5
    10003: "app.andro", //app.安卓
    1004: "app.andro.yyb", //app.安卓.腾讯应用宝
    1005: "app.andro.hw", //app.安卓.华为应用市场
    1006: "app.andro.xm", //app.安卓.小米应用市场
    1007: "app.andro.oppo", //app.安卓.OPPO应用市场
    1008: "app.andro.vivo", //app.安卓.VIVO应用市场
    1010: "app.andro.baidu", //app.安卓.百度手机助手
    1011: "app.andro.361zs", //app.andro.360手机助手(腾讯统计的渠道key不支持0,360->361)
    1012: "app.andro.wdj", //app.安卓.豌豆荚
    10004: "app.ios", //app.ios
}

export default {
    biz: biz,
    agentId: agentId,
    loginFlag: loginFlag,
    clientType: clientType,
    ADTAG: ADTAG,
    ADTAGTable: ADTAGTable,
    inviteCode: inviteCode,
    setBiz(biz) {
        this.biz = biz;
    },
    setAgentId(agentId) {
        this.agentId = agentId;
    },
    setLoginFlag(loginFlag) {
        this.loginFlag = loginFlag;
    },
    setClientType(clientType) {
        this.clientType = clientType;
    },
    setADTAG(ADTAG) {
        this.ADTAG = ADTAG;
    },
    setInviteCode(inviteCode) {
        this.inviteCode = inviteCode;
    }
}
