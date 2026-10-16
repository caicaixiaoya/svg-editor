import { Case } from '../Case';

/** 规格书 §4.2 错误信息约定表逐条 + 语法类错误。 */
export const errorCases: Case[] = [
  new Case(
    'err-id-already-exists',
    ['init', 'create rect r1 0 0 10 10', 'create rect r1 1 1 10 10'],
    ['canvas 800x600 created', 'rect#r1 created', 'error: id already exists: r1'],
  ),
  new Case(
    'err-no-such-shape',
    ['init', 'delete r9'],
    ['canvas 800x600 created', 'error: no such shape: r9'],
  ),
  new Case(
    'err-in-missing-container',
    ['init', 'create rect a 0 0 1 1 in nope'],
    ['canvas 800x600 created', 'error: no such container: nope'],
  ),
  new Case(
    'err-in-not-a-container',
    ['init', 'create rect a 0 0 1 1', 'create rect b 0 0 1 1 in a'],
    ['canvas 800x600 created', 'rect#a created', 'error: not a container: a'],
  ),
  new Case(
    'err-unknown-shape-type',
    ['init', 'create hexagon h 0 0 1 1'],
    ['canvas 800x600 created', 'error: unknown shape type: hexagon (is the plugin loaded?)'],
  ),
  new Case(
    'err-box-not-in-this-phase',
    ['init', 'create box n1 0 0 10 10 "x"'],
    ['canvas 800x600 created', 'error: unknown shape type: box (is the plugin loaded?)'],
  ),
  new Case(
    'err-ungroup-leaf',
    ['init', 'create rect a 0 0 1 1', 'ungroup a'],
    ['canvas 800x600 created', 'rect#a created', 'error: not a container: a'],
  ),
  new Case(
    'err-ungroup-top-level',
    ['init', 'create g scene', 'ungroup scene'],
    ['canvas 800x600 created', 'g#scene created', 'error: cannot ungroup top-level container: scene'],
  ),
  new Case(
    'err-scale-not-positive',
    ['init', 'create rect a 0 0 1 1', 'scale a 0', 'scale a -2'],
    [
      'canvas 800x600 created',
      'rect#a created',
      'error: scale factor must be positive',
      'error: scale factor must be positive',
    ],
  ),
  new Case(
    'err-no-document',
    ['tree', 'create rect a 0 0 1 1', 'undo'],
    [
      `error: no document. use 'init' or 'read' first`,
      `error: no document. use 'init' or 'read' first`,
      `error: no document. use 'init' or 'read' first`,
    ],
  ),
  new Case(
    'err-cannot-read-file',
    ['read missing.svg'],
    ['error: cannot read file: missing.svg'],
  ),
  new Case(
    'err-cannot-write-file',
    ['init', 'save adir'],
    ['canvas 800x600 created', 'error: cannot write file: adir'],
  ),
  new Case(
    'err-duplicate-id-in-file',
    ['read dupid.svg'],
    ['error: duplicate id in file: x'],
  ),
  new Case(
    'err-invalid-xml',
    ['read bad.xml'],
    ['error: invalid XML in bad.xml: mismatched close tag: expected </unclosed>, got </svg>'],
  ),
  new Case(
    'err-not-an-svg-document',
    ['read nosvg.xml'],
    ['error: not an SVG document: nosvg.xml'],
  ),
  new Case(
    'err-unknown-attribute',
    [
      'init',
      'create rect a 0 0 1 1',
      'create g gr',
      'set a foo 1',
      'set a cx 5',
      'set a text "x"',
      'set gr x 5',
    ],
    [
      'canvas 800x600 created',
      'rect#a created',
      'g#gr created',
      'error: unknown attribute: foo',
      'error: unknown attribute: cx',
      'error: unknown attribute: text',
      'error: unknown attribute: x',
    ],
  ),
  new Case(
    'err-invalid-number',
    ['init', 'create rect a 0 0 1 1', 'move a 10 xx', 'create rect r 1 2 3 zz'],
    [
      'canvas 800x600 created',
      'rect#a created',
      'error: invalid number: xx',
      'error: invalid number: zz',
    ],
  ),
  new Case(
    'err-usage-and-unknown-command',
    [
      'init',
      'move a',
      'foo',
      'create text t 1 2 "abc',
      'create rect r 1 2 3',
      'create rect r 1 2 3 4 in',
      'group g1 a',
    ],
    [
      'canvas 800x600 created',
      'error: usage: move <id> <dx> <dy>',
      'error: unknown command: foo',
      'error: unterminated string',
      'error: usage: create rect <id> <x> <y> <w> <h> [fill]',
      `error: expected <containerId> after 'in'`,
      'error: usage: group <newGid> <id1> <id2>…',
    ],
  ),
];
