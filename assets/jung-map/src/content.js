import { STATION_IDS } from './layout.js';

const TEXT_FIELDS = ['id', 'name_zh', 'name_en', 'kind', 'jung_concept', 'source', 'my_take', 'suggestion', 'motion'];

export function validateContent(data) {
  const errors = [];
  const st = data && data.stations;
  if (!Array.isArray(st) || st.length !== STATION_IDS.length) {
    return { ok: false, errors: [`stations 必须是 ${STATION_IDS.length} 项`] };
  }
  st.forEach((s, i) => {
    if (s.id !== STATION_IDS[i]) errors.push(`第 ${i + 1} 站 id 应为 ${STATION_IDS[i]}`);
    for (const f of TEXT_FIELDS) {
      // 发布版会把未确认站点的个人表述置空，所以这两个字段仅在 confirmed 为 false 时允许为空
      const mayBeEmpty = (f === 'my_take' || f === 'suggestion') && s.confirmed === false;
      if (typeof s[f] !== 'string' || (!s[f].trim() && !mayBeEmpty)) errors.push(`${s.id}.${f} 缺失或为空`);
    }
    if (!Array.isArray(s.keyframes) || s.keyframes.some(k => typeof k !== 'string')) errors.push(`${s.id}.keyframes 必须是字符串列表`);
    if (s.kind !== 'jung-concept' && s.kind !== 'narrative-theme') errors.push(`${s.id}.kind 必须是 jung-concept 或 narrative-theme`);
    const minEmo = s.emotions_confirmed === false ? 0 : 1; // 发布版会把未确认的情绪词置为 []
    if (!Array.isArray(s.emotions) || s.emotions.length < minEmo || s.emotions.length > 5 || s.emotions.some(e => typeof e !== 'string' || !e.trim())) {
      errors.push(`${s.id}.emotions 必须是 ${minEmo}–5 个非空字符串`);
    }
    if (typeof s.emotions_confirmed !== 'boolean') errors.push(`${s.id}.emotions_confirmed 不是布尔值`);
    if (typeof s.confirmed !== 'boolean') errors.push(`${s.id}.confirmed 不是布尔值`);
    if (typeof s.source_verified !== 'boolean') errors.push(`${s.id}.source_verified 不是布尔值`);
    for (const f of ['jung_concept_en', 'source_en', 'my_take_en', 'suggestion_en'])   // 英文字段可选；给了就必须是非空字符串
      if (f in s && (typeof s[f] !== 'string' || !s[f].trim())) errors.push(`${s.id}.${f} 必须是非空字符串`);
  });
  return { ok: errors.length === 0, errors };
}

export function publicView(data, { draft = false } = {}) {
  return data.stations.map(s => {
    const base = s.confirmed ? s : { ...s, my_take: '', suggestion: '' };
    return draft || s.emotions_confirmed === true ? base : { ...base, emotions: [] };
  });
}

export async function loadContent(url, { draft = false } = {}) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`内容加载失败：${res.status}`);
  const data = await res.json();
  const v = validateContent(data);
  if (!v.ok) throw new Error(`内容校验失败：${v.errors.join('；')}`);
  return publicView(data, { draft });
}
