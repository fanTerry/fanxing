// component/bigimageswiper/bigimage-swiper.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    duration: Number,
    indicatorColor: String,
    indicatorActiveColor: String,
    swiperArray: Array,
    curText: String,
		styleObject:String,
    mode:String,
    flag:Boolean, //是否需要显示标题
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  attached() { },
  ready() {
    // 初始化文本数据
    var swiperArr = this.properties.swiperArray;
    if (swiperArr.length>0){
        this.setData({curText: swiperArr[0].title});
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {

      onSwiperChange: function (evt) {
          // 切换时更新文本数据
          var curIndex = evt.detail.current;
          var swiperArr = this.properties.swiperArray;
          this.setData({curText: swiperArr[curIndex].title});
      },

      goDetailPage: function (e) {
          var curIndex = e.currentTarget.dataset.index;
          console.log(curIndex)
          var swiperArr = this.properties.swiperArray;
          console.log("轮播图跳转")
          wx.navigateTo({
              url: swiperArr[curIndex].location
          });
      }

  }
})
