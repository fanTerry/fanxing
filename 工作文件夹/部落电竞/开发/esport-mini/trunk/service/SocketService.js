const app = getApp()
var api = require('../libs/http')

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
                "playload": { "sceneId": 'R_' + _self.data.matchId, "sendMsg": content, "nickName": app.getGlobalUserInfo().nickName, "usrId": app.getGlobalUserId() + '' }
            }
            console.log("聊天室注意开始发送数据");
            toSendSocketMessage(getmsg);
            // this.serverTimeoutObj = setTimeout(() => {
            //   wx.closeSocket();
            // }, this.timeout);
        }, this.timeout);
    }
};
/**连接socket */
function linkSocket(_self) {
    wx.connectSocket({
        url: _self.data.socketUrl,
        success() {
            console.log(_self.data.socketUrl, '连接socket成功');
            initEventHandle(_self);
        }
    })
}

/**处理初始化 */
function initEventHandle(_self) {
    wx.onSocketMessage((res) => {
        var data = JSON.parse(res.data);
        console.log(data, '返回数据');
        if (data.execType == 12) {
            if (data.ret == 'fail') {//返回失败,需要重连,所有的场景都需要这个,初次发消息
                var initMsg = {
                  "execType": 12, "playload": { "usrId": app.getGlobalUserId() + '' }
                };
                toSendSocketMessage(initMsg);
            } else {//初次返回成功,则发送一条
                console.log(_self.data.initScene, '初次返回成功,则发送一条');
                toSendSocketMessage(_self.data.initScene);
            }
        } else {
            if (data.execType == 13) {//聊天
                console.log(data, '聊天室服务器返回的数据');
                _self.setData({
                    chatList: _self.data.chatList.concat(data.playload)
                });
            } else if (data.execType == 17) {//文字直播
                console.log(res, '图文直播WebSocket服务器返回的数据');
                try {
                    var playload = JSON.parse(data.playload);
                    var temp = JSON.parse(playload.data);
                    var type = playload.type || '';
                    switch (type) {
                        case 'events_live':
                            var liveData = temp;
                            console.log(liveData, '直播中的比赛');
                            if (liveData.type == "hello") {
                                return false;
                            }
                            liveTimeLive(liveData, _self);
                            break;
                        default:
                            console.log(type);
                    }
                } catch (exception) {
                    console.log(exception)
                }
            } else if (data.execType == 16) {
                console.log(res, 'WebSocket服务器返回的数据');
                doMatchLiveData(data, _self);
            }
        }
    })
    wx.onSocketOpen(() => {
        console.log('WebSocket连接打开')
        var initMsg = {
          "execType": 12, "playload": { "usrId": app.getGlobalUserId() + '' }
        };
        //发送指定消息,所有的场景都需要这个,初次发消息
        toSendSocketMessage(initMsg);
    })
    wx.onSocketError((res) => {
        console.log('WebSocket连接打开失败')
        reconnect(_self);
    })
    // wx.onSocketClose((res) => {
    //     console.log('WebSocket 已关闭！')
    // })
}

function doMatchLiveData(data, _self) {
    try {
        var playload = JSON.parse(data.playload);
        var temp = JSON.parse(playload.data);
        var type = playload.type || '';
        switch (type) {
            case 'matches_live':
                var liveData = temp;
                console.log(liveData, '直播中的比赛');
                if (liveData.type == "hello") {
                    return false;
                }
                if (_self.properties.matchDetail.videogameId == 4) {
                    if (liveData.type == "event") {
                        //api._showToast("当前比赛已结束",2);
                        api._get(api.matchDataLiveJsonUrl + _self.data.matchId).then(res => {
                            console.log(res, 'json文件');
                            matchesLiveForDota(JSON.parse(res.data), _self);
                        });
                    } else {
                       // console.log('当前游戏是dota2');
                        matchesLiveForDota(liveData, _self);
                    }
                } else if (_self.properties.matchDetail.videogameId == 1) {
                    //console.log('当前游戏是LOL');
                    matchesLiveForLoL(liveData, _self);
                }
                break;
            default:
                console.log(type);
        }
    }
    catch (exception) {
        console.log(exception)
        return
    }
}

/**重新连接 */
function reconnect(_self) {
    if (_self.data.lockReconnect) return;
    _self.data.lockReconnect = true;
    clearTimeout(_self.data.timer)
    if (_self.data.limit < 12) {//不给服务器太大的压力,这里设置的是5秒重试一次,最多请求12次
        _self.data.timer = setTimeout(() => {
            linkSocket(_self);
            _self.data.lockReconnect = false;
        }, 5000);
        _self.setData({
            limit: _self.data.limit + 1
        })
    }
}

