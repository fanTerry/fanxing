<template>
  <div class="shake_icon" :class="{'active':dragFlag,'left_stop':leftOffset}" @click="goGameShake()"></div>
</template>

<script>
import { convertObjToUrlParam } from "../../../../libs/utils";
export default {
  components: {},
  props: [],
  data() {
    return {
      dragFlag: false,
      leftOffset: false
    };
  },
  mounted() {
    this.drag();
  },
  methods: {
    drag() {
      var that = this;
      let maxW = document.body.clientWidth;
      let maxH = document.body.clientHeight;
      // document.querySelector("body").style.width = maxW;
      let target = document.querySelector(".shake_icon");
      let startX = 0;
      let startY = 0;
      console.log(target.clientWidth);
      target.addEventListener("touchstart", function(e) {
        startX = e.targetTouches[0].pageX - this.offsetLeft;
        startY = e.targetTouches[0].pageY - this.offsetTop;
      });
      target.addEventListener("touchmove", function(e) {
        e.preventDefault();
        let leftX = e.targetTouches[0].pageX - startX;
        let topY = e.targetTouches[0].pageY - startY;
        let thisW = e.targetTouches[0].target.clientWidth;
        let thisH = e.targetTouches[0].target.clientHeight;
        console.log(thisW, thisH);
        if (leftX > 0 || leftX >= maxW - thisW) {
          that.dragFlag = true;
        }

        if (leftX <= 0) {
          leftX = 0;
        }

        if (leftX >= maxW - thisW) {
          leftX = maxW - thisW;
        }

        if (topY <= 0) {
          topY = 0;
        }

        if (topY >= maxH - thisH) {
          topY = maxH - thisH;
        }

        if (leftX <= 0 || leftX >= maxW - thisW) {
          that.dragFlag = false;
          that.leftOffset = false;
          if (leftX <= 0) {
            that.leftOffset = true;
          }
        }

        this.style.left = leftX + "px";
        this.style.top = topY + "px";
      });
      target.addEventListener("touchend", function(e) {});
    },
    goGameShake() {
      let param = convertObjToUrlParam(this.$route.query);
      window.location.href = "/game/shake?roomNo=100102&" + param;
      // this.$router.push({
      //   name: "gameShake",
      //   query: {
      //     roomNo: 100102
      //   }
      // });
    }
  }
};
</script>

<style lang='scss' scoped>
@import "../../../../assets/common/_mixin";
@import "../../../../assets/common/_base";

.shake_icon {
  position: fixed;
  right: 0;
  bottom: 35.2vw;
  z-index: 999;
  width: 16.5333vw;
  height: 16.5333vw;
  // padding: 1.6vw;
  // box-sizing: content-box;
  background-color: #ae2a23;
  box-shadow: 0 0 4.6667vw 0 rgba(0, 0, 0, 0.5);
  border-radius: 8.2667vw 0 0 8.2667vw;
  &::before {
    content: "";
    @extend .g_c_mid;
    bottom: 1.6vw;
    width: 14.4vw;
    height: 17.0667vw;
    @include getBgImg("../../../../assets/images/game/shake/shake_icon.png");
    background-size: contain;
  }
  &.left_stop {
    border-radius: 0 8.2667vw 8.2667vw 0;
  }
  &.active {
    border: none;
    background-color: transparent;
    box-shadow: none;
  }
}
</style>
