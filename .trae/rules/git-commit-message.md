---
description: Git 提交信息使用简体中文
alwaysApply: true
scene: git_message
---

# Git 提交信息规范

所有 Git 提交信息必须使用简体中文撰写。

## 提交信息格式

```
<类型>: <简短描述>

<详细说明（可选）>
```

## 类型前缀

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响逻辑）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具/依赖更新

## 示例

```
feat: 添加用户登录功能

fix: 修复购物车数量显示错误

docs: 更新 README 使用说明

refactor: 重构订单状态管理逻辑
```