/**发送消息,msg:json格式,统一转string */
function toSendSocketMessage(msg) {
    wx.sendSocketMessage({
        data: JSON.stringify(msg),
        success() {
            console.log("发送成功,内容:" + JSON.stringify(msg));
        }
    });
}



function matchesLiveForDota(blueData, _self) {
    var blue="",red="";
    if(_self.properties.matchDetail.homeTeamId==blueData.radiant.id){
        blue = blueData.radiant || "";//主队
        red = blueData.dire || "";//客队
    }else{
        blue = blueData.dire || "";//主队
        red = blueData.radiant || "";//客队
    }
    var curLiveDetail = {}, homeTeamHeros = [], awayTeamHeros = [];
    if (blue != "") {
        curLiveDetail.homeTeamKills = blue.score;
        curLiveDetail.awayTeamKills = red.score;
        curLiveDetail.length = blueData.current_timestamp;
        for (var i = 0; i < 5; i++) {
            var home = {}, away = {};
            home.heroLogo = api.heroDota2ImgUrlPrefix + blue.players[i].hero.id + '_' + blue.players[i].hero.name + '.png';
            away.heroLogo = api.heroDota2ImgUrlPrefix + red.players[i].hero.id + '_' + red.players[i].hero.name + '.png';
            homeTeamHeros.push(home);
            awayTeamHeros.push(away);
        }
        curLiveDetail.homeTeamHeros = homeTeamHeros;
        curLiveDetail.awayTeamHeros = awayTeamHeros;
        //console.log(curLiveDetail, 'curLiveDetail');
        _self.setData({
            curLiveDetail: curLiveDetail
        });
        console.log(_self.data.curLiveDetail, 'matchesLiveForDota数据');
        if (null != _self.selectComponent("#match_data_id")) {
          _self.selectComponent("#match_data_id").reflushData(_self.data.curLiveDetail);
        }
       
    }
}

