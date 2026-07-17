export default {
  pages: ['pages/splash/index', 'pages/index/index', 'pages/mine/index'],
  subPackages: [
    {
      root: 'pages-sub',
      name: 'pages-sub',
      pages: [
        'editor/index',
        'editor-crop/index',
        'order-confirm/index',
        'my-orders/index',
        'order-detail/index',
        'logistics-detail/index',
        'customer-service/index',
        'address/index',
        'add-address/index',
        'edit-profile/index',
        'draft/index',
        'merchant-promoter/index',
        'promoter-agreement/index',
      ],
    },
  ],
  requiredPrivateInfos: ['chooseAddress'],
  lazyCodeLoading: 'requiredComponents',
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
