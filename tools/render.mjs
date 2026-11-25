// Renderiza uma janela "falsa" do VS Code com o tema Scriptorium aplicado
// via shiki (mesmo motor TextMate do VS Code). Uso:
//   node render.mjs <tema.json> <saida.html> <php|ts>
import { readFileSync, writeFileSync } from 'node:fs';
import { createHighlighter } from 'shiki';

const [themePath, outPath, which] = process.argv.slice(2);

const raw = readFileSync(themePath, 'utf8')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/,(\s*[}\]])/g, '$1');
const theme = { ...JSON.parse(raw), name: 'scriptorium' };
const c = theme.colors;

const samples = {
  php: {
    lang: 'php',
    file: 'CloseOrder.php',
    tree: ['app', '  Http', '  Models', '  Services', '    Orders', '      CloseOrder.php', '      PriceCalculator.php', 'config', 'routes', 'tests', 'composer.json', 'README.md'],
    active: 5,
    status: 'PHP',
    code: `<?php

namespace App\\Services\\Orders;

use App\\Models\\Order;
use Carbon\\Carbon;

/**
 * Closes the order and stores the discounted total.
 *
 * @param  array<string, mixed>  $data
 */
final class CloseOrder
{
    private const MAX_DISCOUNT = 0.15;

    public function __construct(
        private readonly PriceCalculator $calculator,
    ) {}

    public function handle(Order $order, array $data): Order
    {
        if ($order->closed) {
            throw new \\DomainException('Order already closed');
        }

        $discount = min($data['discount'] ?? 0, self::MAX_DISCOUNT);
        $total = $this->calculator->total($order->items, $discount);

        // Keep the timestamp for the daily report
        $order->fill([
            'total'     => $total,
            'closed_at' => Carbon::now(),
        ])->save();

        return $order;
    }
}`,
  },
  ts: {
    lang: 'ts',
    file: 'invoices.ts',
    tree: ['src', '  billing', '    invoices.ts', '    invoices.test.ts', '    money.ts', '  index.ts', 'package.json', 'tsconfig.json', 'README.md'],
    active: 2,
    status: 'TypeScript',
    code: `import { readFile } from 'node:fs/promises';
import { toCents } from './money';

export type Invoice = {
  id: string;
  total: number;
  paidAt?: Date;
};

const OVERDUE_DAYS = 30;

/**
 * Loads invoices from disk and returns the unpaid ones.
 * @param path JSON file with the invoices
 */
export async function unpaid(path: string): Promise<Invoice[]> {
  const raw = await readFile(path, 'utf8');
  const invoices: Invoice[] = JSON.parse(raw);

  // Ignore zero-value invoices
  return invoices.filter((invoice) => !invoice.paidAt && invoice.total > 0);
}

export class Reminder {
  constructor(private readonly days = OVERDUE_DAYS) {}

  isLate(invoice: Invoice, today = new Date()): boolean {
    const due = invoice.id.startsWith('X') ? 0 : this.days;
    return toCents(invoice.total) > 0 && due < today.getDate();
  }
}`,
  },
};

const s = samples[which];
const hl = await createHighlighter({ themes: [theme], langs: [s.lang] });
const { tokens } = hl.codeToTokens(s.code, { lang: s.lang, theme: 'scriptorium' });

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const style = (tk) => {
  const f = tk.fontStyle ?? 0;
  return `color:${tk.color}` + (f & 1 ? ';font-style:italic' : '') + (f & 2 ? ';font-weight:700' : '') + (f & 4 ? ';text-decoration:underline' : '');
};
const cursorLine = which === 'php' ? 27 : 18;
const lines = tokens.map((line, i) => {
  const n = i + 1;
  const html = line.map((tk) => `<span style="${style(tk)}">${esc(tk.content)}</span>`).join('');
  return `<div class="ln${n === cursorLine ? ' cur' : ''}"><span class="num">${n}</span><span class="code">${html || ' '}</span></div>`;
}).join('');

const tree = s.tree.map((t, i) => {
  const depth = t.match(/^ */)[0].length / 2;
  const name = t.trim();
  const isDir = !name.includes('.');
  return `<div class="item${i === s.active ? ' sel' : ''}" style="padding-left:${12 + depth * 14}px">${isDir ? '<span class="chev">›</span>' : '<span class="chev"></span>'}${name}</div>`;
}).join('');

