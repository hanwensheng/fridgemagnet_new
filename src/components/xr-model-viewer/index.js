/* eslint-disable no-undef */
Component({
  properties: {
    modelSrc: {
      type: String,
      value: '',
      observer: 'onModelSrcChange',
    },
    scale: {
      type: String,
      value: '100 100 100',
    },
    position: {
      type: String,
      value: '0 0 0',
    },
    width: {
      type: Number,
      value: 0,
    },
    height: {
      type: Number,
      value: 0,
    },
  },

  data: {
    cameraPos: '0 0 10',
    currentModelId: '',
  },

  lifetimes: {
    attached() {
      // 不再标记首次加载，observer 直接生效
    },
  },

  methods: {
    handleSceneReady(e) {
      const scene = e.detail && e.detail.value;
      if (scene) {
        this.scene = scene;
        if (this.data.modelSrc) {
          this.loadModel(this.data.modelSrc);
        }
      }
    },

    handleTouchStart() {
      this.stopSwing();
    },

    onModelSrcChange(newVal) {
      if (newVal && this.scene) {
        // 切换前停止摆动
        this.stopSwing();
        this.loadModel(newVal);
      }
    },

    resetCamera() {
      if (!this.scene) return;
      const xrSystem = wx.getXrFrameSystem();
      const camera = this.scene.getElementById('camera');
      if (!camera) return;
      const camTransform = camera.getComponent(xrSystem.Transform);
      if (!camTransform) return;
      camTransform.position.x = 0;
      camTransform.position.y = 0;
      camTransform.position.z = 10;
    },

    stopSwing() {
      this._swingStopped = true;
      if (this._swingTimer) {
        cancelAnimationFrame(this._swingTimer);
        this._swingTimer = null;
      }
    },

    loadModel(src) {
      if (!this.scene || !src) return;
      const assetId = 'model-' + Date.now();
      this._currentAssetId = assetId;

      const result = this.scene.assets.loadAsset({
        type: 'gltf',
        assetId,
        src,
      });

      if (result && result.then) {
        result
          .then(() => {
            if (this._currentAssetId === assetId) {
              this.setData({ currentModelId: assetId });
            }
          })
          .catch((err) => {
            console.error('[xr-model-viewer] 模型加载失败:', err);
          });
      }
    },

    handleGLTFLoaded(e) {
      this.triggerEvent('modelloaded', { detail: e.detail });
      this.startAutoSwing();
    },

    startAutoSwing() {
      if (!this.scene) return;
      if (this._swingTimer) {
        cancelAnimationFrame(this._swingTimer);
      }
      const xrSystem = wx.getXrFrameSystem();
      const camera = this.scene.getElementById('camera');
      if (!camera) return;

      const camTransform = camera.getComponent(xrSystem.Transform);
      if (!camTransform) return;

      // 先重置相机到默认位置，消除之前滑动的影响
      camTransform.position.x = 0;
      camTransform.position.y = 0;
      camTransform.position.z = 10;

      const maxAngle = 20;
      const radius = 10;
      const startTime = Date.now();
      const totalSwing = 2000;
      let lastSetX = 0;

      const swing = () => {
        if (this._swingStopped) return;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalSwing, 1);
        const angle = Math.sin(progress * Math.PI * 2) * maxAngle * (1 - progress);
        const rad = (angle * Math.PI) / 180;

        const expectedX = Math.sin(rad) * radius;
        const expectedZ = Math.cos(rad) * radius;

        if (progress > 0.05 && Math.abs(camTransform.position.x - lastSetX) > 0.01) {
          return;
        }

        camTransform.position.x = expectedX;
        camTransform.position.y = 0;
        camTransform.position.z = expectedZ;
        lastSetX = expectedX;

        if (progress < 1) {
          this._swingTimer = requestAnimationFrame(swing);
        }
      };

      this._swingStopped = false;
      this._swingTimer = requestAnimationFrame(swing);
    },
  },

  detached() {
    this.stopSwing();
  },
});
