import global_ from '../../globalConst'
import {
    post,
    get
} from '../request/http';
const heroDota2ImgUrlPrefix = global_.heroDota2ImgUrlPrefix; //dota2英雄前缀
const heroLoLImgUrlPrefix = global_.heroLoLImgUrlPrefix; //LOL英雄前缀
var websock = null;
var global_callback = null;

var firstDrake = 0;
var firstTower = 0;
var firstblood = 0;
var heartCheck = { //心跳对象
    timeout: 100,
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function () {
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeoutObj);
        return this;
    },
    start: function (content, _self) {
        this.timeoutObj = setTimeout(() => {
            var getmsg = {
                "sceneType": 3, //房间场景
                "execType": 13, //聊天
                "playload": {
                    "sceneId": 'R_' + _self.matchId,
                    "sendMsg": content,
                    "nickName": _self.nickName,
                    "usrId": _self.userId
                }
            }
            //console.log("聊天室注意开始发送数据");
            toSendSocketMessage(getmsg);
            // this.serverTimeoutObj = setTimeout(() => {
            //   wx.closeSocket();
            // }, this.timeout);
        }, this.timeout);
    }
};

//初始化weosocket
function initWebSocket(_self) {
    //ws地址
    websock = new WebSocket(_self.socketUrl);
    websock.onmessage = function (e) {

        websocketonmessage(_self, e);
    }
    websock.onclose = function (e) {
        console.log('websock closed');
       // websocketclose(e);
    }
    websock.onopen = function () {

        websocketOpen(_self);
    }

    //连接发生错误的回调方法
    websock.onerror = function () {
        //console.log("WebSocket连接发生错误");
    }
}

