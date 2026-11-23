/* 新增前缀库存（来自用户提供的前缀表，按词库实际词形匹配） */
window.YANCI_MORPH_EXTRA = [
  [
    "abs",
    "ab-, abs-",
    [
      "abs"
    ],
    "加在词根前，表示相反，变坏，离去等",
    "如abuse 滥用（ab+use用→用坏→滥用）"
  ],
  [
    "amphi",
    "amphi-",
    [
      "amphi"
    ],
    "两个，两种",
    "如amphibian 两栖动物（amphi+bi生命+an→两个生命→两栖动物）"
  ],
  [
    "ana",
    "ana-",
    [
      "ana"
    ],
    "错误，在旁边，分开",
    "如analysis 分析（ana+lysis分开→分开来→分析）"
  ],
  [
    "ante",
    "ante-",
    [
      "ante"
    ],
    "前面，先",
    "如antedate 提前写日期；先于，早于（ante+date日期→提前写日期）"
  ],
  [
    "anthrop",
    "anthrop(o)-",
    [
      "anthrop",
      "anthropo"
    ],
    "人，人类",
    "如anthropology 人类学（anthropo+logy学者）"
  ],
  [
    "dem",
    "dem(o)",
    [
      "dem",
      "demo"
    ],
    "人民（1）",
    "如democracy 民主；民主政治，民主政体；民主主义（demo+cracy统治→人民统治→人民做主）"
  ],
  [
    "popul",
    "popul-",
    [
      "popul"
    ],
    "人民（2）",
    "如popular 流行的; 大众的；受欢迎的; 通俗的（popul+ar...的）"
  ],
  [
    "andr",
    "andr(o)-",
    [
      "andr",
      "andro"
    ],
    "男（1）",
    "如androgyne 具有男妇两性的人，阴阳人（andro+gyn女人）"
  ],
  [
    "vir",
    "vir-",
    [
      "vir"
    ],
    "男（2）",
    "如virile 男的，男性的，有男子气概的（vir+ile形容词词尾…的）"
  ],
  [
    "fem",
    "fem/ femin",
    [
      "fem",
      "femin"
    ],
    "女（1）",
    "如female 女性的，妇女的；女子"
  ],
  [
    "gyn",
    "gyn(o)-/ gynec(o)-",
    [
      "gyn",
      "gyno",
      "gynec",
      "gyneco"
    ],
    "女（2）",
    "如gynecian 妇女的，妇人的（gynec+ian…的）"
  ],
  [
    "bene",
    "bene-",
    [
      "bene"
    ],
    "善，好",
    "如benediction 祝福（bene+dict说+ion→说好话）"
  ],
  [
    "counter",
    "counter-",
    [
      "counter"
    ],
    "反对，相反",
    "如counteract 对抗；抵消（counter+act行为→反着行动→对抗）"
  ],
  [
    "patr",
    "patr(i)- / pater-",
    [
      "patr",
      "patri",
      "part",
      "parto",
      "pater"
    ],
    "父；祖",
    "patriarch 家长；族长。"
  ],
  [
    "matr",
    "matr(i)-/mater-/metro-",
    [
      "matr",
      "matri",
      "mater",
      "metro"
    ],
    "母",
    "如maternal 母亲的，母性的（matr+n+al…的）"
  ],
  [
    "dia",
    "dia-",
    [
      "dia"
    ],
    "穿过，二者之间",
    "如dialogue 对话（dia+logue话→两人之间的话）"
  ],
  [
    "dif",
    "dif-",
    [
      "dif"
    ],
    "和辅音重复表示不，否定，分开",
    "如diffuse 散布的，散开的（dif+fusc流→分开流→散布的）"
  ],
  [
    "dys",
    "dys-",
    [
      "dys"
    ],
    "坏，不良",
    "如dyspepsia 消化不良（dys+peps消化；胃+ia病→消化不好）"
  ],
  [
    "hypo",
    "hypo-",
    [
      "hypo"
    ],
    "下面，次等",
    "如hypothesis 假说，假设（hypo+thesis论文→还不是正式的理论→假说）"
  ],
  [
    "homo",
    "homo-",
    [
      "homo"
    ],
    "同类的",
    "如homogeneous 同类的；同族的（homo+gen产生+eous形容词后缀···的→产生相同的）"
  ],
  [
    "intro",
    "intro-",
    [
      "intro"
    ],
    "向内，入内",
    "如introspect 内省，反省（(intro+pect看→向内看→内省）"
  ],
  [
    "mini",
    "mini-",
    [
      "mini"
    ],
    "小",
    "如miniskirt 超短裙（mini+skirt裙子）"
  ],
  [
    "neo",
    "neo-",
    [
      "neo"
    ],
    "新的",
    "如neonatal新生的,被生的（neo+natal出生的）"
  ],
  [
    "omni",
    "omni-",
    [
      "omni"
    ],
    "全部.到处",
    "如omnipresent 无所不在的（omni+present出现的）"
  ],
  [
    "paleo",
    "paleo-",
    [
      "paleo"
    ],
    "古，旧",
    "如paleozoology 古动物学（paleo+zoology动物学）"
  ],
  [
    "pseudo",
    "pseudo-",
    [
      "pseudo"
    ],
    "假；伪",
    "pseudoscience 伪科学。"
  ],
  [
    "iso",
    "iso-",
    [
      "iso"
    ],
    "等，同",
    "如isogeny同源（iso+geny产生→共同产生→同源）"
  ],
  [
    "kilo",
    "kilo-",
    [
      "kilo"
    ],
    "一千",
    "如kilometer 公里（kilo+meter米→一千米，公里）"
  ],
  [
    "meta",
    "meta-",
    [
      "meta"
    ],
    "超过，改变",
    "如metapsy 超心理学，灵学（meta+psych心灵+ology学科）"
  ],
  [
    "milli",
    "milli-",
    [
      "milli"
    ],
    "千，千分之一",
    "如millimeter 毫米（milli+meter→千分之一米）"
  ],
  [
    "octa",
    "octa-/ octo-",
    [
      "octa",
      "octo"
    ],
    "八",
    "如octagon 八角形（octa+gon角）"
  ],
  [
    "penta",
    "penta-",
    [
      "penta"
    ],
    "五",
    "如pentagon 五角形；五角大楼（penta+gon角）"
  ],
  [
    "quadri",
    "quadri-/ quadru-",
    [
      "quadri",
      "quadru"
    ],
    "四",
    "如quadricycle 四轮车（quadri+cycle轮子）"
  ],
  [
    "quasi",
    "quasi-",
    [
      "quasi"
    ],
    "类似，准",
    "如quasi-official 半官方的"
  ],
  [
    "cata",
    "cata-",
    [
      "cata"
    ],
    "向下，相反，离开",
    "如catalog 目录（cata向下+log说→在下面要说的话→目录）"
  ],
  [
    "deca",
    "deca-",
    [
      "deca"
    ],
    "十",
    "如decameter 十米（deca+meter米）"
  ],
  [
    "deci",
    "deci-",
    [
      "deci"
    ],
    "十分之一",
    "如decimeter 十分之一米（deci+meter米）"
  ],
  [
    "demi",
    "demi-",
    [
      "demi"
    ],
    "半",
    "如demi-fixed 半固定的（demi+fix固定）"
  ],
  [
    "endo",
    "endo-",
    [
      "endo"
    ],
    "内部",
    "如endogenous 内生的，自生的（endo+gen产生+ous→内部产生的）"
  ],
  [
    "hecto",
    "hecto-",
    [
      "hecto"
    ],
    "百，许多",
    "如hectowatt 一百瓦（hecto+watt瓦）"
  ],
  [
    "hemi",
    "hemi-",
    [
      "hemi"
    ],
    "半",
    "如hemicycle 半圆形（hemi+cycle圆，循环）"
  ],
  [
    "hepta",
    "hepta-",
    [
      "hepta"
    ],
    "七",
    "如heptagon 七角形（hepta+gon角）"
  ],
  [
    "hexa",
    "hexa-",
    [
      "hexa"
    ],
    "六",
    "如hexagon 六角形（hexa+gon角）"
  ],
  [
    "holo",
    "holo-",
    [
      "holo"
    ],
    "全部",
    "如holography 全息摄影（holo+graphy写→全部写下→全息摄影）"
  ],
  [
    "sus",
    "sus-",
    [
      "sus"
    ],
    "在…下面",
    "如suspect 怀疑（sus+pect看→在下面看一看→怀疑）"
  ],
  [
    "sym",
    "sym-/ syn-",
    [
      "sym",
      "syn"
    ],
    "共同，相同",
    "如sympathy 同情（sym+pathy感情）"
  ],
  [
    "suc",
    "suc- / suf- / sup-",
    [
      "suc",
      "suf",
      "sup"
    ],
    "在…下面",
    "在同辅音词根前表示在下面。"
  ],
  [
    "sept",
    "sept-/ septi-",
    [
      "sept",
      "septi"
    ],
    "七",
    "如septangle 七角形（sept+angle角）"
  ],
  [
    "sex",
    "sex-",
    [
      "sex"
    ],
    "六",
    "如sexangle 六角形（sex+angle角）"
  ],
  [
    "step",
    "step-",
    [
      "step"
    ],
    "后，继或前夫(妻)所生",
    "如stepfather 继父"
  ],
  [
    "stereo",
    "stereo-",
    [
      "stereo"
    ],
    "立体",
    "如sterograph 立体照片（stereo+graph写，照片）"
  ],
  [
    "supra",
    "supra-",
    [
      "supra"
    ],
    "超….",
    "如supranatonal 超国家的"
  ],
  [
    "tetra",
    "tetra-",
    [
      "tetra"
    ],
    "四",
    "如tetragon 四角形（tetra+gon角）"
  ],
  [
    "twi",
    "twi-",
    [
      "twi"
    ],
    "二，两",
    "如twilight 黎明，黄昏（twi+light光→黑白光交替）"
  ],
  [
    "vice",
    "vice-",
    [
      "vice"
    ],
    "副",
    "如vice-president 副总统"
  ],
  [
    "with",
    "with-",
    [
      "with"
    ],
    "向后，相反",
    "如withdraw 撤消，撤退（with+draw拉→向相反拉→撤退）"
  ]
];
