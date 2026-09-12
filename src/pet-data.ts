import type { PetEvolutionStage, PetSpeciesMeta } from './contracts/index.js';

/**
 * 学宠星球 12 级累计积分门槛 (0 到 12 级)
 * 对应阶段:
 * Lv 1-2: egg (蛋阶段)
 * Lv 3-4: baby (幼宠期)
 * Lv 5-6: growing (成长期)
 * Lv 7-8: mature (成熟期)
 * Lv 9-10: legendary (传说级)
 * Lv 11-12: transcendent (超凡归真)
 */
export const LEVEL_THRESHOLDS = [0, 15, 35, 60, 90, 125, 165, 210, 260, 315, 375, 450];

export const STAGE_NAMES: Record<PetEvolutionStage, string> = {
  egg: '元神之蛋',
  baby: '幼灵初醒',
  growing: '蓬勃成长',
  mature: '大成归位',
  legendary: '传说觉醒',
  transcendent: '超凡入圣',
};

/**
 * 根据学生累计积分计算学宠等级、进化阶段及下一级所需积分
 */
export function calculatePetStageAndLevel(totalScore: number): {
  level: number;
  stage: PetEvolutionStage;
  stageName: string;
  currentThreshold: number;
  nextThreshold: number;
  progressPercent: number;
} {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalScore >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  if (level > 12) level = 12;

  let stage: PetEvolutionStage = 'egg';
  if (level >= 11) stage = 'transcendent';
  else if (level >= 9) stage = 'legendary';
  else if (level >= 7) stage = 'mature';
  else if (level >= 5) stage = 'growing';
  else if (level >= 3) stage = 'baby';

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = level < 12 ? (LEVEL_THRESHOLDS[level] || 450) : 450;

  const diff = nextThreshold - currentThreshold;
  const gained = totalScore - currentThreshold;
  const progressPercent = level >= 12 ? 100 : Math.min(100, Math.max(0, Math.round((gained / (diff || 1)) * 100)));

  return {
    level,
    stage,
    stageName: STAGE_NAMES[stage],
    currentThreshold,
    nextThreshold,
    progressPercent,
  };
}

export interface PetSeriesDef {
  id: string;
  name: string;
  emoji: string;
  species: Array<{ id: string; name: string }>;
}

/**
 * 学宠星球 10 大系列与 125 种核心图鉴物种定义
 */
