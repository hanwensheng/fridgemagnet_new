/* eslint-disable no-undef */
// 原生自定义 TabBar（小程序专用）—— 绕开 Taro/React 渲染层，选中态走微信原生 setData
// 每个 tab 页 onShow 时由 useTabBar 调 this.getTabBar().setData({ selected }) 同步

var ICONS = {};
ICONS.home =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTguODA5NTcgMi4xMjU5OEM5LjUxNjY5IDEuNjAyMjkgMTAuNDgzMyAxLjYwMjI5IDExLjE5MDQgMi4xMjU5OEwxNy4xOTA0IDYuNTcwMzFDMTcuNjk5NiA2Ljk0NzQ5IDE4IDcuNTQ0MDcgMTggOC4xNzc3M1YxNy4xODc1QzE4IDE4LjE4ODUgMTcuMTg4NSAxOSAxNi4xODc1IDE5QzE1LjE4NjUgMTkgMTQuMzc1IDE4LjE4ODUgMTQuMzc1IDE3LjE4NzVWMTUuMjIyN0MxNC4zNzUgMTMuMDEzNSAxMi41ODQxIDExLjIyMjcgMTAuMzc1IDExLjIyMjdIOS42MjVDNy40MTU4NiAxMS4yMjI3IDUuNjI1IDEzLjAxMzUgNS42MjUgMTUuMjIyN1YxNy4xODc1QzUuNjI1IDE4LjE4ODUgNC44MTM1MSAxOSAzLjgxMjUgMTlDMi44MTE0OCAxOSAyIDE4LjE4ODUgMiAxNy4xODc1VjguMTc3NzNDMi4wMDAwMyA3LjU0NDA3IDIuMzAwMzggNi45NDc0OSAyLjgwOTU3IDYuNTcwMzFMOC44MDk1NyAyLjEyNTk4WiIgc3Ryb2tlPSIjMUMxQzFFIiBzdHJva2Utb3BhY2l0eT0iMC40IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cg==';
ICONS.home_active =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTguODA5NTQgMC44ODE4MTlDOS41MTY3NCAwLjM1Nzk3MSAxMC40ODMzIDAuMzU3OTcxIDExLjE5MDUgMC44ODE4MTlMMTguMTkwNSA2LjA2N0MxOC42OTk3IDYuNDQ0MiAxOSA3LjA0MDQxIDE5IDcuNjc0MTJWMThDMTkgMTkuMTA0NiAxOC4xMDQ2IDIwIDE3IDIwSDE1LjM3NUMxNC4yNzA0IDIwIDEzLjM3NSAxOS4xMDQ2IDEzLjM3NSAxOFYxNC4yMjIyQzEzLjM3NSAxMy4xMTc3IDEyLjQ3OTYgMTIuMjIyMiAxMS4zNzUgMTIuMjIyMkg4LjYyNUM3LjUyMDQzIDEyLjIyMjIgNi42MjUgMTMuMTE3NyA2LjYyNSAxNC4yMjIyVjE4QzYuNjI1IDE5LjEwNDYgNS43Mjk1NyAyMCA0LjYyNSAyMEgzQzEuODk1NDMgMjAgMSAxOS4xMDQ2IDEgMThWNy42NzQxMkMxIDcuMDQwNDEgMS4zMDAzMyA2LjQ0NDIgMS44MDk1NCA2LjA2N0w4LjgwOTU0IDAuODgxODE5WiIgZmlsbD0iIzFDMUMxRSIvPgo8L3N2Zz4K';
ICONS.mine =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzI5MF8zMzUpIj4KPHBhdGggZD0iTTE2LjI3NTQgMTguMDAxVjIwLjAwMUgzLjcyNDYxVjE4LjAwMUgxNi4yNzU0Wk0xOCAxNi4yNzY0QzE4IDE1LjQ2OTMgMTcuNDYwMiAxNC44Mzg1IDE2Ljc2NTYgMTQuNzAxMkMxNC42NzMxIDE0LjI4NzcgMTEuOTcxOCAxMy44NTI1IDEwIDEzLjg1MjVDOC4wMjgyIDEzLjg1MjUgNS4zMjY5MyAxNC4yODc3IDMuMjM0MzggMTQuNzAxMkMyLjUzOTggMTQuODM4NSAyIDE1LjQ2OTQgMiAxNi4yNzY0QzIuMDAwMjQgMTcuMjI4OSAyLjc3MjYyIDE4LjAwMSAzLjcyNDYxIDE4LjAwMVYyMC4wMDFDMS42Njc3NCAyMC4wMDEgMC4wMDAyNDA0NjcgMTguMzMzMiAwIDE2LjI3NjRDMCAxNC41NjQyIDEuMTY3MDEgMTMuMDcxMyAyLjg0NjY4IDEyLjczOTNDNC45NTA4NyAxMi4zMjM0IDcuODE3NDUgMTEuODUyNSAxMCAxMS44NTI1QzEyLjE4MjYgMTEuODUyNSAxNS4wNDkxIDEyLjMyMzQgMTcuMTUzMyAxMi43MzkzQzE4LjgzMyAxMy4wNzEyIDIwIDE0LjU2NDIgMjAgMTYuMjc2NEMxOS45OTk4IDE4LjMzMzIgMTguMzMyMyAyMC4wMDEgMTYuMjc1NCAyMC4wMDFWMTguMDAxQzE3LjE2ODEgMTguMDAxIDE3LjkwMjkgMTcuMzIyMSAxNy45OTEyIDE2LjQ1MjFMMTggMTYuMjc2NFpNMTMuMzgzOCA1LjE4NTU1QzEzLjM4MzggMy40OTY3MSAxMS45NCAyIDkuOTk5MDIgMkM4LjA1ODUgMi4wMDAyMSA2LjYxNTIzIDMuNDk2NTYgNi42MTUyMyA1LjE4NTU1QzYuNjE1MzQgNi44NzQ1NSA4LjA1ODY3IDguMzcwODggOS45OTkwMiA4LjM3MTA5QzExLjkzOTkgOC4zNzEwOSAxMy4zODM3IDYuODc0NCAxMy4zODM4IDUuMTg1NTVaTTE1LjM4MzggNS4xODU1NUMxNS4zODM3IDguMDQ5MjUgMTIuOTcyOCAxMC4zNzExIDkuOTk5MDIgMTAuMzcxMUM3LjAyNTQzIDEwLjM3MDkgNC42MTUzNCA4LjA0OTEyIDQuNjE1MjMgNS4xODU1NUM0LjYxNTIzIDIuMzIxODkgNy4wMjUzNiAwLjAwMDIxMzE2NCA5Ljk5OTAyIDBDMTIuOTcyOSAwIDE1LjM4MzggMi4zMjE3NSAxNS4zODM4IDUuMTg1NTVaIiBmaWxsPSIjMUMxQzFFIiBmaWxsLW9wYWNpdHk9IjAuNCIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzI5MF8zMzUiPgo8cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==';
ICONS.mine_active =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzIxMl8zNDMpIj4KPHBhdGggZD0iTTEwIDExLjg1MjVDMTIuMTgyNiAxMS44NTI1IDE1LjA0OTEgMTIuMzIzNCAxNy4xNTMzIDEyLjczOTNDMTguODMzIDEzLjA3MTIgMjAgMTQuNTY0MiAyMCAxNi4yNzY0QzE5Ljk5OTggMTguMzMzMiAxOC4zMzIzIDIwLjAwMSAxNi4yNzU0IDIwLjAwMUgzLjcyNDYxQzEuNjY3NzQgMjAuMDAxIDAuMDAwMjQwNDY3IDE4LjMzMzIgMCAxNi4yNzY0QzAgMTQuNTY0MiAxLjE2NzAxIDEzLjA3MTMgMi44NDY2OCAxMi43MzkzQzQuOTUwODcgMTIuMzIzNCA3LjgxNzQ1IDExLjg1MjUgMTAgMTEuODUyNVpNOS45OTkwMiAwQzEyLjk3MjkgMCAxNS4zODM4IDIuMzIxNzUgMTUuMzgzOCA1LjE4NTU1QzE1LjM4MzcgOC4wNDkyNSAxMi45NzI4IDEwLjM3MTEgOS45OTkwMiAxMC4zNzExQzcuMDI1NDMgMTAuMzcwOSA0LjYxNTM0IDguMDQ5MTIgNC42MTUyMyA1LjE4NTU1QzQuNjE1MjMgMi4zMjE4OSA3LjAyNTM2IDAuMDAwMjEzMTY0IDkuOTk5MDIgMFoiIGZpbGw9IiMxQzFDMUUiLz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMF8yMTJfMzQzIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=';

