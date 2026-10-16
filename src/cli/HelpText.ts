/** help 命令的静态文本。 */
export class HelpText {
  static lines(): string[] {
    return [
      'document',
      '  init [w] [h]              新建空画布（默认 800x600）',
      '  read <file.svg>           读入 SVG 文件为当前文档（缺 id 自动补齐）',
      '  save [file.svg]           保存当前文档（无参数存回读入路径）',
      '  canvas [w] [h]            无参数显示画布尺寸；带参数修改',
      'shape editing (undoable)',
      '  create <type> <id> [params…] [in <containerId>]',
      '                            创建图形，可选 in 子句直接指定父容器',
      '    rect    <id> <x> <y> <w> <h> [fill]',
      '    circle  <id> <cx> <cy> <r> [fill]',
      '    ellipse <id> <cx> <cy> <rx> <ry> [fill]',
      '    line    <id> <x1> <y1> <x2> <y2> [stroke]',
      '    text    <id> <x> <y> "content"',
      '    g       <id>',
      '  delete <id>               删除图形（容器连同全部子孙）',
      '  move <id> <dx> <dy>       平移（增量）；容器整体平移',
      '  scale <id> <factor>       等比缩放（位置与尺寸同乘）；容器递归',
      '  set <id> <attr> <value>   设置属性（几何属性 / fill / stroke /',
      '                            stroke-width / text 内容）',
      '  group <newGid> <id1> <id2>…  新建容器并收入若干图形',
      '  ungroup <gid>             解散容器（子图形提升到父级原位置）',
      '  addto <gid> <id>          把已有图形移入容器（作为最后一个子节点）',
      '  front <id> / back <id>    调整 z-order（同级最前/最后）',
      'display (not undoable)',
      '  tree [id]                 结构树（默认全文档）',
      '  show <id>                 单个图形的属性明细',
      '  help                      显示本帮助',
      'history',
      '  undo / redo               撤销/重做；io 命令后禁止，直到新编辑解禁',
      'misc',
      '  exit                      退出（EOF 亦可）',
      '  # 开头的行是注释；带空格的参数用双引号包裹',
    ];
  }
}
