import Vue from 'vue';
import Vuex from 'vuex';
import user from './modules/user';
import homeIndex from './modules/homeIndex';
import shopOrderAddress from './modules/shopOrderAddress';
import bet from './modules/bet';
import mutations from './constStorage/mutations';
import getters from './constStorage/getters';
import matchTool from './modules/matchTool';

Vue.use(Vuex);
const state = {
    latitude: '', // 当前位置纬度
    longitude: '', // 当前位置经度
    searchAddress: null, // 搜索并选择的地址
    userCenterInfo: null, // 用户中心
    myExchangeTab: null,
    myGoodlistParam: null // 记录存放商品列表页面参数，返回使用
};

export default new Vuex.Store({
    modules: {
      user,
      homeIndex,
      shopOrderAddress,
      bet,
      matchTool,
  },
    mutations,
    getters
});