export const PET_SERIES: PetSeriesDef[] = [
  {
    id: 'myth',
    name: '山海经神兽',
    emoji: '🐉',
    species: [
      { id: 'zhulong', name: '烛龙' },
      { id: 'yinglong', name: '应龙' },
      { id: 'nine_tail_fox', name: '九尾狐' },
      { id: 'kunpeng', name: '鲲鹏' },
      { id: 'fenghuang', name: '凤凰' },
      { id: 'qilin', name: '麒麟' },
      { id: 'qiongqi', name: '穷奇' },
      { id: 'bifang', name: '毕方' },
      { id: 'pixiu', name: '貔貅' },
      { id: 'jingwei', name: '精卫' },
      { id: 'xiangliu', name: '相柳' },
      { id: 'xiezhi', name: '獬豸' },
      { id: 'qinglong', name: '青龙' },
      { id: 'baihu', name: '白虎' },
      { id: 'zhuque', name: '朱雀' },
      { id: 'xuanwu', name: '玄武' },
      { id: 'taotie', name: '饕餮' },
      { id: 'baize', name: '白泽' },
    ],
  },
  {
    id: 'pokemon',
    name: '宝可梦',
    emoji: '⚡',
    species: [
      { id: 'charmander', name: '小火龙→喷火龙' },
      { id: 'bulbasaur', name: '妙蛙种子→妙蛙花' },
      { id: 'squirtle', name: '杰尼龟→水箭龟' },
      { id: 'eevee', name: '伊布' },
      { id: 'pikachu', name: '皮卡丘' },
      { id: 'riolu', name: '利欧路→路卡利欧' },
      { id: 'ice_fox', name: '冰·霜翎狐' },
      { id: 'rock_rhino', name: '岩·岩甲犀' },
      { id: 'wind_falcon', name: '风·掠风隼' },
      { id: 'light_deer', name: '光·晨曦鹿' },
      { id: 'dark_panther', name: '暗·夜隐豹' },
      { id: 'steel_armadillo', name: '钢·磁甲兽' },
    ],
  },
  {
    id: 'national',
    name: '华夏国宝',
    emoji: '🐼',
    species: [
      { id: 'panda', name: '大熊猫' },
      { id: 'golden_monkey', name: '川金丝猴' },
      { id: 'south_china_tiger', name: '华南虎' },
      { id: 'tibetan_antelope', name: '藏羚羊' },
      { id: 'crested_ibis', name: '朱鹮' },
      { id: 'chinese_alligator', name: '扬子鳄' },
      { id: 'snow_leopard', name: '雪豹' },
      { id: 'baiji_dolphin', name: '白鱀豚' },
      { id: 'chinese_sturgeon', name: '中华鲟' },
      { id: 'takin', name: '羚牛' },
      { id: 'red_panda', name: '小熊猫' },
      { id: 'manul', name: '兔狲' },
    ],
  },
  {
    id: 'digimon',
    name: '数码宝贝',
    emoji: '🦖',
    species: [
      { id: 'agumon', name: '亚古兽' },
      { id: 'gabumon', name: '加布兽' },
      { id: 'patamon', name: '巴达兽' },
      { id: 'gatomon', name: '迪路兽' },
      { id: 'biyomon', name: '比丘兽' },
      { id: 'gomamon', name: '哥玛兽' },
    ],
  },
  {
    id: 'magic',
    name: '魔法奇幻',
    emoji: '🧙',
    species: [
      { id: 'gryphon', name: '狮鹫' },
      { id: 'pegasus', name: '天马' },
      { id: 'unicorn', name: '独角兽' },
      { id: 'dragon_ice', name: '霜翼巨龙' },
      { id: 'dragon_fire', name: '炎息巨龙' },
      { id: 'phoenix_light', name: '圣光不死鸟' },
      { id: 'basilisk', name: '幻影毒蜥' },
      { id: 'cerberus', name: '三头冥犬' },
      { id: 'siren', name: '海妖塞壬' },
      { id: 'chimera', name: '奇美拉' },
      { id: 'ent', name: '战争树人' },
      { id: 'behemoth', name: '比蒙巨兽' },
    ],
  },
  {
    id: 'prehistoric',
    name: '史前生物',
    emoji: '🦕',
    species: [
      { id: 'tyrannosaurus', name: '霸王龙' },
      { id: 'triceratops', name: '三角龙' },
      { id: 'velociraptor', name: '迅猛龙' },
      { id: 'pterosaur', name: '翼龙' },
      { id: 'mammoth', name: '猛犸象' },
      { id: 'smilodon', name: '剑齿虎' },
      { id: 'brachiosaurus', name: '腕龙' },
      { id: 'stegosaurus', name: '剑龙' },
      { id: 'ankylosaurus', name: '甲龙' },
      { id: 'spinosaurus', name: '棘龙' },
      { id: 'megalodon', name: '巨齿鲨' },
      { id: 'dodo', name: '渡渡鸟' },
    ],
  },
  {
    id: 'constellation',
    name: '星座守护 (圣斗士)',
    emoji: '♈',
    species: [
      { id: 'aries', name: '白羊座·穆' },
      { id: 'taurus', name: '金牛座·阿鲁迪巴' },
      { id: 'gemini', name: '双子座·撒加' },
      { id: 'cancer', name: '巨蟹座·迪斯马斯克' },
      { id: 'leo', name: '狮子座·艾奥里亚' },
      { id: 'virgo', name: '处女座·沙加' },
      { id: 'libra', name: '天秤座·童虎' },
      { id: 'scorpio', name: '天蝎座·米罗' },
      { id: 'sagittarius', name: '射手座·艾俄洛斯' },
      { id: 'capricorn', name: '摩羯座·修罗' },
      { id: 'aquarius', name: '水瓶座·卡妙' },
      { id: 'pisces', name: '双鱼座·阿布罗狄' },
    ],
  },
  {
    id: 'festival',
    name: '传统节日 (诗词)',
    emoji: '🏮',
    species: [
      { id: 'zongzi', name: '端午·汨罗灵粽 (屈原)' },
      { id: 'tangyuan', name: '元宵·琉璃华灯 (辛弃疾)' },
      { id: 'mooncake', name: '中秋·广寒玉兔 (苏轼)' },
      { id: 'spring_dragon', name: '二月二·潜渊苍龙' },
      { id: 'qingming_willow', name: '清明·烟雨翠柳 (杜牧)' },
      { id: 'qixi_magpie', name: '七夕·天河喜鹊 (秦观)' },
      { id: 'chongyang_chrysanthemum', name: '重阳·茱萸金菊 (王维)' },
      { id: 'laba_porridge', name: '腊八·福禄七宝' },
      { id: 'kitchen_god', name: '小年·司命灶灵' },
      { id: 'nian_beast', name: '除夕·迎春年兽' },
      { id: 'cold_food', name: '寒食·介子清节' },
      { id: 'summer_solstice', name: '夏至·日长蝉鸣' },
    ],
  },
  {
    id: 'qixia',
    name: '虹猫蓝兔七侠传',
    emoji: '⚔️',
    species: [
      { id: 'hongmao', name: '长虹剑主·虹猫' },
      { id: 'lantu', name: '冰魄剑主·蓝兔' },
      { id: 'shali', name: '紫云剑主·莎丽' },
      { id: 'doudu', name: '雨花剑主·逗逗' },
      { id: 'daben', name: '奔雷剑主·大奔' },
      { id: 'tiaotiao', name: '青光剑主·跳跳' },
      { id: 'dameng', name: '旋风剑主·达达' },
      { id: 'heixiaohu', name: '雷霆之怒·黑小虎' },
      { id: 'heixinhu', name: '天魔邪功·黑心虎' },
    ],
  },
  {
    id: 'dongfang',
    name: '东方神话 (封神西游)',
    emoji: '🪷',
    species: [
      { id: 'sun_wukong', name: '齐天大圣·孙悟空' },
      { id: 'nezha', name: '三坛海会·哪吒' },
      { id: 'erlang_shen', name: '清源妙道·杨戬' },
      { id: 'jiang_ziya', name: '执榜封神·姜子牙' },
      { id: 'leizhenzi', name: '风雷天羽·雷震子' },
      { id: 'daji', name: '红颜天狐·妲己' },
      { id: 'shen_gongbao', name: '飞头黑豹·申公豹' },
      { id: 'taishang_laojun', name: '开炉炼丹·太上老君' },
      { id: 'zhongkui', name: '万应判官·钟馗' },
      { id: 'lu_dongbin', name: '纯阳剑仙·吕洞宾' },
      { id: 'tieguai_li', name: '铁拐妙药·李凝阳' },
      { id: 'han_zhongli', name: '芭蕉化羽·钟离权' },
      { id: 'zhang_guolao', name: '倒骑神驴·张果老' },
      { id: 'lan_caihe', name: '花篮通玄·蓝采和' },
      { id: 'he_xiangu', name: '荷香出尘·何仙姑' },
      { id: 'han_xiangzi', name: '紫竹神笛·韩湘子' },
      { id: 'cao_guojiu', name: '阴阳玉板·曹国舅' },
      { id: 'king_bull', name: '大力牛魔王' },
      { id: 'red_boy', name: '火云圣婴·红孩儿' },
      { id: 'sha_wujing', name: '金身罗汉·沙悟净' },
    ],
  },
];

/**
 * 展平获取所有 125 个物种的元数据列表
 */
export function getAllPetSpecies(): PetSpeciesMeta[] {
  const result: PetSpeciesMeta[] = [];
  for (const series of PET_SERIES) {
    for (const sp of series.species) {
      result.push({
        id: sp.id,
        name: sp.name,
        seriesId: series.id,
        seriesName: series.name,
        emoji: series.emoji,
      });
    }
  }
  return result;
}
