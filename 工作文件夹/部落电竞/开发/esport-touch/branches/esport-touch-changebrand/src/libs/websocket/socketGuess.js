import {
    post,
    get
} from '../request/http';

var websock = null;
var global_callback = null;
var lockReconnect = false; //避免重复连接
var isConneted = false;
var stopReapeat = false;
var reconnetNum = 0;
var socketObeject = {
    socketUrl: "",
    userId: "",
    matchData: null,
    spDta: null,
    initScene: null,
    currContextObject:null, //保存当前vue页面的this
};
var heartCheck = { // 心跳对象
    timeout: 120000, //120秒
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function () {
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeoutObj);
        return this;
    },
    start: function () {
        var self = this;
        this.timeoutObj = setTimeout(() => {
            var getmsg = {
                'execType': 15, // 心跳消息检测
            };
            console.log("发送心跳");
            toSendSocketMessage(getmsg);
            self.serverTimeoutObj = setTimeout(function () { //如果超过一定时间还没重置，说明后端主动断开了
                websocketclose();; //如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
            }, self.timeout + 10000);

        }, this.timeout);
    }
};

// 初始化weosocket
function initWebSocket(_self, _this) {
    // ws地址
    websock = new WebSocket(_self.socketUrl);
    isConneted = true;
    websock.onmessage = function (e) {
        websocketonmessage(_self, e, _this);

    };
    websock.onclose = function (e) {

        console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
        console.log(e)
        console.log('websock closed');
        // websocketclose(e);
        reconnect(_self, _this);
    };
    websock.onopen = function () {
        websocketOpen(_self);
    };

    // 连接发生错误的回调方法
    websock.onerror = function () {
        console.log("WebSocket连接发生错误");
        reconnect(_self, _this);
    };
}

// 实际调用的方法
function sendSock(agentData, callback) {
    global_callback = callback;
    if (websock.readyState === websock.OPEN) {
        // 若是ws开启状态
        toSendSocketMessage(agentData);
    } else if (websock.readyState === websock.CONNECTING) {
        // 若是 正在开启状态，则等待1s后重新调用
        setTimeout(function () {
            sendSock(agentData, callback);
        }, 1000);
    } else {
        // 若未开启 ，则等待1s后重新调用
        setTimeout(function () {
            sendSock(agentData, callback);
        }, 1000);
    }
}

// 数据接收
function websocketonmessage(_self, res, _this) {
    // global_calllback(JSON.parse(e.data));
    var data = JSON.parse(res.data);
    // console.log(_self.userId, '数据接收,返回数据12-3');
    if (data.execType == 12) {
        if (data.ret == 'fail') { // 返回失败,需要重连,所有的场景都需要这个,初次发消息
            var initMsg = {
                'execType': 12,
                'playload': {
                    'usrId': _self.userId
                }
            };
            toSendSocketMessage(initMsg);
        } else { // 初次返回成功,则发送一条

            heartCheck.reset().start(); //设定心跳定时器
            console.log(JSON.stringify(_self.initScene), '初次返回成功,则发送一条');
            toSendSocketMessage(_self.initScene);
            _this.$bus.$emit("webMessage", data);


        }
    } else if (data.execType == 19) {
        // 首页赛事数据
        console.log("数据发送");
        _this.$bus.$emit("webMessage", data);

    } else if (data.execType == 15) {
        console.log("接受心跳");
        heartCheck.reset().start();
    }
}

// 数据发送
function toSendSocketMessage(agentData) {
    // console.log(agentData, '开始发送数据12-3');
    // console.log(websock);
    websock.send(JSON.stringify(agentData));
}

// 关闭
function websocketclose(e) {
    // console.log("connection closed (" + e + ")");
    console.log("客户端准备主动断开");
    websock.close();
}

function reconnect(_self, _this) {

    //没连接上会一直重连，设置延迟避免请求过多
    setTimeout(function () {
        console.log("lockReconnect", _this.socketGuess.lockReconnect);
        if (_this.socketGuess.lockReconnect) {
            return;
        }
        _this.socketGuess.lockReconnect = true;
        console.log("断开重连");
        // _this.openAndinitWebSocket();
        _this.socketGuess.socketObeject.currContextObject.openAndinitWebSocket();
        _this.socketGuess.lockReconnect = false;
    }, 5000);
}

function websocketOpen(_self, _this) {
    // console.log(_self.userId, '_self.userId发送数据');
    if (!_self.userId || _self.userId == null || _self.userId == '' || _self.userId == 'undefined') {
        console.log('_self.userId为空,不发送数据');
        // alert(JSON.parse(window.localStorage.getItem('user')));
        // alert(window.localStorage.user);
        return;
    }
    var initMsg = {
        'execType': 12,
        'playload': {
            'usrId': _self.userId
        }
    };
    // 发送指定消息,所有的场景都需要这个,初次发消息
    toSendSocketMessage(initMsg);
    // console.log("连接成功");
}

function getSceneMsg(sceneType, cmdType, execType, sceneId, matchId, usrId, icon) {
    var initScene = {
        'sceneType': sceneType,
        'cmdType': cmdType,
        'execType': execType,
        'playload': {
            'sceneId': sceneId + matchId,
            'usrId': usrId,
            'matchId': matchId + '',
            'icon': icon
        }
    };
    return initScene;
}

function getInitSceneMsg(usrId) {
    var initScene = { "execType": 12, "playload": { "usrId": usrId } };
    return initScene;
}

function getHomeRoomSceneMsg(usrId) {
    var initScene = {
        "sceneType": 4,
        "cmdType": 21,
        "execType": 10,
        "playload": {
            "sceneId": "quiz_index",
            "usrId": usrId
        }
    };
    return initScene;
}

function getGameRoomSceneMsg(usrId, matchId) {
    var initScene = {
        "sceneType": 4,
        "cmdType": 21,
        "execType": 10,
        "playload": {
            "sceneId": "quiz_math_id_" + matchId,
            "usrId": usrId
        }
    };
    return initScene;
}


function leaveRoomSceneMsg(usrId, matchNo) {
    var initScene = {
        "sceneType": 4,
        "cmdType": 22,
        "execType": 10,
        "playload": {
            "sceneId": "quiz_math_no_" + matchNo,
            "usrId": usrId
        }
    };
    return initScene;
}

export {
    initWebSocket,
    getSceneMsg,
    getInitSceneMsg,
    getHomeRoomSceneMsg,
    getGameRoomSceneMsg,
    leaveRoomSceneMsg,
    sendSock,
    heartCheck,
    toSendSocketMessage,
    websocketclose,
    isConneted,
    stopReapeat,
    socketObeject,
    lockReconnect,
    reconnetNum,
};
