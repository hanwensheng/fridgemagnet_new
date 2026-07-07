export default {
  pages: [
    'pages/index/index',
    'pages/splash/index',
    'pages/editor/index',
    'pages/editor-crop/index',
    'pages/mine/index',
    'pages/customer-service/index',
    'pages/address/index',
    'pages/add-address/index',
    'pages/edit-profile/index',
  ],
  requiredPrivateInfos: ['chooseAddress'],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '冰箱贴',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom',
  },
  tabBar: {
    custom: true,
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/mine/index', text: '我的' },
    ],
  },
};
