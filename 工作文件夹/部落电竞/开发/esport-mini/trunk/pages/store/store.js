// modules/store/index.js
const app = getApp();
var api = require('../../libs/http.js')
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		myClass: "goods_list",
		categoryList: [],
		adList: [],
		shopGoodList: [],
		pageNo: 0,
		pageSize: 10,
		haseNext: true,
		goodsQueryType: 1,//热门推荐
		swiperOpt: {
			indColor: "#fff",
			indActColor: "#fea21b",//#075fe7
		},
		pageType: 1,
		subMenuList: [
			{ contentType: 1, name: "热门推荐" },
			{ contentType: 2, name: "上新" },
			{ contentType: 3, name: "人气排行" }
		],
		miniSwitch:0,
    ready:false

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		this.loadIndexData()
		this.loadShopGoods()

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

		/*数据重新加载刷新*/
		this.setData({
			adList: [],
			shopGoodList: [],
			categoryList: [],
			pageNo: 0,
			pageSize: 10,
			haseNext: true,
		});
		this.loadIndexData();
		this.loadShopGoods();
		wx.stopPullDownRefresh();
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

	/**
     * 查询商品和广告轮播图
     */
	loadIndexData: function () {
		var that = this
		var url = "/shop/indexData";
		api._post(url, {
			pageNo: 1,
			pageSize: 10,
			clientType: 5 //微信小程序
		}).then(res => {
			if (res.code == "200") {
				that.setData({
					adList: res.data.adList,
					categoryList: res.data.categoryList,
					miniSwitch:res.data.miniSwitch,
          ready:true
				});
			} else {
				console.log(res.message);
			}
		}).catch(e => { })

	},

	/**
     * 加载商品
     */
	loadShopGoods: function () {
		if (!this.data.haseNext) {
			return;
		}
		var that = this;
		var pageNo = that.data.pageNo + 1;
		var pageSize = that.data.pageSize;

		var url = "/shop/getGooods";
		api._post(url, {
			pageNo: pageNo,
			pageSize: pageSize,
			goodsQueryType: that.data.goodsQueryType,
		}).then(res => {
			if (res.code == "200") {
				if (res.data.shopGoodList.length > 0) {
					if (res.data.shopGoodList.length < 10) {
						//没有下一页了
						that.setData({
							haseNext: false,
						});
					}
					var shopGoodList = that.data.shopGoodList.concat(res.data.shopGoodList)
					that.setData({
						shopGoodList: shopGoodList,
						pageNo: pageNo,
						pageSize: pageSize,
					});
				} else {
					that.setData({
						haseNext: false,
					});
				}

			}
		}).catch(e => { })
	},

	changeTag: function (e) {
		var curIndex = e.currentTarget.dataset.index;
		if(curIndex==0){
			return
		}
		var arry =  this.data.subMenuList
		var goodsQueryType =arry[curIndex].contentType
		var name = arry[curIndex].name 
		console.log(name);
		wx.navigateTo({
			url: '/pages/store/list/goodsList?goodsQueryType='+goodsQueryType+"&name="+name
		})
	},

	goShopList:function(e){
		var curIndex = e.currentTarget.dataset.index;
		var arry = this.data.categoryList;
		console.log(arry);
		var contentType = arry[curIndex].id;
		var name = arry[curIndex].name
		wx.navigateTo({
			url: '/pages/store/list/goodsList?contentType='+contentType+"&name="+name
		})

	}

})