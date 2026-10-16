# svg-editor（Lab1 Phase 1：SVG 编辑器 CLI）

TypeScript + OOP 实现的 SVG 编辑器 REPL：六种图形（rect/circle/ellipse/line/text/g）、
容器组合、创建时 `in` 归属 / 事后 `group` / `addto` 移动、z-order、属性白名单、
undo/redo（io 边界语义）、SVG 读写（缺 id 自动补齐）、`tree`/`show` 文本显示。

```bash
npm install
npm run cli        # 启动 REPL（先自动构建）
npm test           # golden 回放测试（40 例）
npm run check:deps # 依赖方向检查（架构一致性）
```

架构设计、过程记录、一致性自查与质量保证见 **[doc/README.md](doc/README.md)**。

快速体验（把命令存成脚本回放）：

```bash
npm run cli <<'EOF'
init 800 600
create rect bg 0 0 800 600 #ffffff
create text title 20 40 "My Diagram"
create circle c1 100 100 20 red
group markers c1
tree
save demo.svg
EOF
```

保存出的 `.svg` 可直接拖进浏览器查看。