function matchesLiveForDotaHistory(blueData, _self) {
    var blue="",red="";
    if(_self.properties.matchDetail.homeTeamId==blueData.radiant.id){
        blue = blueData.radiant || "";//主队
        red = blueData.dire || "";//客队
    }else{
        blue = blueData.dire || "";//主队
        red = blueData.radiant || "";//客队
    }
    var winner_id = blueData.winner_id || "";
    var curLiveDetail = {}, homeTeamHeros = [], awayTeamHeros = [];
    if (blue != "") {
        curLiveDetail.homeTeamKills = blue.score;
        curLiveDetail.awayTeamKills = red.score;
        curLiveDetail.length = blueData.current_timestamp;
        for (var i = 0; i < 5; i++) {
            var home = {}, away = {};
            home.heroLogo = api.heroDota2ImgUrlPrefix + blue.players[i].hero.id + '_' + blue.players[i].hero.name + '.png';
            away.heroLogo = api.heroDota2ImgUrlPrefix + red.players[i].hero.id + '_' + red.players[i].hero.name + '.png';
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

function matchesLiveForLoL(blueData, _self) {
    var curLiveDetail = matchesLiveForLoLData(blueData,_self);
    console.log(curLiveDetail, 'curLiveDetail');
    if (!curLiveDetail) {
      return;
    }
    _self.setData({
        curLiveDetail: curLiveDetail
    });
   // console.log(_self.data.curLiveDetail, 'matchesLiveForLoL数据');
    if (null != _self.selectComponent("#match_data_id")){
      _self.selectComponent("#match_data_id").reflushData(_self.data.curLiveDetail);
    }
   
}

function matchesLiveForHistory(_self) {
  console.log(_self,'gameIdArray');
    var gameIds = _self.properties.gameIdArray;
    if (null != gameIds && gameIds.length > 0 && _self.data.matchDetail.status==1) {
        gameIds = gameIds.slice(0, gameIds.length - 1);
    }
    var matchResData = [];
    if (_self.properties.matchDetail.videogameId == 4) {
        gameIds.forEach(function (value) {
            api._get(api.matchDataLiveJsonUrl + _self.properties.matchDetail.matchId + "_" + value).then(res => {
                console.log(res, 'json文件');
                var curLiveDetail = matchesLiveForDotaHistory(JSON.parse(res.data), _self);
                matchResData.push(curLiveDetail);
                _self.setData({
                    matchResData: matchResData
                });
            });
        })
    } else if (_self.properties.matchDetail.videogameId == 1) {
        gameIds.forEach(function (value) {
            api._get(api.matchDataLiveJsonUrl + _self.properties.matchDetail.matchId + "_" + value).then(res => {
              console.log(JSON.parse(res.data), 'json文件');
                var curLiveDetail = matchesLiveForLoLData(JSON.parse(res.data), _self, true);
                matchResData.push(curLiveDetail);
                _self.setData({
                    matchResData: matchResData
                });
            });
        })
    }

}

function matchesLiveForLoLData(blueData,_self) {
    var blue = "", red = "", matchId = blueData.match.id;
    if (matchId == '' || matchId != _self.data.matchDetail.matchId){
      console.log(matchId + ',' + _self.data.matchDetail.matchId+',注意赛事不匹配');
      return;
    }
    if(_self.properties.matchDetail.homeTeamId==blueData.blue.id){
        blue = blueData.blue || "";//主队
        red = blueData.red || "";//客队
    }else{
        blue = blueData.red || "";//主队
        red = blueData.blue || "";//客队
    }
    var winner_id = blueData.game.winner_id || "";
    var curLiveDetail = {}, homeTeamHeroDota = [], awayTeamHeroDota = [];
    if (blue != "") {
        var warTime = blueData.current_timestamp, lolHtml = '';
        curLiveDetail.homeTeamKills = blue.kills;
        curLiveDetail.awayTeamKills = red.kills;
        curLiveDetail.length = blueData.current_timestamp;
        lolHtml += '蓝方:' + blue.acronym + ',击杀:' + blue.kills + ',红方击杀:' + red.kills + ',红方:' + red.acronym;
        warTime = parseInt(warTime / 60) + ":" + parseInt(warTime % 60);
        lolHtml += ",时长:" + warTime;
        var positionIndex = ["top", "jun", "mid", "adc", "sup"];
        for (var i = 0; i < 5; i++) {
            var home = {}, away = {};
            //home.heroLogo = blue.players[positionIndex[i]].champion.image_url.replace(' ', '');
            //away.heroLogo = red.players[positionIndex[i]].champion.image_url.replace(' ', '');
            home.heroLogo = api.heroLoLImgUrlPrefix + blue.players[positionIndex[i]].champion.id+'.png';
            away.heroLogo = api.heroLoLImgUrlPrefix + red.players[positionIndex[i]].champion.id + '.png';
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
        // if (winner_id !=null&&winner_id != "") {
        //     if(_self.properties.matchDetail.homeTeamId==blueData.blue.id){
        //         if (winner_id == blue.id) {
        //             curLiveDetail.winnerTeam = 1;
        //         } else {
        //             curLiveDetail.winnerTeam = 0;
        //         }
        //     }else{
        //         if (winner_id == blue.id) {
        //             curLiveDetail.winnerTeam = 0;
        //         } else {
        //             curLiveDetail.winnerTeam = 1;
        //         }
        //     }
        // }
    }
    return curLiveDetail;
}

function liveTimeLive(data, _self) {
    if(data.game.id!=_self.data.curGame){
        console.log('不是当前场,不处理');
        return;
    }
    var liveStr = liveTimeLiveData(data);
    if (!liveStr){
        return;
    }
    if (_self.data.liveDataList.length > 0 && _self.data.liveDataList.indexOf(liveStr) > -1) {
        console.log(liveStr,'包含');
    }else{
        _self.data.liveDataList.unshift(liveStr);
        _self.setData({
            liveDataList: _self.data.liveDataList
        });
        console.log(_self.data.liveDataList, '文字直播数据');
        _self.selectComponent("#live_data_id").reflushData(_self.data.liveDataList);
    }
}

function eventsLiveForHistory(_self, data) {
    var liveStr = liveTimeLiveData(data);
    //console.log(liveStr, '文件中数据');
    if (!liveStr) {
      return;
    }
    if (_self.data.liveDataList.length > 0 && _self.data.liveDataList.indexOf(liveStr) > -1) {
      console.log(liveStr, '包含');
    } else {
      _self.data.liveDataList.unshift(liveStr);
      _self.setData({
        liveDataList: _self.data.liveDataList
      });
    }
    // if (liveStr) {
    //     _self.data.liveDataList.unshift(liveStr);
    //     _self.setData({
    //         liveDataList: _self.data.liveDataList
    //     });
    // }
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


function getSceneMsg(sceneType, cmdType, execType, sceneId, matchId) {
    var initScene = {
        "sceneType": sceneType, "cmdType": cmdType, "execType": execType,
        "playload": {
            "sceneId": sceneId + matchId, "usrId": app.getGlobalUserId() + '', "matchId": matchId + ''
        }
    }
    return initScene;
}

module.exports = {
    linkSocket: linkSocket,
    initEventHandle: initEventHandle,
    reconnect: reconnect,
    toSendSocketMessage: toSendSocketMessage,
    matchesLiveForDota: matchesLiveForDota,
    heartCheck: heartCheck,
    matchesLiveForLoL: matchesLiveForLoL,
    matchesLiveForHistory: matchesLiveForHistory,
    eventsLiveForHistory: eventsLiveForHistory,
    getSceneMsg: getSceneMsg
}
