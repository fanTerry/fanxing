<template>
  <div class="swiper-container">
    <ul class="swiper-wrapper">
      <li class="swiper-slide" @click="goUrlPage(item.location)" v-for="(item,index) in adList " :key="index">
        <img :src="item.picUrl" alt="">
      </li>
    </ul>
    <div class="swiper-pagination"></div>
  </div>
</template>

<script>
import Swiper from "swiper";

export default {
  components: {},
  props: ["adList"],
  data() {
    return {
      swiper: null
    };
  },
  mounted() {
    this.$nextTick(() => {
      // console.log(newValue.length, 111111111111111111111);
      this.initSwiper();
    });
  },
  methods: {
    initSwiper() {
      this.swiper = new Swiper(".swiper-container", {
        pagination: ".swiper-pagination",
        loop: true,
        speed: 1000,
        autoplay: 3000,
        autoplayDisableOnInteraction: false,
        observer: true
      });
    },
    goUrlPage(url) {
      window.open(url, "_self");
    }
  }
};
</script>

<style lang='scss' scoped>
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

