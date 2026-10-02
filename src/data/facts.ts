import type { Bi } from '../i18n';

export type FactId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12';

export interface Fact {
  id: FactId;
  text: Bi;
  /** Numeral shown in display type, if any. Must also appear in text. */
  figure?: string;
  scope: string;
  source: string;
  /** YYYY-MM-DD */
  confirmed: string;
  public: boolean;
}

const RESUME = '《何彦钧_通用基准参考简历》2026-09-19';

export const FACTS: Record<FactId, Fact> = {
  F1: { id: 'F1', text: { zh: '从 HR 数据整理出发，探索 AI 在办公、个人工具和影像创作中的应用。', en: 'Starting from HR data work, I explore how AI fits into office workflows, personal tools and film-making.' }, scope: '自我介绍', source: '用户采纳（评审 v2）', confirmed: '2026-09-28', public: true },
  F2: { id: 'F2', text: { zh: '上海立信会计金融学院 · 行政管理本科 · 2027 届', en: 'Shanghai Lixin University of Accounting and Finance · BA in Public Administration · Class of 2027' }, scope: '教育', source: RESUME, confirmed: '2026-09-19', public: true },
  F3: { id: 'F3', text: { zh: '可立即到岗 · 每周 5 天 · 可连续实习 3 个月以上', en: 'Available now · 5 days a week · 3+ months' }, scope: '求职条件', source: '用户（本次对话，更正此前的"4–5 天"，与中文简历一致）', confirmed: '2026-09-28', public: true },
  F4: { id: 'F4', text: { zh: '专业排名前 5%（获校级奖学金）', en: 'Top 5% of major (university scholarship)' }, scope: '教育；用户 2026-09-28 要求不在网站和英文简历上展示', source: RESUME, confirmed: '2026-09-28', public: false },
  F5: { id: 'F5', text: { zh: '丹纳赫（上海）企业管理有限公司 · HR 与人才数据实习生 · 2026.03—2026.06', en: 'Danaher (Shanghai) Enterprise Management Co., Ltd. · HR & Talent Data Intern · 2026.03—2026.06' }, scope: '实习；派遣单位为薪得付信息技术（上海）有限公司，派遣服务期至 2026.07，同一段实习', source: RESUME, confirmed: '2026-09-19', public: true },
  F6: { id: 'F6', figure: '2000', text: { zh: '核查约 2000 名员工的档案主数据 · 所在 CDP 系统覆盖 6,000+ 员工', en: 'Reviewed master records for about 2000 employees · in a CDP system covering 6,000+ staff' }, scope: '个人工作范围（约 2000 名）与系统规模（6,000+）分开写', source: '用户确认"约 2000 名员工"与"逾 2000 条关键字段"都成立', confirmed: '2026-09-28', public: true },
  F7: { id: 'F7', figure: '8', text: { zh: '8 张业务表', en: '8 business tables' }, scope: '课程设计的数据库规模，只出现在 SQL 项目', source: 'legacy/assets/delivery-schema.sql（8 条 CREATE TABLE）', confirmed: '2026-09-28', public: true },
  F8: { id: 'F8', figure: '23', text: { zh: '60 秒成片完成：出片 23 段，成片用 22 段', en: '60-second film finished: 23 clips generated, 22 in the cut' }, scope: '成片状态；出片数与成片所用镜头数同时出现', source: 'edit_60s.py 的 SHOTS（22 镜）与 origin/main 90cd241（23 段分镜视频 + 成片）', confirmed: '2026-10-02', public: true },
  F9: { id: 'F9', text: { zh: '校级大学生创新创业项目一等奖（项目组长）', en: 'First Prize, university student innovation programme (team lead)' }, scope: '研究项目', source: RESUME, confirmed: '2026-09-19', public: true },
  F10: { id: 'F10', text: { zh: 'CET-6 550 分', en: 'CET-6: 550' }, scope: '教育', source: RESUME, confirmed: '2026-09-19', public: true },
  F11: { id: 'F11', text: { zh: '2026.08 至今', en: '2026.08 – present' }, scope: '求职 Agent 项目时间', source: RESUME, confirmed: '2026-09-19', public: true },
  F12: { id: 'F12', text: { zh: '2024.03—2024.07', en: '2024.03—2024.07' }, scope: 'AI 校园研究项目时间', source: RESUME, confirmed: '2026-09-19', public: true },
};

export function fact(id: FactId): Fact {
  return FACTS[id];
}

/** Text and figures of every public fact in both languages; used to police numbers on pages. */
export function factCorpus(): string {
  return Object.values(FACTS).filter(f => f.public).flatMap(f => [f.text.zh, f.text.en, f.figure ?? '']).join('\n');
}
