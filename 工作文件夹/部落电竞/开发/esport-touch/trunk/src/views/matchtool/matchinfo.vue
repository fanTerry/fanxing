<template>
  <div class="Page" v-if='matchInfo'>
    <header class="mod_header">
      <nav-bar :pageTitle="'赛事信息'"></nav-bar>
    </header>
    <div class="main">
      <div class="match_bg" :style="'background-image: url('+matchInfo.gameImage+')'"></div>
      <match-info :matchInfo='matchInfo'></match-info>
    </div>
    <footer class="mod_footer">

    </footer>
  </div>
</template>

<script>
import navBar from "components/header/nav_bar/index.vue";
import matchInfo from "./components/matchinfo.vue";

export default {
  components: {
    navBar,
    matchInfo
  },
  props: [],
  data() {
    return {
      gameImage: null,
      toolMatchId: null, //查看比赛详情页面
      matchInfo: null
    };
  },
  mounted() {
    if (this.$route.query && this.$route.query.toolMatchId) {
      this.toolMatchId = this.$route.query.toolMatchId;
    }
    this.getMatchInfoById();
  },
  methods: {
    setBgImage(img) {
      this.gameImage = img;
    },
    getMatchInfoById() {
      this.$post("/api/matchtool/getMatchInfo", {
        matchId: this.toolMatchId
      })
        .then(rsp => {
          console.log(rsp, "rsp123");
          if (rsp.code == "200") {
            this.matchInfo = rsp.data;
            // this.$emit('setBgImage',rsp.data.gameImage)
          } else {
            this.$toast(rsp.message);
          }
        })
        .catch(error => {
          console.error(error);
        });
    }
  }
};
</script>

<style lang='scss' scoped>
@import "../../assets/common/_base";
@import "../../assets/common/_mixin";

.main {
  @extend .flex;
  flex-direction: column;
  -webkit-flex-direction: column;
  position: relative;
  background-color: #090709;
}

.match_bg {
  height: 31.4667vw;
  background-position: center top;
  background-repeat: no-repeat;
  background-size: 100% auto;
}

.match_info {
  flex: 1;
  -webkit-flex: 1;
  overflow-y: scroll;
  // -webkit-overflow-scrolling: touch;
  margin-top: -3.4667vw !important;
}
</style>
