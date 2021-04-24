// pages/hd/hd101/answering/answering.js
const app = getApp();
var api = require('../../../../libs/http');
var time = null;
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		quetionTime: 10,
		prepareTime: 3,
		prepareDialog: false,
		currSubject: {},
		subjectNum: 1,
		active: null,
		subjectParam: {
			hdUserLogId: '', //参与流水ID
			subjectLogId: '', //答题流水ID
			subjectId: '' //题目ID
		},
		showPopType: 0,
		verigyAswerStatus: 1, //暂停题目标记 控制是否可以回答题目，答题结束时，设置为0,当续命成功，再次进行答题是，设置1
		shareCode: null,
		ansewrButtom: 1,
		//以下是弹出组件使用值
		curType: Number,
		prizeInfo: Object,
		subjectLogId: Number,
		hdUserLogId: Number,
		showFlag: false
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		this.prepareDialogCountDonwn()

		let query = {
			hdUserLogId: options.hdUserLogId, //参与流水ID
			subjectLogId: options.subjectLogId, //答题流水ID
			subjectId: options.subjectId //题目ID
		}
		this.setData({
			subjectParam: query,
		})

	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

	},
	prepareDialogCountDonwn: function () {
		console.log("0000");
		let _self = this;
		setTimeout(() => {
			this.setData({
				prepareTime: _self.data.prepareTime - 1,
			});
			if (_self.data.prepareTime == 0) {
				this.setData({
					prepareDialog: true,
				});
				_self.getFirstSubject();
			} else {
				_self.prepareDialogCountDonwn();
			}
		}, 1000);
	},

	getFirstSubject: function () {
		let param = this.data.subjectParam;
		console.log(param, "param");
		var url = "/subject/startGame";
		api._postAuth(url, param).then(res => {
			if (res.code == "200") {
				console.log(res, "getFirstSubject");
				this.setData({
					currSubject: res.data
				})
				this.subjectTimeCountDown();
				// this.wxShare(this.currSubject.shareCode);
			} else {
				api._showToast(res.message, 1.5);
			}

		});
	},

	/**
	  * 重新启动倒计时，继续答题
	  */
	reStartTimeCountDown: function () {
		console.log("触发续命");
		if (this.data.verigyAswerStatus == 1) {
			return;
		}
		clearTimeout(time)
		this.setData({
			active: null,
			verigyAswerStatus: 1,
			quetionTime: 10
		})
		this.subjectTimeCountDown();
	},

	subjectTimeCountDown: function () {
		let _self = this;
		time = setTimeout(() => {
			if (_self.data.verigyAswerStatus == 0) {
				clearTimeout(time);
				return;
			}
			_self.setData({
				quetionTime: _self.data.quetionTime - 1
			});
			if (_self.data.quetionTime == -1) {
				_self.setData({
					quetionTime: 0
				});
				clearTimeout(time);
			}
			if (_self.data.quetionTime == 0) {
				console.log("时间到");
				// this.$toast("时间到，答题结束");
				//时间到自动校验答案
				_self.setData({
					quetionTime: 0
				});
				clearTimeout(time);
				this.verigyAswer();
			} else {
				_self.subjectTimeCountDown();
			}
		}, 1000);
	},

	verigyAswer: function (event) {
		if (this.data.verigyAswerStatus == 0) {
			return;
		}
		let optinId;
		let index;
		if (event) {
			optinId = event.currentTarget.dataset.id
			index = event.currentTarget.dataset.index
			this.setData({
				active: index
			})
		}
		let param = this.data.subjectParam;
		param.userOptionIdList = optinId;
		var url = "/subject/verifyAnswer";
		api._postAuth(url, param).then(res => {
			//处理返回结果,
			this.handleReponse(res)
		});

	},

	/**
	 * 如下为处理弹窗组件逻辑
	 */
	handleReponse: function (rsp) {
		console.log(rsp, "verigyAswer");
		const dataResponse = rsp;
		if (dataResponse.code == "200") {
			this.setData({
				currSubject: dataResponse.data,
				['subjectParam.subjectId']: dataResponse.data.id,
				active: null,
				quetionTime: 10,
				subjectNum: this.data.subjectNum + 1
			})

			// clearTimeout(this.subjectTimeCountDown())
			// this.subjectTimeCountDown();
			// this.selectComponent('#countdown');
		} else if (dataResponse.code == "3222") {
			//答案出错并结束答题
			let prizeInfo = dataResponse.data;
			console.log("礼品详情", prizeInfo);
			this.setData({
				showFlag: true,
				curType: 6,
				subjectLogId: this.data.subjectParam.subjectLogId,
				prizeInfo: prizeInfo,
				verigyAswerStatus: 0
			})
			console.log("答案出错并结束答题");
		} else if (dataResponse.code == "3111") {
			let prizeInfo = dataResponse.data;
			this.setData({
				showFlag: true,
				curType: 6,
				subjectLogId: this.data.subjectParam.subjectLogId,
				prizeInfo: prizeInfo,
				verigyAswerStatus: 0,

			})
			console.log("所有题目正确，没有获得头奖");
		} else if (dataResponse.code == "3333") {
			let prizeInfo = dataResponse.data;

			this.setData({
				showFlag: true,
				curType: 5,
				subjectLogId: this.data.subjectParam.subjectLogId,
				prizeInfo: prizeInfo,
				verigyAswerStatus: 0
			})
			console.log("所有题目正确，并获得头奖");
		} else if (dataResponse.code == "3444") {
			clearTimeout(time);
			this.setData({
				subjectLogId: this.data.subjectParam.subjectLogId,
				hdUserLogId: this.data.subjectParam.hdUserLogId,
				verigyAswerStatus: 0,
				curType: 7,
				showFlag: true,
			})
			this.selectComponent("#dialog").answerWrong(this.data.subjectParam.subjectLogId, this.data.subjectParam.hdUserLogId);
			console.log("弹出续命窗口");
		} else if (dataResponse.code == "2111") {

			this.setData({
				verigyAswerStatus: 0,
				curType: 2,
				showFlag: true,
			})
			console.log("支付1毛继续挑战");
		} else if (dataResponse.code == "1607") {
			this.setData({
				verigyAswerStatus: 0,
				curType: 4,
				showFlag: true,
			})
			console.log("今天没有答题机会");
		} else {
			api._showToast(dataResponse.msg, 1.5);
		}

	},

	closePop: function (e) {
		let nextType = e.detail.nextType
		if (Number.parseInt(nextType)) {
			//关闭当前弹窗,显示其他弹窗
			if (nextType == 2) {
				if (this.data.prizeInfo.canJoinSubject) {
					this.setData({
						curType: nextType
					});
				} else {
					api._showToast("跳转首页")
					wx.switchTab({
						url: '/pages/hd/hd101/index',
					})
				}

			} else {
				this.setData({
					curType: nextType
				});
			}

		} else {
			this.setData({
				showFlag: false
			});
		}

	},

	setPrizeInfo: function (e) {
		let prizeInfo = e.detail.prizeInfo
		console.log("设置礼品", prizeInfo);
		this.setData({
			prizeInfo: prizeInfo
		})
	},

	/**
	 * 领取奖品
	 */
	getYourPrize: function (e) {
		console.log("进来领奖");
		let _self = this
		let type = e.detail.type
		let param = {},
			curType = null;
		param.userGiftLogId = this.data.prizeInfo.userGiftLogId;
		param.subjectLogId = this.data.subjectLogId;
		api._postAuth("/subject/getGifts", param)
			.then(rsp => {
				console.log(rsp);
				const dataResponse = rsp;
				if (dataResponse.code == "200") {
					//领取完成，弹出申请弹窗
					if (type == 1) {
						curType = 11;
					} else if (type == 2) {
					} else {
						curType = 3;
					}


					if (curType) {
						_self.setData({
							showFlag: true,
							curType: curType
						})
					} else {
						_self.setData({
							showFlag: false,
							curType: curType
						})
					}

				} else {
					api._showToast("礼品领取失败，请联系客服");
				}
			})
			.catch(error => {
				console.log(error);
			});
	},
	/**
	 * 用户分享
	 * shareBtn：是否按钮转发
	 * isshare：是否分享成功 isshare=1 成功 isshare=0 失败
	 */
	onShareAppMessage: function (res) {
		var that = this;
		console.log(res, 'onShareAppMessage');
		if (res.from === 'button') {
			// 来自页面内转发按钮
			that.setData({
				shareBtn: true,
			});
		} else {
			//来自右上角转发
			that.setData({
				shareBtn: false,
			});
		}
		setTimeout(() => {
			// api._showToast("定时任务设置分享成功");
			// 调用修改状态方法
			this.selectComponent("#dialog").submitToContinue(1);
		}, 4 * 1000);
		return {
			title: '一战到底，答题赢大奖',
      path: '/pages/hd/hd101/index',
      imageUrl: 'https://rs.esportzoo.com/svn/esport-res/mini/images/icon/subject_share.jpg',
			success: function (res) { //无法检测
				console.log(res);
			},
		}
	}



})