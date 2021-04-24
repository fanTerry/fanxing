// pages/help/feedBackDetail/feedBackDetail.js
const app = getApp();
var api = require('../../../libs/http');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		myFeedbackList: [],
		pageParam: {
			pageNo: 1,
			pageSize: 10
		},
		currPageSize: 10,
		quetionId: null,
		contentValue: "",
		placeholder: "输入回复内容",
		showType: 2,
		userInfo: {},
		paddingBottom:0
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		//设置问题ID 
		if (options.qid) {
			var userInfo = this.getGlobalUserInfo();
			console.log("userInfo", userInfo);
			this.setData({
				userInfo: userInfo,
				quetionId: options.qid,
			})
		}

		this.getMyReply(this.data.pageParam);
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

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	},
	// 绑定输入内容
	bindblur: function (e) {
		this.setData({
			contentValue: e.detail.value
		})
	},
	// 清除输入内容
	cleanVal: function () {
		this.setData({
			contentValue: null
		})
	},

	/**获取用户信息 */
	getGlobalUserInfo: function () {
		var storeUsr = wx.getStorageSync("userInfo");
		if (!storeUsr) {
			console.log("无法获取到用户信息");
			return null;
		} else {
			return JSON.parse(storeUsr);
		}
	},
	//获取反馈回复数据
	getMyReply(param) {
		var that = this;
		if (param) {
			param = {
				pageNo: 1,
				pageSize: 10
			}
		}
		param.quetionId = this.data.quetionId;
		api._postAuth("/helpcenter/detailFeedback", param)
			.then(rsp => {
				const dataResponse = rsp;
				if (dataResponse.code == "200") {
					let dataList = dataResponse.data;
					this.setData({
						myFeedbackList: that.data.myFeedbackList.concat(dataList),
						currPageSize: dataList.length,
						pageParam: param,
					})

				} else if (dataResponse.code == "9999") {
					wx.showToast({
						title: dataResponse.message,  //标题                            
						icon: "none"
					})
				}
			})
			.catch(error => {
				wx.showToast({
					title: "网络异常，稍后再试",  //标题                            
					icon: "none"
				})
				console.log(error);
			});
	},


	//发送回复内容
	toSendReply: function () {
		console.log("99999999");
		var contentValue = this.data.contentValue;
		console.log("发送的内容", contentValue);
		if (!contentValue) {
			wx.showToast({
				title: "发送内容不能为空",  //标题                            
				icon: "none"
			})
			return
		}
		let param = {};
		param.quetionId = this.data.quetionId;
		param.content = contentValue;
		api._postAuth("/helpcenter/userSendReply", param)
			.then(rsp => {
				const dataResponse = rsp;
				if (dataResponse.code == "200") {
					let myMessage = dataResponse.data;
					console.log("myMessage", myMessage);
					let list = this.data.myFeedbackList
					list.splice(1,0,myMessage)
					this.setData({
						myFeedbackList: list,
						contentValue : "",
					})
					
				} else if (dataResponse.code == "9999") {
					wx.showToast({
						title: dataResponse.message,  //标题                            
						icon: "none"
					})
				}
			})
			.catch(error => {
				wx.showToast({
					title: "网络异常，稍后再试",  //标题                            
					icon: "none"
				})
				console.log(error);
			});
	},

	//绑定输入内容的input的value值，类似双向数据绑定
	editContent(e) {
		let that = this;
		let content = e.detail.value
		that.setData({
			contentValue: content,
		})
	},
	//清除回复输入框内容
	cleanVal(event) {
		this.setData({
			contentValue: "",
		})

	},
	inputFocus(e) {
    console.log(e,'键盘弹起')
    var inputHeight = 0
    if (e.detail.height) {
      inputHeight = e.detail.height
		}
		this.setData({
			paddingBottom:inputHeight
		})
		console.log(this.data.paddingBottom);
	},
	inputBlur(){
		this.setData({
			paddingBottom:0
		})
	}
})