// 实际调用的方法
function sendSock(agentData, callback) {
    global_callback = callback;
    if (websock.readyState === websock.OPEN) {
        //若是ws开启状态
        toSendSocketMessage(agentData)
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

//数据接收
function websocketonmessage(_self, res) {
    // global_calllback(JSON.parse(e.data));
    var data = JSON.parse(res.data);
    console.log(_self.userId, '数据接收,返回数据');
    if (data.execType == 12) {
        if (data.ret == 'fail') { //返回失败,需要重连,所有的场景都需要这个,初次发消息
            var initMsg = {
                "execType": 12,
                "playload": {
                    "usrId": _self.userId
                }
            };
            toSendSocketMessage(initMsg);
        } else { //初次返回成功,则发送一条
            //console.log(_self.initScene, '初次返回成功,则发送一条');
            console.log(JSON.stringify(_self.initScene), '11初次返回成功,则发送一条');
            toSendSocketMessage(_self.initScene);
        }
    } else {
        if (data.execType == 13) { //聊天
            //console.log(data, '聊天室服务器返回的数据');
            _self.chatList = _self.chatList.concat(data.playload);
        } else if (data.execType == 17) { //文字直播
            //console.log(res, '图文直播WebSocket服务器返回的数据');
            try {
                var playload = JSON.parse(data.playload);
                var temp = JSON.parse(playload.data);
                var type = playload.type || '';
                switch (type) {
                    case 'events_live':
                        var liveData = temp;
                        //console.log(liveData, '直播中的比赛');
                        if (liveData.type == "hello") {
                            return false;
                        }
                        liveTimeLive(liveData, _self);
                        break;
                    default:
                        //console.log(type);
                }
            } catch (exception) {
                //console.log(exception)
            }
        } else if (data.execType == 16) {
            //console.log(res, 'WebSocket服务器返回的数据');
            doMatchLiveData(data, _self);
        }
    }
}

//数据发送
function toSendSocketMessage(agentData) {
    //console.log(agentData, '开始发送数据');
    //console.log(websock);
    websock.send(JSON.stringify(agentData));
}

//关闭
function websocketclose(e) {
    //console.log("connection closed (" + e + ")");
    websock.close();
}

function websocketOpen(_self) {
    console.log(_self.userId,'_self.userId发送数据');
    if (!_self.userId || _self.userId == null || _self.userId == '' || _self.userId == 'undefined') {
        console.log('_self.userId为空,不发送数据');
        // alert(JSON.parse(window.localStorage.getItem('user')));
        // alert(window.localStorage.user);
        return;
    }
    var initMsg = {
        "execType": 12,
        "playload": {
            "usrId": _self.userId
        }
    };
    //发送指定消息,所有的场景都需要这个,初次发消息
    toSendSocketMessage(initMsg);
    //console.log("连接成功");
}

function canWriteToLocalStorage() {
    try {
        window.localStorage.setItem('_canWriteToLocalStorage', "1");
        window.localStorage.removeItem('_canWriteToLocalStorage');
        return true
    } catch (e) {
        return false
    }
}

function getSceneMsg(sceneType, cmdType, execType, sceneId, matchId,usrId) {
    var initScene = {
        "sceneType": sceneType,
        "cmdType": cmdType,
        "execType": execType,
        "playload": {
            "sceneId": sceneId + matchId,
            "usrId": usrId,
            "matchId": matchId + ''
        }
    }
    return initScene;
}

function matchesLiveForHistory(_self) {
    //console.log(_self.gameIdArray, 'gameIdArray');
    var gameIds = _self.gameIdArray;
    if (!gameIds) {
        return;
    }
    if (null != gameIds && gameIds.length > 0 && _self.matchDetail.status == 1) {
        gameIds = gameIds.slice(0, gameIds.length - 1);
    }
    var matchResData = [];
    if (_self.matchDetail.videogameId == 4) {
        gameIds.forEach(function (value) {
            _self.$post("/agency/league/getJsonFile", {
                    matchId: _self.matchDetail.matchId,
                    gameId: value,
                    type: "match_live"
                })
                .then(res => {
                    if (res.code == "200" && res.data) {
                        if (res.data && res.data.fileContent) {
                            var dataJson = JSON.parse(res.data.fileContent);
                            var curLiveDetail = matchesLiveForDotaHistory(JSON.parse(dataJson.data), _self);
                            matchResData.push(curLiveDetail);
                            _self.matchResData = matchResData;
                        }
                    } else {}
                })
                .catch(e => {
                    //console.log(e);
                });
            // _self.$get(matchDataLiveJsonUrl + _self.matchDetail.matchId + "_" + value).then(res => {
            //     //console.log(res, 'json文件');
            //     var curLiveDetail = matchesLiveForDotaHistory(JSON.parse(res.data), _self);
            //     matchResData.push(curLiveDetail);
            //     _self.setData({
            //         matchResData: matchResData
            //     });
            // });
        })
    } else if (_self.matchDetail.videogameId == 1) {
        gameIds.forEach(function (value) {
            _self.$post("/agency/league/getJsonFile", {
                    matchId: _self.matchDetail.matchId,
                    gameId: value,
                    type: "match_live"
                })
                .then(res => {
                    if (res.code == "200" && res.data) {
                        if (res.data && res.data.fileContent) {
                            var dataJson = JSON.parse(res.data.fileContent);
                            var curLiveDetail = matchesLiveForLoLData(JSON.parse(dataJson.data), _self, true);
                            matchResData.push(curLiveDetail);
                            _self.matchResData = matchResData;
                        }
                    } else {}
                })
                .catch(e => {
                    //console.log(e);
                });
            // _self.$get(matchDataLiveJsonUrl + _self.matchDetail.matchId + "_" + value).then(res => {
            //     //console.log(res, '!!!!!!json文件');
            //     var curLiveDetail = matchesLiveForLoLData(JSON.parse(res.data), _self, true);
            //     matchResData.push(curLiveDetail);
            //     _self.matchResData = matchResData;
            // });
        })
    }

}

function matchesLiveForLoLData(blueData, _self) {
    var blue = "",
        red = "",
        matchId = blueData.match.id;
    if (matchId == '' || matchId != _self.matchDetail.matchId) {
        //console.log(matchId + ',' + _self.matchDetail.matchId + ',注意赛事不匹配');
        return;
    }
    if (_self.matchDetail.homeTeamId == blueData.blue.id) {
        blue = blueData.blue || ""; //主队
        red = blueData.red || ""; //客队
    } else {
        blue = blueData.red || ""; //主队
        red = blueData.blue || ""; //客队
    }
    var winner_id = blueData.game.winner_id || "";
    var curLiveDetail = {},
        homeTeamHeroDota = [],
        awayTeamHeroDota = [];
    if (blue != "") {
        var warTime = blueData.current_timestamp,
            lolHtml = '';
        curLiveDetail.homeTeamKills = blue.kills;
        curLiveDetail.awayTeamKills = red.kills;
        curLiveDetail.length = blueData.current_timestamp;
        lolHtml += '蓝方:' + blue.acronym + ',击杀:' + blue.kills + ',红方击杀:' + red.kills + ',红方:' + red.acronym;
        warTime = parseInt(warTime / 60) + ":" + parseInt(warTime % 60);
        lolHtml += ",时长:" + warTime;
        var positionIndex = ["top", "jun", "mid", "adc", "sup"];
        for (var i = 0; i < 5; i++) {
            var home = {},
                away = {};
            home.heroLogo = heroLoLImgUrlPrefix + blue.players[positionIndex[i]].champion.id + '.png';
            away.heroLogo = heroLoLImgUrlPrefix + red.players[positionIndex[i]].champion.id + '.png';
            homeTeamHeroDota.push(home);
            awayTeamHeroDota.push(away);
        }
        curLiveDetail.homeTeamHeros = homeTeamHeroDota;
        curLiveDetail.awayTeamHeros = awayTeamHeroDota;
        if (winner_id != "") {
            if (winner_id == blue.id) {
                curLiveDetail.winnerTeam = 1
            } else {
                curLiveDetail.winnerTeam = 0;
            }
        }
        if (blueData.game.finished) { //已经完场
            curLiveDetail.finished = true;
        } else {
            curLiveDetail.finished = false;
        }
    }
    return curLiveDetail;
}

function matchesLiveForDotaHistory(blueData, _self) {
    var blue = "",
        red = "";
    if (_self.matchDetail.homeTeamId == blueData.radiant.id) {
        blue = blueData.radiant || ""; //主队
        red = blueData.dire || ""; //客队
    } else {
        blue = blueData.dire || ""; //主队
        red = blueData.radiant || ""; //客队
    }
    var winner_id = blueData.winner_id || "";
    var curLiveDetail = {},
        homeTeamHeros = [],
        awayTeamHeros = [];
    if (blue != "") {
        curLiveDetail.homeTeamKills = blue.score;
        curLiveDetail.awayTeamKills = red.score;
        curLiveDetail.length = blueData.current_timestamp;
        for (var i = 0; i < 5; i++) {
            var home = {},
                away = {};
            home.heroLogo = heroDota2ImgUrlPrefix + blue.players[i].hero.id + '_' + blue.players[i].hero.name + '.png';
            away.heroLogo = heroDota2ImgUrlPrefix + red.players[i].hero.id + '_' + red.players[i].hero.name + '.png';
            homeTeamHeros.push(home);
            awayTeamHeros.push(away);
        }
        curLiveDetail.homeTeamHeros = homeTeamHeros;
        curLiveDetail.awayTeamHeros = awayTeamHeros;
        if (winner_id != "") {
            if (winner_id == blue.id) {
                curLiveDetail.winnerTeam = 1
            } else {
                curLiveDetail.winnerTeam = 0;
            }
        }
        return curLiveDetail;
    }
}

function eventsLiveForHistory(_self, data) {
    var liveStr = liveTimeLiveData(data);
    ////console.log(liveStr, '文件中数据');
    if (!liveStr) {
        return;
    }
    if (_self.liveDataList.length > 0 && _self.liveDataList.indexOf(liveStr) > -1) {
        //console.log(liveStr, '包含');
    } else {
        _self.liveDataList.unshift(liveStr);
    }
}

function liveTimeLiveData(data) {
    var detail = data;
    var liveStr = "";
    var detailLoad = detail.payload
    var type = detailLoad.type;
    var killer = detailLoad.killer;
    var killed = detailLoad.killed;
    if (type == 'drake' && firstDrake == 0) {
        var second = detail.ingame_timestamp;
        var time = parseInt(second / 60) + "′" + parseInt(second % 60) + '′′';
        var message = "第一条小龙被" + killer.object.champion.name + "(" + killer.object.name + ")" + "击杀了"
        liveStr = time + ' ' + message;
        firstDrake++;
    } else if (type == 'drake') {
        var second = detail.ingame_timestamp;
        var time = parseInt(second / 60) + "′" + parseInt(second % 60) + '′′';
        var message = "小龙被" + killer.object.champion.name + "(" + killer.object.name + ")" + "击杀了"
        liveStr = time + ' ' + message;
    }
    if (type == 'player' && firstblood == 0) {
        var second = detail.ingame_timestamp;
        var time = parseInt(second / 60) + "′" + parseInt(second % 60) + '′′';
        var message = "一血爆发，" + killer.object.champion.name + "(" + killer.object.name + ")" + "击杀了" + killed.object.champion.name + "(" + killed.object.name + ")";
        liveStr += time + ' ' + message;
        firstblood++;
    } else if (type == 'player') {
        var second = detail.ingame_timestamp;
        var time = parseInt(second / 60) + "′" + parseInt(second % 60) + '′′';
        var message = killer.object.champion.name + "(" + killer.object.name + ")" + "击杀了" + killed.object.champion.name + "(" + killed.object.name + ")";
        liveStr = time + ' ' + message;
    }
    if (type == 'tower' && firstTower == 0) {
        var second = detail.ingame_timestamp;
        var time = parseInt(second / 60) + "′" + parseInt(second % 60) + '′′';
        if (killer.type == "minion") {
            var message = "第一座防御塔被小兵摧毁了";
        } else {
            var message = "首次破塔，" + killer.object.champion.name + "(" + killer.object.name + ")" + "摧毁了第一座防御塔";
        }
        liveStr = time + ' ' + message;
        firstTower++;
    } else if (type == 'tower') {
        var second = detail.ingame_timestamp;
        var time = parseInt(second / 60) + "′" + parseInt(second % 60) + '′′';
        if (killer.type == "minion") {
            var message = "防御塔被小兵摧毁了";
        } else {
            var message = killer.object.champion.name + "(" + killer.object.name + ")" + "摧毁了防御塔";
        }
        liveStr = time + ' ' + message;
    }
    if (type == 'rift_herald ') {
        var second = detail.ingame_timestamp;
        var time = parseInt(second / 60) + "′" + parseInt(second % 60) + '′′';
        var message = '河蟹被' + killer.object.champion.name + "(" + killer.object.name + ")" + "击杀了";
        liveStr = time + ' ' + message;
        firstblood++;
    }
    if (type == 'inhibitor') {
        var second = detail.ingame_timestamp;
        var time = parseInt(second / 60) + "′" + parseInt(second % 60) + '′′';
        if (killer.type == "minion") {
            var message = "水晶被小兵摧毁了";
        } else {
            var message = killer.object.champion.name + "(" + killer.object.name + ")" + "推掉了兵营";
        }
        liveStr = time + ' ' + message;
        firstblood++;
    }
    if (type == 'baron_nashor') {
        var second = detail.ingame_timestamp;
        var time = parseInt(second / 60) + "′" + parseInt(second % 60) + '′′';
        var message = '大龙被' + killer.object.champion.name + "(" + killer.object.name + ")" + "击杀了";
        liveStr = time + ' ' + message + liveStr;
        firstblood++;
    }
    return liveStr;
}

function doMatchLiveData(data, _self) {
    try {
        var playload = JSON.parse(data.playload);
        var temp = JSON.parse(playload.data);
        var type = playload.type || '';
        switch (type) {
            case 'matches_live':
                var liveData = temp;
                //console.log(liveData, '直播中的比赛');
                if (liveData.type == "hello") {
                    return false;
                }
                if (_self.matchDetail.videogameId == 4) {
                    if (liveData.type == "event") {
                        //agency._showToast("当前比赛已结束",2);
                        _self.$post("/agency/league/getJsonFile", {
                                matchId: matchId,
                                gameId: value,
                                type: "match_live"
                            })
                            .then(res => {
                                if (res.code == "200" && res.data) {
                                    if (res.data && res.data.fileContent) {
                                        var dataJson = JSON.parse(res.data.fileContent);
                                        matchesLiveForHistory(JSON.parse(dataJson.data), _self);
                                    }
                                } else {}
                            })
                            .catch(e => {
                                //console.log(e);
                            });
                        // _self.$get(api.matchDataLiveJsonUrl + _self.matchId).then(res => {
                        //     //console.log(res, 'json文件');
                        //     matchesLiveForDota(JSON.parse(res.data), _self);
                        // });
                    } else {
                        // //console.log('当前游戏是dota2');
                        matchesLiveForDota(liveData, _self);
                    }
                } else if (_self.matchDetail.videogameId == 1) {
                    ////console.log('当前游戏是LOL');
                    matchesLiveForLoL(liveData, _self);
                }
                break;
            default:
                //console.log(type);
        }
    } catch (exception) {
        //console.log(exception)
        return
    }
}

function matchesLiveForLoL(blueData, _self) {
    var curLiveDetail = matchesLiveForLoLData(blueData, _self);
    //console.log(curLiveDetail, 'curLiveDetail');
    if (!curLiveDetail) {
        return;
    }
    _self.curLiveDetail = curLiveDetail;
    //console.log(_self.curLiveDetail, 'matchesLiveForLoL数据');
    if (null != _self.$refs.detailData) {
        _self.$refs.detailData.reflushData(_self.curLiveDetail);
    }

}

function matchesLiveForDota(blueData, _self) {
    var curLiveDetail = matchesLiveForDotaHistory(blueData, _self);
    //console.log(curLiveDetail, 'curLiveDetail');
    if (!curLiveDetail) {
        return;
    }
    _self.curLiveDetail = curLiveDetail;
    //console.log(_self.curLiveDetail, 'matchesLiveForLoL数据');
    if (null != _self.$refs.detailData) {
        _self.$refs.detailData.reflushData(_self.curLiveDetail);
    }

}

function liveTimeLive(data, _self) {
    if (data.game.id != _self.curGame) {
        //console.log('不是当前场,不处理');
        return;
    }
    var liveStr = liveTimeLiveData(data);
    if (!liveStr) {
        return;
    }
    if (_self.liveDataList.length > 0 && _self.liveDataList.indexOf(liveStr) > -1) {
        //console.log(liveStr, '包含');
    } else {
        _self.liveDataList.unshift(liveStr);
        //console.log(_self.liveDataList, '文字直播数据');
        if (_self.$refs.detailLive) {
            _self.$refs.detailLive.reflushData(_self.liveDataList);
        }
    }
}

//initWebSocket();

export {
    initWebSocket,
    getSceneMsg,
    sendSock,
    heartCheck,
    toSendSocketMessage,
    matchesLiveForHistory,
    eventsLiveForHistory,
    websocketclose
}