const icon = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

writeFileSync(outPath, `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:1280px;height:800px;background:${c['editor.background']};font:13px "Segoe UI",system-ui,sans-serif;color:${c.foreground};overflow:hidden;display:grid;grid-template-rows:32px 1fr 24px}
.title{background:${c['titleBar.activeBackground']};border-bottom:1px solid ${c['titleBar.border']};display:flex;align-items:center;justify-content:center;color:${c['titleBar.inactiveForeground']};font-size:12px;position:relative}
.dots{position:absolute;left:14px;display:flex;gap:8px}.dots i{width:11px;height:11px;border-radius:50%;background:${c['statusBarItem.activeBackground']}}
.main{display:grid;grid-template-columns:48px 250px 1fr;min-height:0}
.act{background:${c['activityBar.background']};display:flex;flex-direction:column;align-items:center;padding-top:10px;gap:22px;color:${c['activityBar.inactiveForeground']}}
.act .on{color:${c['activityBar.foreground']};box-shadow:-13px 0 0 -11px ${c['activityBar.activeBorder']}}
.side{background:${c['sideBar.background']};color:${c['sideBar.foreground']};padding-top:10px}
.side h4{font-size:11px;font-weight:400;letter-spacing:.06em;color:${c['sideBarTitle.foreground']};padding:0 20px 10px}
.side h5{font-size:11px;font-weight:700;background:${c['sideBarSectionHeader.background']};color:${c['sideBarSectionHeader.foreground']};padding:4px 12px;margin-bottom:4px}
.item{height:24px;display:flex;align-items:center;gap:4px}.item.sel{background:${c['list.activeSelectionBackground']};color:${c['list.activeSelectionForeground']}}
.chev{width:12px;color:${c['editorLineNumber.activeForeground']};font-size:14px}
.ed{display:grid;grid-template-rows:36px 1fr;min-width:0}
.tabs{background:${c['editorGroupHeader.tabsBackground']};display:flex}
.tab{padding:0 18px;display:flex;align-items:center;color:${c['tab.inactiveForeground']}}.tab.on{background:${c['tab.activeBackground']};color:${c['tab.activeForeground']}}
.src{font:13px/22px "JetBrains Mono",monospace;padding-top:10px;white-space:pre;overflow:hidden}
.ln{display:flex}.num{width:62px;padding-right:22px;text-align:right;color:${c['editorLineNumber.foreground']};flex:none}
.cur{background:${c['editor.lineHighlightBackground']}}.cur .num{color:${c['editorLineNumber.activeForeground']}}
.cur .code::after{content:"";display:inline-block;width:2px;height:17px;vertical-align:-3px;background:${c['editorCursor.foreground']}}
.status{background:${c['statusBar.background']};border-top:1px solid ${c['statusBar.border']};color:${c['statusBar.foreground']};display:flex;align-items:center;font-size:12px;gap:16px;padding-right:14px}
.remote{background:${c['statusBarItem.remoteBackground']};color:${c['statusBarItem.remoteForeground']};height:100%;display:flex;align-items:center;padding:0 12px}
.grow{flex:1}
</style></head><body>
<div class="title">Scriptorium</div>
<div class="main">
  <div class="act">
    <span class="on">${icon('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>')}</span>
    <span>${icon('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>')}</span>
    <span>${icon('<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 8v8M18 10c0 4-6 3-10 6.5"/>')}</span>
    <span>${icon('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>')}</span>
  </div>
  <div class="side"><h4>EXPLORER</h4><h5>PROJECT</h5>${tree}</div>
  <div class="ed">
    <div class="tabs"><div class="tab on">${s.file}</div><div class="tab">README.md</div></div>
    <div class="src">${lines}</div>
  </div>
</div>
<div class="status"><span class="remote">⌁ WSL</span><span>main</span><span class="grow"></span><span>Ln ${cursorLine}, Col 9</span><span>Spaces: 4</span><span>UTF-8</span><span>${s.status}</span></div>
</body></html>`);
console.log('ok', outPath);
