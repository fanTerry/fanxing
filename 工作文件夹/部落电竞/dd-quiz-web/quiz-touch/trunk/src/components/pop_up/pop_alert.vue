<template>
  <div class="ui_pop" v-if='showPop'>
    <div class="contact_customService" v-if='type==1'>
      <slot></slot>
      <div class="btn_con">
        <a class="confirm_btn" @click="close()">确定</a>
      </div>
    </div>
    <div class="contact_customService" v-if='type==2'>
      <slot></slot>
      <div class="btn_con">
        <a @click="close()">{{btnTxt1?btnTxt1:'取消'}}</a>
        <a class="confirm_btn" @click="confirm()">{{btnTxt2?btnTxt2:'确定'}}</a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    showPop: Boolean,
    type: String,
    btnTxt1: String,
    btnTxt2: String
  },
  data() {
    return {};
  },
  methods: {
    close() {
      this.$emit("close");
    },
    confirm() {
      this.$emit("confirm");
    }
  },
  components: {}
};
</script>

<style lang='scss' scoped>
@import "../../assets/common/_mixin";
@import "../../assets/common/_base";
.contact_customService {
  width: 270px;
  border-radius: 8px;
  background-color: #fff;
  p {
    line-height: 52px;
    font-size: 15px;
    color: #333;
    text-align: center;
  }
  .btn_con {
    @extend .flex_hc;
    a {
      flex: 1;
      -webkit-flex: 1;
      line-height: 52px;
      font-size: 17px;
      color: #333;
      text-align: center;
      @include getBorder(top, #ddd);
      &:first-child {
        position: relative;
        &::after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 1px;
          background-color: #ddd;
          transform: scaleX(0.5);
        }
      }
      &:last-child {
        &::after {
          display: none;
        }
      }
    }
    .confirm_btn {
      color: #fea21b;
    }
  }
}
</style>
