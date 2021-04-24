// modules/store/index.js
const app = getApp();
var api = require('../../../libs/http.js')
var util = require("../../../utils/util")
var strUtil = require('../../../libs/strUtil')
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		region: [],
    customItem: '请选择',
		defaulted: false,
		addressId: null,
		adderess: Object,
		returnUrl: ''

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		if (options.addressId) {
			this.setData({
				addressId: options.addressId,
			})

			api._postAuth("/shopAddress/queryAddressById", {
				addressById: options.addressId
			}).then(res => {
				if (res.code == "200") {
					var address = res.data.shopAddress
					var defaulted = false
					if (address.defaulted == 1) {
						var defaulted = true
					}
					var region = []
					region[0] = address.receiverProvince
					region[1] = address.receiverCity
					region[2] = address.receiverDistrict
					this.setData({
						adderess: address,
						region: region,
						defaulted: defaulted
					});


				} else {
					console.log(res.message);
				}
			}).catch(e => { })

		}
		this.setData({
			returnUrl: options.returnUrl
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
		this.loadShopGoods()
	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	},




	bindRegionChange: function (e) {
		console.log('picker发送选择改变，携带值为', e.detail.value)
		console.log(e.detail.value);
		this.setData({
			region: e.detail.value
		})
	},

	formSubmit: function (e) {

		var param = {}
		param.receiverName = e.detail.value.receiverName
		param.receiverPhone = e.detail.value.receiverPhone
		param.receiverAddress = e.detail.value.receiverAddress
		if (this.data.defaulted) {
			param.defaulted = 1
		} else {
			param.defaulted = 0
		}
		if (this.data.addressId) {
			param.id = this.data.addressId
		}

		param.receiverProvince = this.data.region[0]
		param.receiverCity = this.data.region[1]
		param.receiverDistrict = this.data.region[2]

		console.log(param);

		if (!param.receiverName) {
			api._showToast("请填写收货人", 1);
			return
		}

		if (!param.receiverPhone || !util.checkPhone(param.receiverPhone)) {
			api._showToast("请填写正确手机号码", 1);
			return
		}

		if (!param.receiverAddress) {
			api._showToast("请填写详细地址", 1);
			return
		}
		var url = "/shopAddress/saveAddress"
		wx.showLoading({
			title: '正在保存'
		});
		api._postAuth(url, param).then(res => {
			if (res.code == "200") {
				console.log("添加完成");
				wx.hideLoading();
				console.log(this.data.returnUrl, 'this.data.returnUrl');
				if (this.data.returnUrl) {
					wx.redirectTo({
						url: strUtil.base64decode(this.data.returnUrl)
					})
				} else {
					// wx.redirectTo({
					// 	url: '/pages/store/address/manage'
					// })
					wx.navigateBack()
				}

			} else {
				api._showToast("添加失败", 1);
				console.log(res.message);
			}
		}).catch(e => { })


	},

	chooseDefault: function () {
		var checked = !this.data.defaulted
		this.setData({
			defaulted: checked
		})
	},

	deleteAdderess: function (e) {
		let addresId = this.data.addressId
		wx.showModal({
			title: '温馨提示',
			content: '是否删除改地址',
			success(res) {
				if (res.confirm) {
					console.log('用户点击确定')
					console.log(addresId);
					api._postAuth("/shopAddress/deleteAddress", {
						addresId: addresId
					}).then(res => {
						if (res.code == "200") {
							console.log("删除完成");
							// wx.navigateTo({
							// 	url: '/pages/store/address/manage'
							// })
							wx.navigateBack()
						} else {
							api._showToast("删除失败", 1);
							console.log(res.message);
						}
					}).catch(e => { })


				} else if (res.cancel) {
					console.log('用户点击取消')
				}
			}
		})


	}



})