var TABS = [
  { pagePath: '/pages/index/index', icon: ICONS.home, activeIcon: ICONS.home_active },
  { pagePath: '/pages/mine/index', icon: ICONS.mine, activeIcon: ICONS.mine_active },
];

// 点击切换时同步记下的目标 tab。tabbar 实例是按页创建的，新页的实例在 attached 时读它，
// 就能让"首帧"直接画对高亮 —— 不依赖页面栈、也不依赖任何生命周期时序（由点击方负责写）。
var tappedIndex = -1;

Component({
  data: {
    // 不要写死 0：tabbar 实例第一次创建时（第一次切到某个 tab 页），初值会先被渲染一帧，
    // 写死 0 就会先亮"首页"再跳到目标页 —— 就是"切到我的时高亮闪一下"的根因。
    // -1 = 未定，首帧两个 tab 都画非激活态，不会出现错误高亮。
    selected: -1,
    // 首页打开"制作"抽屉时会把 TabBar 收起来（页面侧直接 setData 控制）
    hidden: false,
    tabs: TABS,
  },

  attached: function () {
    var self = this;
    // 本次实例就是点击切页带来的（新页首次创建）：直接用点击时的目标，首帧即正确
    if (tappedIndex >= 0) {
      this.setData({ selected: tappedIndex });
    }
    // 兜底：attached 的 setData 可能晚于首帧，且此刻页面栈可能还停在上一个 tab 页
    wx.nextTick(function () {
      self.syncFromRoute();
    });
  },

  pageLifetimes: {
    // 页面每次显示都按页面栈校正一次：原生时机，比 Taro 层的 useDidShow 更早，且不依赖其渲染层时序
    show: function () {
      this.syncFromRoute();
    },
  },

  methods: {
    // 按当前页面栈算选中态（幂等：值没变就不 setData）
    syncFromRoute: function () {
      var pages = getCurrentPages();
      var top = pages[pages.length - 1];
      var route = top && top.route ? '/' + top.route : '';
      var index = -1;
      for (var i = 0; i < TABS.length; i++) {
        if (TABS[i].pagePath === route) {
          index = i;
          break;
        }
      }
      if (index >= 0 && index !== this.data.selected) {
        this.setData({ selected: index });
      }
    },

    switchTab: function (e) {
      var index = Number(e.currentTarget.dataset.index);
      if (index === this.data.selected) return;
      // 先记下目标：目标页 tabbar 实例可能是本次切换才创建的，它靠这个值保证首帧高亮正确
      tappedIndex = index;
      this.setData({ selected: index });
      wx.switchTab({ url: TABS[index].pagePath });
    },
  },
});
