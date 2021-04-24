// component/newslist/news-list.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    newsDataList: Array, canShowVideo: Boolean, selectedTag:Number
  },

  /**
   * 组件的初始数据
   */
  data: {
      videoIndex: null,
  },

  /**
   * 组件的方法列表
   */
  methods: {

      onMyPlay:function (e) {

          console.log("选择播放的video:"+ e.detail.aricleId);
          if (this.data.videoIndex==null){
              this.setData({
                  videoIndex: e.detail.aricleId,
              })
          } else if(this.data.videoIndex ==e.detail.aricleId){

          } else {
              console.log("停止视频",this.data.videoIndex);
              this.selectComponent('#video-'+this.data.videoIndex).puaseVideo()
              this.setData({
                  videoIndex: e.detail.aricleId,
              })
          }
      }


  }
})
