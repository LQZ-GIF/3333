/* ============================================================
   研词 YANCI — 词库数据
   108 个考研英语一高频词，按构词法、同义辨析与形近词组织。
   数据为静态离线资源，可直接用浏览器打开。
   ============================================================ */
(function () {
  'use strict';

  const themes = {
    society:    { id: 'society',    label: '社会',   en: 'SOCIETY',     desc: '社会议题、公共讨论与制度' },
    technology: { id: 'technology', label: '科技',   en: 'TECHNOLOGY',  desc: '技术创新、自动化与未来' },
    education:  { id: 'education',  label: '教育',   en: 'EDUCATION',   desc: '学习、研究与人才培养' },
    environment:{ id: 'environment',label: '环境',   en: 'ENVIRONMENT', desc: '生态、资源与可持续发展' },
    culture:    { id: 'culture',    label: '文化',   en: 'CULTURE',     desc: '传统、表达与身份认同' },
    self:       { id: 'self',       label: '成长',   en: 'SELF',        desc: '选择、心态与个人发展' }
  };

  const affixes = [
    { id: 'pre', type: 'prefix', label: 'pre-', meaning: 'before · 在…之前', note: '表示时间或位置在前，常带“预先、提前”的意味。', examples: ['predict', 'prejudice', 'preliminary', 'premature'] },
    { id: 'pro', type: 'prefix', label: 'pro-', meaning: 'forward · 向前', note: '向前推出，引申为促进、主张、突出。', examples: ['promote', 'prospect', 'proceed', 'provoke'] },
    { id: 're', type: 'prefix', label: 're-', meaning: 'back / again · 回、再', note: '既可表示“返回”，也可表示“重新、反复”。', examples: ['reveal', 'revise', 'resist', 'retain'] },
    { id: 'con', type: 'prefix', label: 'con- / com-', meaning: 'together · 共同', note: '放在 b、m、p 前常写作 com-，表示聚合、共同。', examples: ['consensus', 'comprehensive', 'confront', 'consolidate'] },
    { id: 'sub', type: 'prefix', label: 'sub-', meaning: 'under · 在下', note: '在下面、次级、替代，也可引申为“暗中”。', examples: ['subtle', 'submit', 'substitute', 'subsequent'] },
    { id: 'trans', type: 'prefix', label: 'trans-', meaning: 'across · 穿过', note: '跨越、转移、从一方到另一方。', examples: ['transform', 'transmit', 'transparent', 'transcend'] },
    { id: 'dis', type: 'prefix', label: 'dis-', meaning: 'apart / not · 分开、否定', note: '表示分离、相反、去除，语气比单纯否定更强。', examples: ['dismiss', 'distort', 'disperse', 'distinguish'] },
    { id: 'inter', type: 'prefix', label: 'inter-', meaning: 'between · 在…之间', note: '强调双方或多方之间的互动与联系。', examples: ['intervene', 'interpret', 'integrate', 'interact'] },
    { id: 'overunder', type: 'prefix', label: 'over- / under-', meaning: 'above / below · 过度、不足', note: '一对高频方向前缀：over- 过度，under- 不足或在下方。', examples: ['overlook', 'overcome', 'undermine', 'underestimate'] },
    { id: 'ex', type: 'prefix', label: 'e- / ex-', meaning: 'out · 向外', note: '向外、超出、排除；有时 e- 是 ex- 的缩略形式。', examples: ['evoke', 'exceed', 'exclude', 'exploit'] },
    { id: 'negation', type: 'prefix', label: 'un- / in- / im-', meaning: 'not · 否定', note: '最常见的否定前缀；in- 在 m、p 前变为 im-。', examples: ['unprecedented', 'inevitable', 'impartial', 'indifferent'] },
    { id: 'tion', type: 'suffix', label: '-tion / -sion', meaning: 'n. 行为、状态、结果', note: '动词变名词的高频后缀，考研阅读中极为常见。', examples: ['innovation', 'assumption', 'perception', 'implication'] },
    { id: 'ity', type: 'suffix', label: '-ity', meaning: 'n. 性质、状态', note: '形容词变抽象名词，常表示某种性质或程度。', examples: ['ambiguity', 'diversity', 'integrity', 'vulnerability'] },
    { id: 'ize', type: 'suffix', label: '-ize / -ify', meaning: 'v. 使…化、使成为', note: '构成动词，表示“使变得……、使具有……”。', examples: ['emphasize', 'prioritize', 'stabilize', 'clarify'] },
    { id: 'ous', type: 'suffix', label: '-ous', meaning: 'adj. 充满…的', note: '形容词后缀，常表示具有某种显著特征。', examples: ['ambiguous', 'conspicuous', 'rigorous', 'tedious'] },
    { id: 'ive', type: 'suffix', label: '-ive', meaning: 'adj. 有…性质的', note: '构成形容词，也可名词化表示人或物。', examples: ['exclusive', 'sensitive', 'innovative', 'persuasive'] },
    { id: 'ent', type: 'suffix', label: '-ent / -ant', meaning: 'adj. / n. …的、…者', note: '常见形容词或名词后缀，重音与拼写需一起记。', examples: ['consistent', 'persistent', 'reluctant', 'relevant'] },
    { id: 'al', type: 'suffix', label: '-al', meaning: 'adj. …的', note: '名词变形容词的常用后缀，也可构成抽象名词。', examples: ['conventional', 'controversial', 'crucial', 'fundamental'] },
    { id: 'able', type: 'suffix', label: '-able / -ible', meaning: 'adj. 能…的', note: '表示“可以被……的、具有……能力的”。', examples: ['remarkable', 'sustainable', 'viable'] },
    { id: 'ment', type: 'suffix', label: '-ment', meaning: 'n. 行为、结果、状态', note: '动词变名词，常表示行为的过程或结果。', examples: ['enhancement', 'commitment', 'judgment'] }
  ];

  const roots = [
    { id: 'dict', type: 'root', label: 'dict', meaning: '说', note: '来自拉丁语 dicere（说）。预先说出是 predict，反着说是 contradict。', examples: ['predict', 'contradict'] },
    { id: 'spect', type: 'root', label: 'spect / spic', meaning: '看', note: '看前方是 prospect，引人注目的是 conspicuous。', examples: ['prospect', 'conspicuous'] },
    { id: 'mit', type: 'root', label: 'mit / miss', meaning: '送、放出', note: '把人或信息送出去：submit、transmit、dismiss。', examples: ['submit', 'transmit', 'dismiss', 'commitment'] },
    { id: 'sist', type: 'root', label: 'sist / st', meaning: '站立', note: '站住是 resist，站在一起是 consist，坚持是 persist。', examples: ['resist', 'consistent', 'persistent'] },
    { id: 'ven', type: 'root', label: 'ven / vent', meaning: '来', note: '来到中间是 intervene，大家一起来的惯例是 conventional。', examples: ['intervene', 'conventional'] },
    { id: 'vers', type: 'root', label: 'vers / vert', meaning: '转', note: '转向不同方向，引申为多样、争议与转变。', examples: ['diversity', 'controversial'] },
    { id: 'ten', type: 'root', label: 'ten / tain', meaning: '握住、保持', note: '握住不放是 retain，能保持下去是 sustainable。', examples: ['retain', 'sustainable'] },
    { id: 'clud', type: 'root', label: 'clud / clus', meaning: '关闭', note: '关在外面是 exclude，把别人关在外面的特权是 exclusive。', examples: ['exclude', 'exclusive'] },
    { id: 'nov', type: 'root', label: 'nov', meaning: '新', note: '新的东西是 innovation，带来新意的是 innovative。', examples: ['innovation', 'innovative'] },
    { id: 'jud', type: 'root', label: 'jud / jur', meaning: '判断、法律', note: '提前判断易成 prejudice，审慎判断才是 judgment。', examples: ['prejudice', 'judgment'] },
    { id: 'sens', type: 'root', label: 'sens / sent', meaning: '感觉', note: '共同的感觉形成 consensus，敏感则是 sensitive。', examples: ['consensus', 'sensitive'] },
    { id: 'sta', type: 'root', label: 'sta / stat', meaning: '站立、稳定', note: '站得住是 stable，大量而坚实是 substantial。', examples: ['stabilize', 'substantial'] }
  ];

  const W = (word, phonetic, pos, meaning, en, extra) => Object.assign({
    id: word,
    word: word,
    phonetic: phonetic,
    pos: pos,
    meaning: meaning,
    en: en
  }, extra);

  const words = [
    /* ---------------- pre- ---------------- */
    W('predict', '/prɪˈdɪkt/', 'v.', '预测；预言', 'to say that an event will happen in the future', {
      freq: 5, level: 'core', theme: 'technology', affixIds: ['pre'], root: { id: 'dict', label: 'dict', meaning: '说' },
      morph: [{ text: 'pre-', type: 'prefix', gloss: 'before 预先' }, { text: 'dict', type: 'root', gloss: 'say 说' }],
      rootNote: 'pre-（预先）+ dict（说）→ 预先说出 → 预测。',
      example: 'Economists predict that automation will eliminate some jobs while creating others that demand higher skills.',
      exampleZh: '经济学家预测，自动化会淘汰一些工作，同时创造出要求更高技能的新工作。',
      collocations: ['predict the outcome', 'accurately predict', 'predict a trend'],
      synonyms: [
        { word: 'forecast', note: '多用于天气、经济等基于数据的预测。' },
        { word: 'foresee', note: '强调凭洞察力预见，不强调数据。' }
      ],
      confusables: [
        { word: 'prevent', note: 'prevent 是“阻止”，pre- 之后是 vent（来），不要与 dict 混淆。' }
      ]
    }),
    W('preserve', '/prɪˈzɜːv/', 'v.', '保护；保存；维持', 'to keep something in its original state or good condition', {
      freq: 5, level: 'core', theme: 'environment', affixIds: ['pre'], root: { id: 'serv', label: 'serv', meaning: '保持、守护' },
      morph: [{ text: 'pre-', type: 'prefix', gloss: 'before 预先' }, { text: 'serv', type: 'root', gloss: 'keep 保持' }],
      rootNote: 'pre-（预先）+ serv（保持）→ 提前保护起来 → 保存。',
      example: 'Local communities are trying to preserve traditional crafts before they disappear altogether.',
      exampleZh: '当地社区正努力在传统手工艺彻底消失之前将其保存下来。',
      collocations: ['preserve tradition', 'preserve the environment', 'well-preserved'],
      synonyms: [
        { word: 'conserve', note: '侧重节约、保护资源，常与 energy、water 搭配。' },
        { word: 'maintain', note: '侧重维持现有状态，不一定有“保护免受破坏”之意。' }
      ],
      confusables: [
        { word: 'reserve', note: 'reserve 是“预订；保留”，re- 表示“留到以后”。' }
      ]
    }),
    W('prevail', '/prɪˈveɪl/', 'v.', '盛行；占优势；获胜', 'to be common at a particular time or place, or to win', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['pre'], root: { id: 'val', label: 'val', meaning: '强、价值' },
      morph: [{ text: 'pre-', type: 'prefix', gloss: 'before 在前' }, { text: 'vail', type: 'root', gloss: 'be strong 强' }],
      rootNote: 'pre-（在前）+ val（强）→ 力量在前 → 占上风、盛行。',
      example: 'In many workplaces, the belief that longer hours equal greater productivity still prevails.',
      exampleZh: '在许多职场中，工作时间越长等于生产力越高的观念仍然盛行。',
      collocations: ['prevail over', 'prevailing view', 'prevail upon'],
      synonyms: [
        { word: 'dominate', note: '强调支配地位，语气比 prevail 更强。' },
        { word: 'triumph', note: '强调战胜对手，多用于竞争或冲突。' }
      ],
      confusables: [
        { word: 'prevent', note: 'prevent 是“阻止”，拼写只差中间部分，含义完全不同。' }
      ]
    }),
    W('prejudice', '/ˈpredʒudɪs/', 'n. / v.', '偏见；使有偏见', 'an unfair opinion formed without enough knowledge', {
      freq: 5, level: 'core', theme: 'society', affixIds: ['pre'], root: { id: 'jud', label: 'jud', meaning: '判断' },
      morph: [{ text: 'pre-', type: 'prefix', gloss: 'before 预先' }, { text: 'jud', type: 'root', gloss: 'judge 判断' }, { text: '-ice', type: 'suffix', gloss: 'n. 状态' }],
      rootNote: 'pre-（预先）+ jud（判断）→ 还没了解就下判断 → 偏见。',
      example: 'Prejudice often hides in everyday assumptions rather than in open hostility.',
      exampleZh: '偏见往往藏在日常假设里，而不是公开的敌意中。',
      collocations: ['racial prejudice', 'prejudice against', 'without prejudice'],
      synonyms: [
        { word: 'bias', note: '更中性，可指统计或判断中的系统性偏差。' },
        { word: 'discrimination', note: '侧重基于偏见的区别对待，常涉及行为。' }
      ],
      confusables: [
        { word: 'prejudge', note: 'prejudge 是动词“预先判断”，prejudice 多作名词“偏见”。' }
      ]
    }),
    W('preliminary', '/prɪˈlɪmɪnəri/', 'adj. / n.', '初步的；预备的；初步措施', 'coming before a more important action or event', {
      freq: 4, level: 'hard', theme: 'education', affixIds: ['pre'], root: { id: 'limin', label: 'limin', meaning: '门槛' },
      morph: [{ text: 'pre-', type: 'prefix', gloss: 'before 之前' }, { text: 'limin', type: 'root', gloss: 'threshold 门槛' }, { text: '-ary', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'pre-（之前）+ limin（门槛）→ 进门之前 → 初步的。',
      example: 'The preliminary findings suggest that small class sizes improve long-term academic outcomes.',
      exampleZh: '初步研究结果表明，小班教学能改善长期学业表现。',
      collocations: ['preliminary findings', 'preliminary stage', 'preliminary study'],
      synonyms: [
        { word: 'initial', note: '强调“最初的”，不一定有“为后续做准备”之意。' },
        { word: 'preparatory', note: '强调为正式活动做准备的。' }
      ],
      confusables: [
        { word: 'previous', note: 'previous 是“先前的”，不强调预备性质。' }
      ]
    }),
    W('prerequisite', '/ˌpriːˈrekwəzɪt/', 'n. / adj.', '先决条件；必备的', 'something that must exist before something else can happen', {
      freq: 3, level: 'hard', theme: 'education', affixIds: ['pre'], root: { id: 'quisit', label: 'quisit', meaning: '寻求' },
      morph: [{ text: 'pre-', type: 'prefix', gloss: 'before 预先' }, { text: 'requisite', type: 'root', gloss: 'required 必需的' }],
      rootNote: 'pre-（预先）+ requisite（必需之物）→ 先决条件。',
      example: 'Critical thinking is a prerequisite for meaningful participation in public debate.',
      exampleZh: '批判性思维是真正参与公共讨论的先决条件。',
      collocations: ['a prerequisite for', 'essential prerequisite', 'meet a prerequisite'],
      synonyms: [
        { word: 'precondition', note: '几乎同义，更强调“前提条件”。' },
        { word: 'requirement', note: '范围更广，可指规定或要求。' }
      ],
      confusables: [
        { word: 'requisite', note: 'requisite 是“必需的”，prerequisite 强调“事先必备”。' }
      ]
    }),
    W('precedent', '/ˈpresɪdənt/', 'n.', '先例；判例', 'an earlier action or decision that is used as an example for later ones', {
      freq: 3, level: 'hard', theme: 'society', affixIds: ['pre'], root: { id: 'ced', label: 'ced', meaning: '走' },
      morph: [{ text: 'pre-', type: 'prefix', gloss: 'before 在前' }, { text: 'ced', type: 'root', gloss: 'go 走' }, { text: '-ent', type: 'suffix', gloss: 'n. 物' }],
      rootNote: 'pre-（在前）+ ced（走）→ 走在前面的事 → 先例。',
      example: 'The court ruling set a precedent that could shape privacy law for decades.',
      exampleZh: '这项法院裁决开创了一个可能影响隐私法数十年的先例。',
      collocations: ['set a precedent', 'legal precedent', 'without precedent'],
      synonyms: [
        { word: 'example', note: '普通用词，precedent 更正式，多用于法律与决策。' },
        { word: 'instance', note: '指具体事例，不强调“可供后人援引”。' }
      ],
      confusables: [
        { word: 'president', note: 'president 是“总统；校长”，拼写只差一个字母，是经典形近词。' }
      ]
    }),
    W('premature', '/ˌpreməˈtʃʊə(r)/', 'adj.', '过早的；不成熟的', 'happening before the proper or expected time', {
      freq: 3, level: 'hard', theme: 'self', affixIds: ['pre'], root: { id: 'matur', label: 'matur', meaning: '成熟' },
      morph: [{ text: 'pre-', type: 'prefix', gloss: 'before 过早' }, { text: 'mature', type: 'root', gloss: 'ripe 成熟' }],
      rootNote: 'pre-（过早）+ mature（成熟）→ 还没成熟就发生 → 过早的。',
      example: 'It would be premature to celebrate the reform before its long-term effects are clear.',
      exampleZh: '在改革的长期效果明朗之前就庆祝，还为时过早。',
      collocations: ['premature conclusion', 'premature death', 'premature to say'],
      synonyms: [
        { word: 'hasty', note: '强调仓促、欠考虑，主观色彩更强。' },
        { word: 'untimely', note: '强调时机不对，可指过早或不合时宜。' }
      ],
      confusables: [
        { word: 'mature', note: 'mature 是“成熟的”，加上 pre- 才表示“过早、不成熟”。' }
      ]
    }),

    /* ---------------- pro- ---------------- */
    W('proceed', '/prəˈsiːd/', 'v.', '继续进行；前进', 'to continue doing something that has already started', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['pro'], root: { id: 'ced', label: 'ced', meaning: '走' },
      morph: [{ text: 'pro-', type: 'prefix', gloss: 'forward 向前' }, { text: 'ceed', type: 'root', gloss: 'go 走' }],
      rootNote: 'pro-（向前）+ ceed（走）→ 向前走 → 继续进行。',
      example: 'The committee will proceed with the investigation despite mounting political pressure.',
      exampleZh: '尽管政治压力不断增大，委员会仍将继续进行调查。',
      collocations: ['proceed with', 'proceed to do', 'proceed as planned'],
      synonyms: [
        { word: 'advance', note: '强调向前推进，可用于进程、事业或军队。' },
        { word: 'continue', note: '最通用，强调不中断。' }
      ],
      confusables: [
        { word: 'precede', note: 'precede 是“在…之前发生”，proceed 是“继续进行”，方向相反。' }
      ]
    }),
    W('prohibit', '/prəˈhɪbɪt/', 'v.', '禁止；阻止', 'to officially forbid something', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['pro'], root: { id: 'hab', label: 'hab', meaning: '持有' },
      morph: [{ text: 'pro-', type: 'prefix', gloss: 'before 在前' }, { text: 'hibit', type: 'root', gloss: 'hold 持有' }],
      rootNote: 'pro-（在前）+ hibit（持有）→ 在前面挡住 → 禁止。',
      example: 'Several cities have prohibited private cars in historic centers to reduce air pollution.',
      exampleZh: '为减少空气污染，一些城市已禁止私家车进入历史城区。',
      collocations: ['prohibit sb from doing', 'strictly prohibit', 'prohibited area'],
      synonyms: [
        { word: 'forbid', note: '更日常，可用于个人规定；prohibit 更正式、多指法规。' },
        { word: 'ban', note: '语气强，常指官方明令禁止。' }
      ],
      confusables: [
        { word: 'exhibit', note: 'exhibit 是“展出；表现出”，ex- 向外，与“禁止”无关。' },
        { word: 'inhibit', note: 'inhibit 是“抑制；阻碍”，不一定是明令禁止。' }
      ]
    }),
    W('promote', '/prəˈməʊt/', 'v.', '促进；推广；晋升', 'to help something develop or become more successful', {
      freq: 5, level: 'core', theme: 'society', affixIds: ['pro'], root: { id: 'mot', label: 'mot', meaning: '移动' },
      morph: [{ text: 'pro-', type: 'prefix', gloss: 'forward 向前' }, { text: 'mot', type: 'root', gloss: 'move 移动' }, { text: '-e', type: 'suffix', gloss: 'v. 词尾' }],
      rootNote: 'pro-（向前）+ mot（移动）→ 向前推动 → 促进、推广。',
      example: 'Governments can promote innovation by funding basic research and protecting intellectual property.',
      exampleZh: '政府可以通过资助基础研究和保护知识产权来促进创新。',
      collocations: ['promote innovation', 'promote awareness', 'be promoted to'],
      synonyms: [
        { word: 'foster', note: '强调像培育幼苗一样长期培养，常与 innovation、growth 搭配。' },
        { word: 'advance', note: '强调推动进程或提升水平，较正式。' }
      ],
      confusables: [
        { word: 'demote', note: 'demote 是“降职”，de- 向下；promote 才是“晋升”。' }
      ]
    }),
    W('prospect', '/ˈprɒspekt/', 'n.', '前景；可能性；景象', 'the possibility that something good will happen in the future', {
      freq: 5, level: 'core', theme: 'technology', affixIds: ['pro'], root: { id: 'spect', label: 'spect', meaning: '看' },
      morph: [{ text: 'pro-', type: 'prefix', gloss: 'forward 向前' }, { text: 'spect', type: 'root', gloss: 'look 看' }],
      rootNote: 'pro-（向前）+ spect（看）→ 向前看到的景象 → 前景。',
      example: 'The prospect of remote work has changed how young people choose where to live.',
      exampleZh: '远程工作的前景改变了年轻人选择居住地的方式。',
      collocations: ['job prospects', 'the prospect of', 'prospects for growth'],
      synonyms: [
        { word: 'outlook', note: '强调对未来的总体看法或展望，常与 economic 搭配。' },
        { word: 'possibility', note: '最通用，只表示“可能性”，不含“景象”义。' }
      ],
      confusables: [
        { word: 'perspective', note: 'perspective 是“视角；观点”，per-（穿过）+ spect。' },
        { word: 'respect', note: 'respect 是“尊重；方面”，re-（回）+ spect。' }
      ]
    }),
    W('provoke', '/prəˈvəʊk/', 'v.', '激起；挑衅；引发', 'to cause a strong reaction, especially anger or discussion', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['pro'], root: { id: 'voc', label: 'voc', meaning: '叫、声音' },
      morph: [{ text: 'pro-', type: 'prefix', gloss: 'forth 向前' }, { text: 'voke', type: 'root', gloss: 'call 叫' }],
      rootNote: 'pro-（向前）+ voke（叫）→ 把人叫出来 → 挑衅、激起。',
      example: 'The proposal provoked heated debate about the balance between security and privacy.',
      exampleZh: '该提案引发了关于安全与隐私之间平衡的激烈辩论。',
      collocations: ['provoke debate', 'provoke anger', 'provoke a response'],
      synonyms: [
        { word: 'trigger', note: '强调像扣动扳机一样引发连锁反应，更中性。' },
        { word: 'irritate', note: '侧重使人烦恼，情绪色彩更强。' }
      ],
      confusables: [
        { word: 'evoke', note: 'evoke 是“唤起（记忆、情感）”，e- 向外；provoke 常带挑衅意味。' },
        { word: 'invoke', note: 'invoke 是“援引；祈求”，in- 向内。' }
      ]
    }),
    W('profound', '/prəˈfaʊnd/', 'adj.', '深刻的；深远的；渊博的', 'very great, serious, or showing deep understanding', {
      freq: 4, level: 'hard', theme: 'culture', affixIds: ['pro'], root: { id: 'fund', label: 'fund', meaning: '底部' },
      morph: [{ text: 'pro-', type: 'prefix', gloss: 'forward 向前' }, { text: 'found', type: 'root', gloss: 'bottom 底' }],
      rootNote: 'pro-（向前）+ found（底）→ 一直到底 → 深刻的。',
      example: 'The pandemic had a profound effect on the way people think about work and community.',
      exampleZh: '疫情对人们看待工作和社区的方式产生了深远影响。',
      collocations: ['profound impact', 'profound change', 'profound knowledge'],
      synonyms: [
        { word: 'deep', note: '最通用，既可指物理深度，也可指思想深刻。' },
        { word: 'far-reaching', note: '强调影响范围广、持续时间长。' }
      ],
      confusables: [
        { word: 'abundant', note: 'abundant 是“丰富的”，拼写相近但含义完全不同。' }
      ]
    }),

    /* ---------------- re- ---------------- */
    W('reveal', '/rɪˈviːl/', 'v.', '揭示；显示；透露', 'to make something previously hidden known', {
      freq: 4, level: 'core', theme: 'culture', affixIds: ['re'], root: { id: 'vel', label: 'vel', meaning: '面纱' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'back 回' }, { text: 'veal', type: 'root', gloss: 'veil 面纱' }],
      rootNote: 're-（回）+ veal（面纱）→ 把面纱揭开 → 揭示。',
      example: 'The survey revealed a gap between what companies say about privacy and what they actually do.',
      exampleZh: '这项调查揭示了公司在隐私方面的说法与实际做法之间的差距。',
      collocations: ['reveal the truth', 'research reveals', 'reveal a pattern'],
      synonyms: [
        { word: 'disclose', note: '更正式，常用于公开信息或秘密。' },
        { word: 'expose', note: '常带“揭露丑闻、使暴露于危险”的意味。' }
      ],
      confusables: [
        { word: 'conceal', note: 'conceal 是“隐藏”，与 reveal 构成反义关系。' }
      ]
    }),
    W('revise', '/rɪˈvaɪz/', 'v.', '修订；复习；改变', 'to change or improve something after considering it again', {
      freq: 4, level: 'core', theme: 'education', affixIds: ['re'], root: { id: 'vis', label: 'vis', meaning: '看' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'again 再' }, { text: 'vise', type: 'root', gloss: 'see 看' }],
      rootNote: 're-（再）+ vise（看）→ 再看一遍 → 修订、复习。',
      example: 'The authors revised their conclusion after several readers pointed out a flaw in the data.',
      exampleZh: '在几位读者指出数据缺陷后，作者修订了结论。',
      collocations: ['revise a draft', 'revise for an exam', 'revised edition'],
      synonyms: [
        { word: 'modify', note: '强调部分改变，不一定涉及重新审视。' },
        { word: 'review', note: '侧重审阅、回顾，不一定修改。' }
      ],
      confusables: [
        { word: 'devise', note: 'devise 是“设计；发明”，de- 与 re- 不同。' },
        { word: 'advise', note: 'advise 是“建议”，ad- 表示“向”。' }
      ]
    }),
    W('resist', '/rɪˈzɪst/', 'v.', '抵抗；抵制；忍住', 'to oppose or refuse to accept something', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['re'], root: { id: 'sist', label: 'sist', meaning: '站立' } ,
      morph: [{ text: 're-', type: 'prefix', gloss: 'against 反' }, { text: 'sist', type: 'root', gloss: 'stand 站' }],
      rootNote: 're-（反）+ sist（站）→ 站着对抗 → 抵抗。',
      example: 'Consumers often resist change even when a new product is clearly more efficient.',
      exampleZh: '即使新产品明显更高效，消费者也常常抵制变化。',
      collocations: ['resist change', 'resist temptation', 'hard to resist'],
      synonyms: [
        { word: 'oppose', note: '强调立场上的反对，可用于政策、计划。' },
        { word: 'withstand', note: '强调承受住压力或冲击，偏物理与能力。' }
      ],
      confusables: [
        { word: 'insist', note: 'insist 是“坚持主张”，in- 向内，不是对抗。' },
        { word: 'persist', note: 'persist 是“坚持；持续”，per- 贯穿。' }
      ]
    }),
    W('resolve', '/rɪˈzɒlv/', 'v. / n.', '解决；决心；决议', 'to find a solution to a problem, or to decide firmly', {
      freq: 5, level: 'core', theme: 'self', affixIds: ['re'], root: { id: 'solv', label: 'solv', meaning: '松开' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'again 再' }, { text: 'solve', type: 'root', gloss: 'loosen 松开' }],
      rootNote: 're-（再）+ solve（松开）→ 把结解开 → 解决。',
      example: 'Cities must resolve the tension between economic growth and environmental protection.',
      exampleZh: '城市必须解决经济增长与环境保护之间的紧张关系。',
      collocations: ['resolve a conflict', 'resolve to do', 'resolve an issue'],
      synonyms: [
        { word: 'settle', note: '强调使争议或局面安定下来，更口语。' },
        { word: 'determine', note: '作“决心”解时更正式，也可表示“确定”。' }
      ],
      confusables: [
        { word: 'revolve', note: 'revolve 是“旋转；围绕”，volv 表示“转”。' },
        { word: 'involve', note: 'involve 是“涉及；使参与”，不是“解决”。' }
      ]
    }),
    W('retain', '/rɪˈteɪn/', 'v.', '保留；保持；留住', 'to keep something or continue to have it', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['re'], root: { id: 'ten', label: 'ten', meaning: '握住' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'back 回' }, { text: 'tain', type: 'root', gloss: 'hold 握住' }],
      rootNote: 're-（回）+ tain（握住）→ 握回来 → 保留。',
      example: 'Firms that retain experienced staff tend to outperform those that rely on constant replacement.',
      exampleZh: '留住有经验员工的公司，往往比依赖不断换人的公司表现更好。',
      collocations: ['retain talent', 'retain control', 'retain information'],
      synonyms: [
        { word: 'keep', note: '最通用，retain 更正式，常指持续保有。' },
        { word: 'preserve', note: '强调保护使其不受损坏，retain 只强调“仍拥有”。' }
      ],
      confusables: [
        { word: 'detain', note: 'detain 是“拘留；耽搁”，de- 向下/离开。' },
        { word: 'sustain', note: 'sustain 是“维持；支撑”，sus- 在下面。' }
      ]
    }),
    W('restrict', '/rɪˈstrɪkt/', 'v.', '限制；约束', 'to limit the size, amount, or range of something', {
      freq: 5, level: 'core', theme: 'society', affixIds: ['re'], root: { id: 'strict', label: 'strict', meaning: '拉紧' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'back 回' }, { text: 'strict', type: 'root', gloss: 'bind 拉紧' }],
      rootNote: 're-（回）+ strict（拉紧）→ 拉回来 → 限制。',
      example: 'Some platforms restrict the amount of personal data that advertisers can access.',
      exampleZh: '一些平台限制了广告商可以获取的个人数据量。',
      collocations: ['restrict access', 'restrict to', 'strictly restrict'],
      synonyms: [
        { word: 'limit', note: '最通用，可作名词或动词。' },
        { word: 'constrain', note: '更正式，强调外部条件造成的束缚。' }
      ],
      confusables: [
        { word: 'district', note: 'district 是“地区”，di- 分开；拼写相近但词性不同。' }
      ]
    }),
    W('resemble', '/rɪˈzembl/', 'v.', '像；与…相似', 'to look like or be similar to someone or something', {
      freq: 3, level: 'hard', theme: 'culture', affixIds: ['re'], root: { id: 'simil', label: 'simil', meaning: '相似' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'again 再' }, { text: 'semble', type: 'root', gloss: 'like 相似' }],
      rootNote: 're-（再）+ semble（相似）→ 看起来相似。',
      example: 'The new library resembles a traditional reading room more than a modern digital hub.',
      exampleZh: '这座新图书馆更像传统阅览室，而不是现代数字中心。',
      collocations: ['closely resemble', 'resemble each other', 'bear a resemblance to'],
      synonyms: [
        { word: 'take after', note: '多用于家人之间相貌或性格相像，口语化。' },
        { word: 'approximate', note: '作动词时表示“接近”，不强调外观相似。' }
      ],
      confusables: [
        { word: 'assemble', note: 'assemble 是“集合；组装”，as- 向一起。' }
      ]
    }),
    W('reconcile', '/ˈrekənsaɪl/', 'v.', '调和；使和解；使一致', 'to make two ideas or situations exist together', {
      freq: 3, level: 'hard', theme: 'society', affixIds: ['re'], root: { id: 'concil', label: 'concil', meaning: '联合' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'again 再' }, { text: 'concile', type: 'root', gloss: 'unite 联合' }],
      rootNote: 're-（再）+ concile（联合）→ 重新合到一起 → 调和。',
      example: 'Young workers struggle to reconcile the desire for stability with the demand for flexibility.',
      exampleZh: '年轻工作者难以调和稳定性的渴望与灵活性的要求。',
      collocations: ['reconcile A with B', 'reconcile differences', 'be reconciled to'],
      synonyms: [
        { word: 'harmonize', note: '强调使和谐一致，常用于规则、标准。' },
        { word: 'settle', note: '强调结束争端，不强调两者共存。' }
      ],
      confusables: [
        { word: 'recognize', note: 'recognize 是“认出；承认”，与“调和”无关。' }
      ]
    }),

    /* ---------------- con- / com- ---------------- */
    W('consensus', '/kənˈsensəs/', 'n.', '共识；一致意见', 'an opinion that everyone in a group agrees with', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['con'], root: { id: 'sens', label: 'sens', meaning: '感觉' },
      morph: [{ text: 'con-', type: 'prefix', gloss: 'together 共同' }, { text: 'sens', type: 'root', gloss: 'feel 感觉' }, { text: '-us', type: 'suffix', gloss: 'n. 词尾' }],
      rootNote: 'con-（共同）+ sens（感觉）→ 共同的感觉 → 共识。',
      example: 'There is a growing consensus that digital literacy should be taught alongside reading and writing.',
      exampleZh: '越来越多的人达成共识：数字素养应与读写能力一同教授。',
      collocations: ['reach a consensus', 'broad consensus', 'consensus on'],
      synonyms: [
        { word: 'agreement', note: '最通用，可指正式协议或意见一致。' },
        { word: 'unanimity', note: '强调所有人完全一致，程度更强。' }
      ],
      confusables: [
        { word: 'census', note: 'census 是“人口普查”，拼写只差一个字母。' },
        { word: 'consent', note: 'consent 是“同意；许可”，强调允许。' }
      ]
    }),
    W('comprehensive', '/ˌkɒmprɪˈhensɪv/', 'adj.', '全面的；综合的；有理解力的', 'including all or almost all the details', {
      freq: 5, level: 'core', theme: 'education', affixIds: ['con', 'ive'], root: { id: 'prehend', label: 'prehend', meaning: '抓住' },
      morph: [{ text: 'com-', type: 'prefix', gloss: 'together 全部' }, { text: 'prehend', type: 'root', gloss: 'seize 抓住' }, { text: '-ive', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'com-（全部）+ prehend（抓住）→ 全部抓住 → 全面的。',
      example: 'The report offers a comprehensive analysis of how AI affects employment across sectors.',
      exampleZh: '该报告全面分析了人工智能如何影响各行业的就业。',
      collocations: ['comprehensive analysis', 'comprehensive reform', 'comprehensive coverage'],
      synonyms: [
        { word: 'thorough', note: '强调细致彻底，不一定覆盖所有方面。' },
        { word: 'all-inclusive', note: '强调包含所有项目，常用于服务或价格。' }
      ],
      confusables: [
        { word: 'comprehensible', note: 'comprehensible 是“可理解的”，不是“全面的”。' }
      ]
    }),
    W('compelling', '/kəmˈpelɪŋ/', 'adj.', '令人信服的；引人入胜的；不可抗拒的', 'very convincing or interesting', {
      freq: 4, level: 'hard', theme: 'culture', affixIds: ['con', 'ive'], root: { id: 'pel', label: 'pel', meaning: '推' },
      morph: [{ text: 'com-', type: 'prefix', gloss: 'together 加强' }, { text: 'pel', type: 'root', gloss: 'drive 推' }, { text: '-ling', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'com-（加强）+ pel（推）→ 推着你去相信 → 令人信服的。',
      example: 'The most compelling argument for remote work is not convenience but access to talent.',
      exampleZh: '支持远程工作最有说服力的理由不是便利，而是能接触人才。',
      collocations: ['compelling evidence', 'compelling reason', 'compelling story'],
      synonyms: [
        { word: 'persuasive', note: '强调说服力，常用于论证、演讲。' },
        { word: 'gripping', note: '强调引人入胜，多用于故事、影片。' }
      ],
      confusables: [
        { word: 'competing', note: 'competing 是“相互竞争的”，不是“令人信服的”。' },
        { word: 'repelling', note: 'repelling 是“令人排斥的”，方向相反。' }
      ]
    }),
    W('compensate', '/ˈkɒmpenseɪt/', 'v.', '补偿；弥补；抵消', 'to give something to make up for a loss or problem', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['con'], root: { id: 'pens', label: 'pens', meaning: '称量' },
      morph: [{ text: 'com-', type: 'prefix', gloss: 'together 一起' }, { text: 'pens', type: 'root', gloss: 'weigh 称量' }, { text: '-ate', type: 'suffix', gloss: 'v. 使' }],
      rootNote: 'com-（一起）+ pens（称量）→ 把两边称平 → 补偿。',
      example: 'No amount of money can fully compensate for the loss of a community’s shared space.',
      exampleZh: '再多的钱也无法完全弥补一个社区失去公共空间的损失。',
      collocations: ['compensate for', 'fully compensate', 'compensate employees'],
      synonyms: [
        { word: 'offset', note: '强调抵消负面影响，不涉及支付赔偿。' },
        { word: 'make up for', note: '最口语，强调补足缺失。' }
      ],
      confusables: [
        { word: 'contemplate', note: 'contemplate 是“沉思；考虑”，拼写相近但含义无关。' }
      ]
    }),
    W('confront', '/kənˈfrʌnt/', 'v.', '面对；对抗；使面临', 'to face a difficult situation or person directly', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['con'], root: { id: 'front', label: 'front', meaning: '前额、正面' },
      morph: [{ text: 'con-', type: 'prefix', gloss: 'together 共同' }, { text: 'front', type: 'root', gloss: 'face 正面' }],
      rootNote: 'con-（一起）+ front（正面）→ 面对面 → 面对、对抗。',
      example: 'Universities are being forced to confront uncomfortable questions about free speech.',
      exampleZh: '大学正被迫面对关于言论自由的一些令人不安的问题。',
      collocations: ['confront a problem', 'be confronted with', 'confront reality'],
      synonyms: [
        { word: 'face', note: '最通用，confront 更强调直面压力或冲突。' },
        { word: 'challenge', note: '侧重提出质疑或挑战，不一定是“面对”。' }
      ],
      confusables: [
        { word: 'conflict', note: 'conflict 是“冲突”，可作名词；confront 是“面对”这个动作。' }
      ]
    }),
    W('constrain', '/kənˈstreɪn/', 'v.', '限制；约束；强迫', 'to limit someone’s freedom or force them to do something', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['con'], root: { id: 'strict', label: 'strict', meaning: '拉紧' },
      morph: [{ text: 'con-', type: 'prefix', gloss: 'together 一起' }, { text: 'strain', type: 'root', gloss: 'bind 拉紧' }],
      rootNote: 'con-（一起）+ strain（拉紧）→ 拉紧束缚 → 限制。',
      example: 'Limited funding constrains what small research teams can realistically achieve.',
      exampleZh: '有限的资金限制了小型研究团队实际能取得的成果。',
      collocations: ['constrain growth', 'be constrained by', 'financial constraints'],
      synonyms: [
        { word: 'restrict', note: '更通用，强调设定范围或上限。' },
        { word: 'restrain', note: '强调阻止某人做出冲动行为，多用于人或情绪。' }
      ],
      confusables: [
        { word: 'restrain', note: 'restrain 常指“克制、阻止”，constrain 更强调外部条件限制。' }
      ]
    }),
    W('contemporary', '/kənˈtemprəri/', 'adj. / n.', '当代的；同时代的；同代人', 'belonging to the present time, or existing at the same time', {
      freq: 4, level: 'core', theme: 'culture', affixIds: ['con'], root: { id: 'tempor', label: 'tempor', meaning: '时间' },
      morph: [{ text: 'con-', type: 'prefix', gloss: 'together 共同' }, { text: 'tempor', type: 'root', gloss: 'time 时间' }, { text: '-ary', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'con-（共同）+ tempor（时间）→ 同一时间 → 当代的、同时代的。',
      example: 'Contemporary museums are expected to be places of debate, not just preservation.',
      exampleZh: '当代博物馆被期待成为辩论的场所，而不仅仅是保存物品的地方。',
      collocations: ['contemporary art', 'contemporary society', 'a contemporary of'],
      synonyms: [
        { word: 'modern', note: '强调现代性，当代的；不一定与某人同时代。' },
        { word: 'contemporaneous', note: '更正式，强调时间上同时发生。' }
      ],
      confusables: [
        { word: 'temporary', note: 'temporary 是“暂时的”，少了 con-，意思完全不同。' }
      ]
    }),
    W('contradict', '/ˌkɒntrəˈdɪkt/', 'v.', '反驳；与…矛盾', 'to state the opposite of what someone has said', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['con'], root: { id: 'dict', label: 'dict', meaning: '说' },
      morph: [{ text: 'contra-', type: 'prefix', gloss: 'against 相反' }, { text: 'dict', type: 'root', gloss: 'say 说' }],
      rootNote: 'contra-（相反）+ dict（说）→ 说相反的话 → 反驳。',
      example: 'The data contradict the popular belief that longer school days automatically raise achievement.',
      exampleZh: '数据与“延长在校时间会自动提高成绩”这一流行看法相矛盾。',
      collocations: ['contradict a claim', 'contradict each other', 'self-contradictory'],
      synonyms: [
        { word: 'deny', note: '强调否认某项指控或事实，不一定是逻辑矛盾。' },
        { word: 'conflict with', note: '强调两者不相容，更正式。' }
      ],
      confusables: [
        { word: 'contract', note: 'contract 是“合同；收缩”，tract 是“拉”。' },
        { word: 'distribute', note: 'distribute 是“分配”，tribute 是“给予”。' }
      ]
    }),
    W('consolidate', '/kənˈsɒlɪdeɪt/', 'v.', '巩固；合并；整合', 'to make something stronger or combine things into one', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['con'], root: { id: 'solid', label: 'solid', meaning: '坚实' },
      morph: [{ text: 'con-', type: 'prefix', gloss: 'together 一起' }, { text: 'solid', type: 'root', gloss: 'firm 坚实' }, { text: '-ate', type: 'suffix', gloss: 'v. 使' }],
      rootNote: 'con-（一起）+ solid（坚实）→ 使坚实 → 巩固、合并。',
      example: 'The two departments were consolidated to reduce duplication and improve coordination.',
      exampleZh: '两个部门被合并，以减少重复工作并改善协调。',
      collocations: ['consolidate power', 'consolidate debt', 'consolidate gains'],
      synonyms: [
        { word: 'strengthen', note: '强调增强力量或效果，不涉及合并。' },
        { word: 'merge', note: '强调两个实体合为一个，不强调“巩固”。' }
      ],
      confusables: [
        { word: 'console', note: 'console 是“安慰”，拼写相近但含义无关。' }
      ]
    }),
    W('complement', '/ˈkɒmplɪment/', 'v. / n.', '补充；补足物；相得益彰', 'to add to something in a way that improves it', {
      freq: 4, level: 'hard', theme: 'culture', affixIds: ['con'], root: { id: 'ple', label: 'ple', meaning: '填满' },
      morph: [{ text: 'com-', type: 'prefix', gloss: 'together 共同' }, { text: 'ple', type: 'root', gloss: 'fill 填满' }, { text: '-ment', type: 'suffix', gloss: 'n. 结果' }],
      rootNote: 'com-（共同）+ ple（填满）→ 把彼此填满 → 补充、相配。',
      example: 'Online courses can complement classroom teaching, but they cannot replace it entirely.',
      exampleZh: '在线课程可以补充课堂教学，但无法完全取代它。',
      collocations: ['complement each other', 'a perfect complement', 'complement a skill'],
      synonyms: [
        { word: 'supplement', note: '强调额外增加以补足，常指营养品或收入。' },
        { word: 'complete', note: '强调使完整，complement 强调两者相配。' }
      ],
      confusables: [
        { word: 'compliment', note: 'compliment 是“赞美”，i 与 e 之差，是经典易混词。' }
      ]
    }),

    /* ---------------- sub- ---------------- */
    W('subtle', '/ˈsʌtl/', 'adj.', '微妙的；细微的；含蓄的', 'not obvious, and therefore difficult to notice', {
      freq: 4, level: 'hard', theme: 'culture', affixIds: ['sub'], root: { id: 'subtil', label: 'subtil', meaning: '精细' },
      morph: [{ text: 'sub-', type: 'prefix', gloss: 'under 在下' }, { text: 'tle', type: 'root', gloss: 'fine 精细' }],
      rootNote: 'sub-（在下）+ 精细 → 藏在表面之下 → 微妙的。',
      example: 'The advertisement uses subtle cues to associate the product with social status.',
      exampleZh: '这则广告用微妙的暗示把产品与社会地位联系起来。',
      collocations: ['subtle difference', 'subtle change', 'subtle hint'],
      synonyms: [
        { word: 'slight', note: '强调程度小，不一定有“难以察觉”之意。' },
        { word: 'nuanced', note: '强调有细微差别，多用于观点、表达。' }
      ],
      confusables: [
        { word: 'subject', note: 'subject 是“主题；科目”，拼写相近但含义无关。' }
      ]
    }),
    W('submit', '/səbˈmɪt/', 'v.', '提交；屈服；主张', 'to give a document or proposal to someone in authority', {
      freq: 4, level: 'core', theme: 'education', affixIds: ['sub'], root: { id: 'mit', label: 'mit', meaning: '送' },
      morph: [{ text: 'sub-', type: 'prefix', gloss: 'under 向下' }, { text: 'mit', type: 'root', gloss: 'send 送' }],
      rootNote: 'sub-（向下）+ mit（送）→ 呈送上去 → 提交；也可引申为“屈服”。',
      example: 'Students must submit their research proposals before the end of the month.',
      exampleZh: '学生必须在本月底之前提交研究计划。',
      collocations: ['submit an application', 'submit to authority', 'submit a proposal'],
      synonyms: [
        { word: 'hand in', note: '最口语，多用于作业、文件。' },
        { word: 'yield', note: '作“屈服”解时与 submit to 相近，但更强调让步。' }
      ],
      confusables: [
        { word: 'summit', note: 'summit 是“峰会；山顶”，拼写只差一个字母。' }
      ]
    }),
    W('subsequent', '/ˈsʌbsɪkwənt/', 'adj.', '随后的；后来的', 'happening after something else', {
      freq: 4, level: 'core', theme: 'education', affixIds: ['sub'], root: { id: 'sequ', label: 'sequ', meaning: '跟随' },
      morph: [{ text: 'sub-', type: 'prefix', gloss: 'after 在后' }, { text: 'sequ', type: 'root', gloss: 'follow 跟随' }, { text: '-ent', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'sub-（在后）+ sequ（跟随）→ 跟在后面发生的 → 随后的。',
      example: 'The first policy failed, and subsequent reforms were met with public skepticism.',
      exampleZh: '第一项政策失败了，随后的改革遭到公众质疑。',
      collocations: ['subsequent to', 'subsequent years', 'subsequent research'],
      synonyms: [
        { word: 'following', note: '最通用，可作形容词或介词。' },
        { word: 'later', note: '口语化，强调时间较晚。' }
      ],
      confusables: [
        { word: 'consequent', note: 'consequent 是“作为结果发生的”，强调因果关系。' }
      ]
    }),
    W('subsidize', '/ˈsʌbsɪdaɪz/', 'v.', '补贴；资助', 'to pay part of the cost of something', {
      freq: 3, level: 'hard', theme: 'society', affixIds: ['sub'], root: { id: 'sid', label: 'sid', meaning: '坐、安置' },
      morph: [{ text: 'sub-', type: 'prefix', gloss: 'under 在下' }, { text: 'sid', type: 'root', gloss: 'settle 安置' }, { text: '-ize', type: 'suffix', gloss: 'v. 使' }],
      rootNote: 'sub-（在下）+ sid（安置）→ 在下面托住 → 补贴。',
      example: 'Many governments subsidize public transport to make it affordable for low-income residents.',
      exampleZh: '许多政府补贴公共交通，使低收入居民也能负担得起。',
      collocations: ['heavily subsidized', 'subsidize housing', 'government subsidies'],
      synonyms: [
        { word: 'fund', note: '强调提供资金，不一定有“降低价格”之意。' },
        { word: 'underwrite', note: '更正式，强调承担费用或风险。' }
      ],
      confusables: [
        { word: 'subsidiary', note: 'subsidiary 是“子公司；附属的”，subsidize 是动词“补贴”。' }
      ]
    }),
    W('substantial', '/səbˈstænʃl/', 'adj.', '大量的；实质的；坚固的', 'large in amount, value, or importance', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['sub', 'al'], root: { id: 'sta', label: 'sta', meaning: '站立' },
      morph: [{ text: 'sub-', type: 'prefix', gloss: 'under 在下' }, { text: 'stant', type: 'root', gloss: 'stand 站' }, { text: '-ial', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'sub-（在下）+ stant（站）→ 站得住、有实体 → 大量的、实质的。',
      example: 'The plan requires substantial investment in training before it can produce results.',
      exampleZh: '该计划需要大量培训投入才能产生效果。',
      collocations: ['substantial evidence', 'substantial investment', 'a substantial number of'],
      synonyms: [
        { word: 'considerable', note: '强调数量或程度大，最接近。' },
        { word: 'significant', note: '强调重要或有统计意义，不一定指数量大。' }
      ],
      confusables: [
        { word: 'substantive', note: 'substantive 是“实质性的”，强调内容而非数量。' }
      ]
    }),
    W('substitute', '/ˈsʌbstɪtjuːt/', 'v. / n.', '替代；代替者', 'to use something or someone instead of another', {
      freq: 4, level: 'core', theme: 'education', affixIds: ['sub'], root: { id: 'stitut', label: 'stitut', meaning: '放置' },
      morph: [{ text: 'sub-', type: 'prefix', gloss: 'under 在下' }, { text: 'stitute', type: 'root', gloss: 'set 放置' }],
      rootNote: 'sub-（在下）+ stitute（放置）→ 放在下面顶替 → 替代。',
      example: 'No online tool can fully substitute for the discipline of reading a long book.',
      exampleZh: '没有任何在线工具能完全替代读一本长篇专著所需的专注。',
      collocations: ['substitute A for B', 'a substitute for', 'substitute teacher'],
      synonyms: [
        { word: 'replace', note: '强调用新的取代旧的，结构为 replace A with B。' },
        { word: 'alternative', note: '作名词指“替代选择”，不强调动作。' }
      ],
      confusables: [
        { word: 'constitute', note: 'constitute 是“构成；组成”，不是“替代”。' },
        { word: 'institute', note: 'institute 是“机构；建立”，拼写相近。' }
      ]
    }),

    /* ---------------- trans- ---------------- */
    W('transform', '/trænsˈfɔːm/', 'v.', '改变；转化；改造', 'to change something completely, usually for the better', {
      freq: 5, level: 'core', theme: 'technology', affixIds: ['trans'], root: { id: 'form', label: 'form', meaning: '形状' },
      morph: [{ text: 'trans-', type: 'prefix', gloss: 'across 跨越' }, { text: 'form', type: 'root', gloss: 'shape 形状' }],
      rootNote: 'trans-（跨越）+ form（形状）→ 换一个形态 → 彻底改变。',
      example: 'Digital tools have transformed how researchers collect and interpret evidence.',
      exampleZh: '数字工具已经改变了研究者收集和解读证据的方式。',
      collocations: ['transform into', 'radically transform', 'digital transformation'],
      synonyms: [
        { word: 'convert', note: '强调从一种形式、用途转为另一种。' },
        { word: 'reshape', note: '强调重新塑造，常用于结构或格局。' }
      ],
      confusables: [
        { word: 'transfer', note: 'transfer 是“转移；调动”，fer 是“携带”。' },
        { word: 'transmit', note: 'transmit 是“传送；传播”，mit 是“送”。' }
      ]
    }),
    W('transmit', '/trænsˈmɪt/', 'v.', '传送；传播；传染', 'to send information, signals, or disease from one place to another', {
      freq: 4, level: 'core', theme: 'technology', affixIds: ['trans'], root: { id: 'mit', label: 'mit', meaning: '送' },
      morph: [{ text: 'trans-', type: 'prefix', gloss: 'across 穿过' }, { text: 'mit', type: 'root', gloss: 'send 送' }],
      rootNote: 'trans-（穿过）+ mit（送）→ 送过去 → 传送、传播。',
      example: 'The way a society transmits knowledge shapes what the next generation considers important.',
      exampleZh: '一个社会传递知识的方式，塑造了下一代认为重要的东西。',
      collocations: ['transmit data', 'transmit disease', 'transmit knowledge'],
      synonyms: [
        { word: 'convey', note: '强调传达意义、情感，不强调物理信号。' },
        { word: 'broadcast', note: '强调向广泛受众播送，多用于媒体。' }
      ],
      confusables: [
        { word: 'submit', note: 'submit 是“提交；屈服”，sub- 向下。' },
        { word: 'admit', note: 'admit 是“承认；准许进入”，ad- 向。' }
      ]
    }),
    W('transparent', '/trænsˈpærənt/', 'adj.', '透明的；公开的；易懂的', 'clear and easy to see through or understand', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['trans', 'ent'], root: { id: 'par', label: 'par', meaning: '出现' },
      morph: [{ text: 'trans-', type: 'prefix', gloss: 'through 穿过' }, { text: 'par', type: 'root', gloss: 'appear 出现' }, { text: '-ent', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'trans-（穿过）+ par（出现）→ 光能穿过、看得见 → 透明的；引申为公开。',
      example: 'Voters are demanding a more transparent process for deciding how public money is spent.',
      exampleZh: '选民要求以更透明的程序决定公共资金的使用。',
      collocations: ['transparent process', 'transparent about', 'fully transparent'],
      synonyms: [
        { word: 'clear', note: '最通用，可指视觉清晰或表达清楚。' },
        { word: 'open', note: '强调不隐瞒，常用于政府、沟通。' }
      ],
      confusables: [
        { word: 'apparent', note: 'apparent 是“明显的；表面上的”，不等于“透明”。' }
      ]
    }),
    W('transcend', '/trænˈsend/', 'v.', '超越；胜过；不受…限制', 'to go beyond the usual limits of something', {
      freq: 3, level: 'hard', theme: 'culture', affixIds: ['trans'], root: { id: 'scand', label: 'scand', meaning: '爬' },
      morph: [{ text: 'trans-', type: 'prefix', gloss: 'beyond 越过' }, { text: 'scend', type: 'root', gloss: 'climb 爬' }],
      rootNote: 'trans-（越过）+ scend（爬）→ 爬过去 → 超越。',
      example: 'Great works of art can transcend the culture in which they were created.',
      exampleZh: '伟大的艺术作品能够超越其诞生时的文化。',
      collocations: ['transcend boundaries', 'transcend differences', 'transcend limits'],
      synonyms: [
        { word: 'surpass', note: '强调在程度或数量上超过，不强调“突破限制”。' },
        { word: 'go beyond', note: '最直白，强调超出某个范围。' }
      ],
      confusables: [
        { word: 'descend', note: 'descend 是“下降”，de- 向下，方向相反。' }
      ]
    }),

    /* ---------------- dis- ---------------- */
    W('dismiss', '/dɪsˈmɪs/', 'v.', '解雇；解散；不予理会', 'to refuse to consider an idea, or to remove someone from a job', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['dis'], root: { id: 'mit', label: 'mit', meaning: '送' },
      morph: [{ text: 'dis-', type: 'prefix', gloss: 'away 离开' }, { text: 'miss', type: 'root', gloss: 'send 送' }],
      rootNote: 'dis-（离开）+ miss（送）→ 送走 → 解散、解雇；把想法送走 → 不予理会。',
      example: 'It is too easy to dismiss concerns about privacy as the worries of a small minority.',
      exampleZh: '人们太容易把对隐私的担忧当作少数人的多虑而不予理会。',
      collocations: ['dismiss a claim', 'dismiss an employee', 'dismiss as'],
      synonyms: [
        { word: 'reject', note: '强调拒绝接受，语气直接，可用于申请、观点。' },
        { word: 'discharge', note: '作“解雇；释放”解时更正式。' }
      ],
      confusables: [
        { word: 'discuss', note: 'discuss 是“讨论”，与“打发走”无关。' }
      ]
    }),
    W('distort', '/dɪˈstɔːt/', 'v.', '扭曲；歪曲；使变形', 'to change something so that it is no longer accurate or true', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['dis'], root: { id: 'tort', label: 'tort', meaning: '扭' },
      morph: [{ text: 'dis-', type: 'prefix', gloss: 'away 偏离' }, { text: 'tort', type: 'root', gloss: 'twist 扭' }],
      rootNote: 'dis-（偏离）+ tort（扭）→ 扭歪 → 扭曲、歪曲。',
      example: 'Selective exposure to news can distort a person’s understanding of public opinion.',
      exampleZh: '选择性接触新闻可能扭曲一个人对公众舆论的理解。',
      collocations: ['distort the truth', 'distorted image', 'distort incentives'],
      synonyms: [
        { word: 'twist', note: '更口语，可指物理扭转或曲解原意。' },
        { word: 'misrepresent', note: '强调不准确地呈现事实，较正式。' }
      ],
      confusables: [
        { word: 'retort', note: 'retort 是“反驳”，re- 回，不是“扭曲”。' }
      ]
    }),
    W('disperse', '/dɪˈspɜːs/', 'v.', '分散；驱散；传播', 'to spread over a wide area or make a group leave', {
      freq: 3, level: 'hard', theme: 'environment', affixIds: ['dis'], root: { id: 'spers', label: 'spers', meaning: '散开' },
      morph: [{ text: 'dis-', type: 'prefix', gloss: 'apart 分开' }, { text: 'sperse', type: 'root', gloss: 'scatter 散' }],
      rootNote: 'dis-（分开）+ sperse（散）→ 向四处散开。',
      example: 'As the crowd dispersed, it became clear that the protest had changed few minds.',
      exampleZh: '人群散去后，可以明显看出这场抗议几乎没有改变人们的想法。',
      collocations: ['disperse the crowd', 'widely dispersed', 'disperse seeds'],
      synonyms: [
        { word: 'scatter', note: '最通用，可指物体或人群向四处散开。' },
        { word: 'spread', note: '强调范围扩大，可用于信息、疾病。' }
      ],
      confusables: [
        { word: 'disburse', note: 'disburse 是“支付； disbursement 支出”，拼写相近。' }
      ]
    }),
    W('distinguish', '/dɪˈstɪŋɡwɪʃ/', 'v.', '区分；辨别；使杰出', 'to recognize the difference between two things', {
      freq: 4, level: 'core', theme: 'education', affixIds: ['dis'], root: { id: 'stingu', label: 'stingu', meaning: '刺、标记' },
      morph: [{ text: 'dis-', type: 'prefix', gloss: 'apart 分开' }, { text: 'stinguish', type: 'root', gloss: 'mark 标记' }],
      rootNote: 'dis-（分开）+ stingu（标记）→ 把标记分开 → 区分。',
      example: 'Readers must learn to distinguish evidence from opinion in a crowded media environment.',
      exampleZh: '在信息密集的媒体环境中，读者必须学会区分证据与观点。',
      collocations: ['distinguish between', 'distinguish A from B', 'distinguished professor'],
      synonyms: [
        { word: 'differentiate', note: '更正式，强调找出差异，常用于商业、生物。' },
        { word: 'discern', note: '强调费力地看出或辨别，常与 difference 搭配。' }
      ],
      confusables: [
        { word: 'extinguish', note: 'extinguish 是“熄灭；扑灭”，ex- 向外。' }
      ]
    }),
    W('dispute', '/dɪˈspjuːt/', 'n. / v.', '争论；纠纷；质疑', 'a serious disagreement, or to argue that something is not true', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['dis'], root: { id: 'put', label: 'put', meaning: '思考' },
      morph: [{ text: 'dis-', type: 'prefix', gloss: 'apart 分开' }, { text: 'pute', type: 'root', gloss: 'think 思考' }],
      rootNote: 'dis-（分开）+ pute（思考）→ 想法分开 → 争论。',
      example: 'Few economists dispute that investment in early education yields long-term returns.',
      exampleZh: '很少有经济学家质疑，对早期教育的投资会带来长期回报。',
      collocations: ['in dispute', 'dispute a claim', 'settle a dispute'],
      synonyms: [
        { word: 'controversy', note: '多作名词，指公开、持续的争议。' },
        { word: 'challenge', note: '强调对权威或说法提出质疑。' }
      ],
      confusables: [
        { word: 'reputation', note: 'reputation 是“声誉”，拼写相近但含义无关。' }
      ]
    }),
    W('disrupt', '/dɪsˈrʌpt/', 'v.', '扰乱；中断；颠覆', 'to interrupt or change the normal course of something', {
      freq: 4, level: 'core', theme: 'technology', affixIds: ['dis'], root: { id: 'rupt', label: 'rupt', meaning: '断裂' },
      morph: [{ text: 'dis-', type: 'prefix', gloss: 'apart 分开' }, { text: 'rupt', type: 'root', gloss: 'break 断' }],
      rootNote: 'dis-（分开）+ rupt（断）→ 打断 → 扰乱、颠覆。',
      example: 'Ride-sharing services disrupted the taxi industry but also created new regulatory problems.',
      exampleZh: '网约车服务颠覆了出租车行业，但也带来了新的监管问题。',
      collocations: ['disrupt the market', 'disrupt supply chains', 'disruptive technology'],
      synonyms: [
        { word: 'interrupt', note: '强调暂时打断，disrupt 更强调打乱整个进程。' },
        { word: 'disturb', note: '强调打扰安宁，语气较轻。' }
      ],
      confusables: [
        { word: 'corrupt', note: 'corrupt 是“腐败；使堕落”，cor- 加强。' },
        { word: 'erupt', note: 'erupt 是“爆发”，e- 向外。' }
      ]
    }),

    /* ---------------- inter- ---------------- */
    W('intervene', '/ˌɪntəˈviːn/', 'v.', '干预；介入；调停', 'to become involved in a situation to change or improve it', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['inter'], root: { id: 'ven', label: 'ven', meaning: '来' },
      morph: [{ text: 'inter-', type: 'prefix', gloss: 'between 在…之间' }, { text: 'vene', type: 'root', gloss: 'come 来' }],
      rootNote: 'inter-（之间）+ ven（来）→ 来到两者之间 → 介入。',
      example: 'The central bank intervened when credit markets froze, but the rescue was controversial.',
      exampleZh: '当信贷市场冻结时，央行出手干预，但这次救助引发了争议。',
      collocations: ['intervene in', 'government intervention', 'intervene to prevent'],
      synonyms: [
        { word: 'step in', note: '最口语，强调主动介入帮忙。' },
        { word: 'interfere', note: '常带贬义，指不受欢迎的干涉。' }
      ],
      confusables: [
        { word: 'convene', note: 'convene 是“召集；开会”，con- 一起。' }
      ]
    }),
    W('interpret', '/ɪnˈtɜːprɪt/', 'v.', '解释；理解；口译', 'to explain the meaning of something or understand it in a particular way', {
      freq: 5, level: 'core', theme: 'culture', affixIds: ['inter'], root: { id: 'pret', label: 'pret', meaning: '解释' },
      morph: [{ text: 'inter-', type: 'prefix', gloss: 'between 之间' }, { text: 'pret', type: 'root', gloss: 'explain 解释' }],
      rootNote: 'inter-（之间）+ pret（解释）→ 在两者之间翻译、解释。',
      example: 'Different generations interpret the same historical event in strikingly different ways.',
      exampleZh: '不同世代对同一历史事件的解读截然不同。',
      collocations: ['interpret data', 'interpret as', 'interpret for sb'],
      synonyms: [
        { word: 'explain', note: '最通用，强调把道理讲清楚。' },
        { word: 'construe', note: '更正式，常指对言辞或行为的理解。' }
      ],
      confusables: [
        { word: 'interrupt', note: 'interrupt 是“打断”，rupt 是“断裂”。' }
      ]
    }),
    W('integrate', '/ˈɪntɪɡreɪt/', 'v.', '整合；融入；使一体化', 'to combine parts into a whole, or become part of a group', {
      freq: 5, level: 'core', theme: 'education', affixIds: ['inter'], root: { id: 'integr', label: 'integr', meaning: '完整' },
      morph: [{ text: 'inter-', type: 'prefix', gloss: 'between 之间' }, { text: 'grate', type: 'root', gloss: 'whole 完整' }],
      rootNote: 'inter-（之间）+ integr（完整）→ 使各部分成为整体 → 整合。',
      example: 'Schools are experimenting with ways to integrate practical skills into academic courses.',
      exampleZh: '学校正在尝试把实用技能融入学术课程。',
      collocations: ['integrate into', 'integrate with', 'fully integrated'],
      synonyms: [
        { word: 'combine', note: '强调把部分放在一起，不一定形成有机整体。' },
        { word: 'incorporate', note: '强调把某物纳入更大的体系。' }
      ],
      confusables: [
        { word: 'migrate', note: 'migrate 是“迁移”，拼写相近但含义不同。' }
      ]
    }),
    W('interact', '/ˌɪntərˈækt/', 'v.', '互动；相互作用', 'to communicate with or affect each other', {
      freq: 4, level: 'core', theme: 'technology', affixIds: ['inter'], root: { id: 'act', label: 'act', meaning: '行动' },
      morph: [{ text: 'inter-', type: 'prefix', gloss: 'between 之间' }, { text: 'act', type: 'root', gloss: 'do 行动' }],
      rootNote: 'inter-（之间）+ act（行动）→ 相互行动 → 互动。',
      example: 'Children learn social rules by interacting with peers, not only by following instructions.',
      exampleZh: '儿童通过与同伴互动来学习社会规则，而不仅仅是听从指令。',
      collocations: ['interact with', 'social interaction', 'interactive media'],
      synonyms: [
        { word: 'communicate', note: '强调信息交流，不一定强调相互影响。' },
        { word: 'engage', note: '强调主动参与，常与 audience、students 搭配。' }
      ],
      confusables: [
        { word: 'enact', note: 'enact 是“颁布；扮演”，不是“互动”。' }
      ]
    }),

    /* ---------------- over- / under- ---------------- */
    W('overlook', '/ˌəʊvəˈlʊk/', 'v.', '忽视；俯瞰；宽恕', 'to fail to notice something, or to have a view over something', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['overunder'], root: { id: 'look', label: 'look', meaning: '看' },
      morph: [{ text: 'over-', type: 'prefix', gloss: 'over 在上' }, { text: 'look', type: 'root', gloss: '看' }],
      rootNote: 'over-（在上）+ look（看）→ 从上往下看 → 俯瞰；看漏 → 忽视。',
      example: 'Policymakers often overlook the informal networks that hold communities together.',
      exampleZh: '政策制定者常常忽视维系社区的非正式网络。',
      collocations: ['overlook a detail', 'overlook the fact', 'room with a view'],
      synonyms: [
        { word: 'ignore', note: '强调有意不理会，overlook 可能是无意疏忽。' },
        { word: 'neglect', note: '强调未尽责任或照料不足。' }
      ],
      confusables: [
        { word: 'oversee', note: 'oversee 是“监督；管理”，不是“忽视”。' }
      ]
    }),
    W('overcome', '/ˌəʊvəˈkʌm/', 'v.', '克服；战胜；压倒', 'to successfully deal with a problem or difficulty', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['overunder'], root: { id: 'come', label: 'come', meaning: '来' },
      morph: [{ text: 'over-', type: 'prefix', gloss: 'over 越过' }, { text: 'come', type: 'root', gloss: '来' }],
      rootNote: 'over-（越过）+ come（来）→ 越过障碍 → 克服。',
      example: 'Students from disadvantaged backgrounds often have to overcome more than academic obstacles.',
      exampleZh: '来自弱势背景的学生往往不得不克服学业之外的更多障碍。',
      collocations: ['overcome difficulties', 'overcome fear', 'be overcome by'],
      synonyms: [
        { word: 'conquer', note: '语气强，强调彻底战胜，可用于恐惧、领土。' },
        { word: 'surmount', note: '更正式，常与 obstacles、difficulties 搭配。' }
      ],
      confusables: [
        { word: 'overtake', note: 'overtake 是“超过；赶上”，不是“克服”。' }
      ]
    }),
    W('undermine', '/ˌʌndəˈmaɪn/', 'v.', '削弱；破坏；暗中损害', 'to gradually make something weaker or less effective', {
      freq: 5, level: 'hard', theme: 'society', affixIds: ['overunder'], root: { id: 'mine', label: 'mine', meaning: '挖掘' },
      morph: [{ text: 'under-', type: 'prefix', gloss: 'under 在下' }, { text: 'mine', type: 'root', gloss: 'dig 挖' }],
      rootNote: 'under-（在下）+ mine（挖）→ 从下面挖空 → 暗中削弱。',
      example: 'Constant testing may undermine students’ curiosity and their willingness to take intellectual risks.',
      exampleZh: '频繁考试可能削弱学生的好奇心以及承担智力风险的意愿。',
      collocations: ['undermine confidence', 'undermine authority', 'undermine trust'],
      synonyms: [
        { word: 'weaken', note: '最通用，强调变弱，不强调“暗中”。' },
        { word: 'erode', note: '强调像水流侵蚀一样逐渐削弱，常与 trust 搭配。' }
      ],
      confusables: [
        { word: 'underline', note: 'underline 是“强调；在…下划线”，不是“削弱”。' }
      ]
    }),
    W('underestimate', '/ˌʌndərˈestɪmeɪt/', 'v. / n.', '低估；轻视', 'to think that something is smaller or less important than it really is', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['overunder'], root: { id: 'estim', label: 'estim', meaning: '评估' },
      morph: [{ text: 'under-', type: 'prefix', gloss: 'under 低于' }, { text: 'estimate', type: 'root', gloss: 'value 评估' }],
      rootNote: 'under-（低于）+ estimate（评估）→ 估低了 → 低估。',
      example: 'Companies often underestimate how much time employees need to adapt to new systems.',
      exampleZh: '公司常常低估员工适应新系统所需的时间。',
      collocations: ['underestimate the importance', 'severely underestimate', 'never underestimate'],
      synonyms: [
        { word: 'undervalue', note: '强调价值被低估，常含“不重视”意味。' },
        { word: 'misjudge', note: '强调判断错误，不一定估低。' }
      ],
      confusables: [
        { word: 'understate', note: 'understate 是“轻描淡写”，强调表达得比实际轻。' }
      ]
    }),
    W('undergo', '/ˌʌndəˈɡəʊ/', 'v.', '经历；经受；接受（治疗等）', 'to experience something difficult or important', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['overunder'], root: { id: 'go', label: 'go', meaning: '走' },
      morph: [{ text: 'under-', type: 'prefix', gloss: 'under 在下' }, { text: 'go', type: 'root', gloss: '走、经历' }],
      rootNote: 'under-（在下）+ go（走）→ 从下面走过 → 经历、承受。',
      example: 'Many industries will undergo profound change as automation spreads through the economy.',
      exampleZh: '随着自动化在经济中扩散，许多行业将经历深刻变革。',
      collocations: ['undergo surgery', 'undergo change', 'undergo training'],
      synonyms: [
        { word: 'experience', note: '最通用，可指正面或负面经历。' },
        { word: 'endure', note: '强调忍受痛苦或困难，语气更强。' }
      ],
      confusables: [
        { word: 'undertake', note: 'undertake 是“承担；着手做”，不是“经历”。' }
      ]
    }),

    /* ---------------- e- / ex- ---------------- */
    W('evoke', '/ɪˈvəʊk/', 'v.', '唤起；引发（记忆、情感）', 'to bring a feeling or memory into the mind', {
      freq: 4, level: 'hard', theme: 'culture', affixIds: ['ex'], root: { id: 'voc', label: 'voc', meaning: '叫' },
      morph: [{ text: 'e-', type: 'prefix', gloss: 'out 向外' }, { text: 'voke', type: 'root', gloss: 'call 叫' }],
      rootNote: 'e-（向外）+ voke（叫）→ 把记忆或情感叫出来 → 唤起。',
      example: 'The old photographs evoked memories of a neighborhood that no longer exists.',
      exampleZh: '这些老照片唤起了对一个已不复存在的街区的记忆。',
      collocations: ['evoke memories', 'evoke a response', 'evoke nostalgia'],
      synonyms: [
        { word: 'arouse', note: '常与 interest、suspicion 等搭配，可指激起情绪。' },
        { word: 'elicit', note: '强调引出信息或反应，常用于提问、研究。' }
      ],
      confusables: [
        { word: 'invoke', note: 'invoke 是“援引；祈求”，in- 向内。' },
        { word: 'provoke', note: 'provoke 常指激怒或引发争议，语气更强。' }
      ]
    }),
    W('exceed', '/ɪkˈsiːd/', 'v.', '超过；超出；胜过', 'to be greater than a number or limit', {
      freq: 4, level: 'core', theme: 'technology', affixIds: ['ex'], root: { id: 'ced', label: 'ced', meaning: '走' },
      morph: [{ text: 'ex-', type: 'prefix', gloss: 'beyond 超出' }, { text: 'ceed', type: 'root', gloss: 'go 走' }],
      rootNote: 'ex-（超出）+ ceed（走）→ 走出界限 → 超过。',
      example: 'The demand for skilled workers now exceeds the supply in many growing industries.',
      exampleZh: '在许多成长型行业中，对熟练工人的需求现已超过供给。',
      collocations: ['exceed expectations', 'exceed the limit', 'far exceed'],
      synonyms: [
        { word: 'surpass', note: '强调比预期或对手更好，常与 expectations 搭配。' },
        { word: 'outstrip', note: '强调增长或数量上超过，较正式。' }
      ],
      confusables: [
        { word: 'accede', note: 'accede 是“同意；就任”，拼写相近但含义不同。' },
        { word: 'succeed', note: 'succeed 是“成功；接替”，不是“超过”。' }
      ]
    }),
    W('exclude', '/ɪkˈskluːd/', 'v.', '排除；不包括；拒绝接纳', 'to deliberately not include something or someone', {
      freq: 5, level: 'core', theme: 'society', affixIds: ['ex'], root: { id: 'clud', label: 'clud', meaning: '关闭' },
      morph: [{ text: 'ex-', type: 'prefix', gloss: 'out 向外' }, { text: 'clude', type: 'root', gloss: 'close 关闭' }],
      rootNote: 'ex-（向外）+ clude（关闭）→ 关在门外 → 排除。',
      example: 'A healthy public debate should not exclude people who hold uncomfortable views.',
      exampleZh: '健康的公共讨论不应把持有令人不安观点的人排除在外。',
      collocations: ['exclude from', 'socially excluded', 'exclude the possibility'],
      synonyms: [
        { word: 'bar', note: '强调禁止进入，语气强。' },
        { word: 'omit', note: '强调遗漏或省略，可能并非故意。' }
      ],
      confusables: [
        { word: 'include', note: 'include 是“包括”，与 exclude 构成反义。' },
        { word: 'preclude', note: 'preclude 是“阻止；排除可能性”，更正式。' }
      ]
    }),
    W('exploit', '/ɪkˈsplɔɪt/', 'v. / n.', '利用；剥削；开发；功绩', 'to use something fully, sometimes unfairly, for profit', {
      freq: 4, level: 'hard', theme: 'technology', affixIds: ['ex'], root: { id: 'ploit', label: 'ploit', meaning: '展开' },
      morph: [{ text: 'ex-', type: 'prefix', gloss: 'out 向外' }, { text: 'ploit', type: 'root', gloss: 'fold 展开' }],
      rootNote: 'ex-（向外）+ ploit（展开）→ 把资源展开利用 → 开发；也可指剥削。',
      example: 'Companies that exploit personal data without consent risk losing public trust.',
      exampleZh: '未经同意利用个人数据的公司，可能失去公众信任。',
      collocations: ['exploit resources', 'exploit workers', 'fully exploit'],
      synonyms: [
        { word: 'utilize', note: '中性，强调有效利用资源。' },
        { word: 'take advantage of', note: '常带贬义，强调占便宜。' }
      ],
      confusables: [
        { word: 'explicit', note: 'explicit 是“明确的；露骨的”，拼写相近但含义不同。' }
      ]
    }),
    W('explicit', '/ɪkˈsplɪsɪt/', 'adj.', '明确的；清楚的；直言的', 'stated clearly and in detail, leaving no confusion', {
      freq: 3, level: 'hard', theme: 'culture', affixIds: ['ex'], root: { id: 'plic', label: 'plic', meaning: '折叠' },
      morph: [{ text: 'ex-', type: 'prefix', gloss: 'out 向外' }, { text: 'plicit', type: 'root', gloss: 'fold 折叠' }],
      rootNote: 'ex-（向外）+ plicit（折叠）→ 完全展开 → 明确的。',
      example: 'The guidelines are explicit about what counts as a conflict of interest.',
      exampleZh: '这些指南明确说明了什么构成利益冲突。',
      collocations: ['explicit consent', 'explicit instruction', 'make explicit'],
      synonyms: [
        { word: 'clear', note: '最通用，可指表达或视觉清楚。' },
        { word: 'unambiguous', note: '强调不存在歧义，语气更强。' }
      ],
      confusables: [
        { word: 'implicit', note: 'implicit 是“含蓄的；隐含的”，im- 向内，与 explicit 相对。' }
      ]
    }),

    /* ---------------- un- / in- / im- ---------------- */
    W('unprecedented', '/ʌnˈpresɪdentɪd/', 'adj.', '史无前例的；空前的', 'never having happened or existed before', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['negation', 'pre'], root: { id: 'ced', label: 'ced', meaning: '走' },
      morph: [{ text: 'un-', type: 'prefix', gloss: 'not 否定' }, { text: 'pre-', type: 'prefix', gloss: 'before 在前' }, { text: 'ced', type: 'root', gloss: 'go 走' }, { text: '-ent', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'un-（不）+ pre-（在前）+ ced（走）→ 前面没有走过的 → 空前的。',
      example: 'The scale of remote work during the pandemic was unprecedented in modern history.',
      exampleZh: '疫情期间远程工作的规模在现代史上是空前的。',
      collocations: ['unprecedented scale', 'unprecedented challenge', 'unprecedented growth'],
      synonyms: [
        { word: 'unparalleled', note: '强调没有可比的，语气与 unprecedented 接近。' },
        { word: 'novel', note: '强调新颖，但不一定“从未发生”。' }
      ],
      confusables: [
        { word: 'precedent', note: 'precedent 是“先例”，unprecedented 正是“没有先例的”。' }
      ]
    }),
    W('inevitable', '/ɪnˈevɪtəbl/', 'adj.', '不可避免的；必然的', 'certain to happen and impossible to avoid', {
      freq: 4, level: 'core', theme: 'technology', affixIds: ['negation', 'able'], root: { id: 'evit', label: 'evit', meaning: '避开' },
      morph: [{ text: 'in-', type: 'prefix', gloss: 'not 不' }, { text: 'evit', type: 'root', gloss: 'avoid 避开' }, { text: '-able', type: 'suffix', gloss: '能…的' }],
      rootNote: 'in-（不）+ evit（避开）+ -able（能）→ 无法避开的 → 必然的。',
      example: 'Some job displacement is inevitable, but its social cost is a matter of policy choice.',
      exampleZh: '某些岗位流失是不可避免的，但其社会成本取决于政策选择。',
      collocations: ['inevitable consequence', 'seem inevitable', 'it is inevitable that'],
      synonyms: [
        { word: 'unavoidable', note: '最直接的同义词，强调无法避免。' },
        { word: 'certain', note: '强调确定会发生，但不一定含“无法避免”意味。' }
      ],
      confusables: [
        { word: 'invaluable', note: 'invaluable 是“无价的；极宝贵的”，不是“没有价值的”。' }
      ]
    }),
    W('impartial', '/ɪmˈpɑːʃl/', 'adj.', '公正的；不偏不倚的', 'not supporting one side more than another', {
      freq: 3, level: 'hard', theme: 'society', affixIds: ['negation', 'al'], root: { id: 'part', label: 'part', meaning: '部分' },
      morph: [{ text: 'im-', type: 'prefix', gloss: 'not 不' }, { text: 'part', type: 'root', gloss: 'side 一方' }, { text: '-ial', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'im-（不）+ part（一方）+ -ial → 不偏向任何一方 → 公正的。',
      example: 'An impartial judge must set aside personal beliefs when assessing the evidence.',
      exampleZh: '公正的法官在评估证据时必须搁置个人信念。',
      collocations: ['impartial advice', 'impartial observer', 'remain impartial'],
      synonyms: [
        { word: 'unbiased', note: '强调没有先入为主的偏见，最接近。' },
        { word: 'neutral', note: '强调不站在任何一方，可用于国家、语气。' }
      ],
      confusables: [
        { word: 'partial', note: 'partial 是“部分的；偏袒的”，去掉 im- 后意思反转。' }
      ]
    }),
    W('indifferent', '/ɪnˈdɪfrənt/', 'adj.', '漠不关心的；冷淡的；一般的', 'not interested in or concerned about something', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['negation'], root: { id: 'differ', label: 'differ', meaning: '不同' },
      morph: [{ text: 'in-', type: 'prefix', gloss: 'not 不' }, { text: 'different', type: 'root', gloss: 'differ 区分' }],
      rootNote: 'in-（不）+ different（有区别）→ 觉得没区别 → 漠不关心。',
      example: 'People are rarely indifferent to how their personal data is used once they understand the risks.',
      exampleZh: '一旦了解风险，人们很少会对自己个人数据的使用方式漠不关心。',
      collocations: ['indifferent to', 'seemingly indifferent', 'indifferent quality'],
      synonyms: [
        { word: 'unconcerned', note: '强调不担心、不在意，语气较直接。' },
        { word: 'apathetic', note: '强调缺乏兴趣或行动意愿，程度更强。' }
      ],
      confusables: [
        { word: 'different', note: 'different 是“不同的”，加 in- 后不是“不同的”，而是“漠不关心”。' }
      ]
    }),
    W('indispensable', '/ˌɪndɪˈspensəbl/', 'adj.', '不可或缺的；必不可少的', 'so important that you cannot manage without it', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['negation', 'able'], root: { id: 'pens', label: 'pens', meaning: '称量' },
      morph: [{ text: 'in-', type: 'prefix', gloss: 'not 不' }, { text: 'dispens', type: 'root', gloss: 'weigh out 分配' }, { text: '-able', type: 'suffix', gloss: '能…的' }],
      rootNote: 'in-（不）+ dispensable（可省去的）→ 不能省去的 → 不可或缺的。',
      example: 'Trust is indispensable to any system that depends on strangers cooperating.',
      exampleZh: '对于任何依赖陌生人合作的体系来说，信任都不可或缺。',
      collocations: ['indispensable to', 'indispensable tool', 'absolutely indispensable'],
      synonyms: [
        { word: 'essential', note: '最通用，强调绝对必要。' },
        { word: 'crucial', note: '强调对结果起决定作用，语气略弱于 indispensable。' }
      ],
      confusables: [
        { word: 'dispensable', note: 'dispensable 是“可有可无的”，去掉 in- 后意思反转。' }
      ]
    }),

    /* ---------------- -tion / -sion ---------------- */
    W('innovation', '/ˌɪnəˈveɪʃn/', 'n.', '创新；新事物', 'a new idea, method, or product', {
      freq: 5, level: 'core', theme: 'technology', affixIds: ['tion'], root: { id: 'nov', label: 'nov', meaning: '新' },
      morph: [{ text: 'in-', type: 'prefix', gloss: 'in 进入' }, { text: 'nov', type: 'root', gloss: 'new 新' }, { text: '-ation', type: 'suffix', gloss: 'n. 行为' }],
      rootNote: 'in-（进入）+ nov（新）+ -ation → 引入新事物 → 创新。',
      example: 'Innovation rarely follows a straight line from research to market success.',
      exampleZh: '创新很少沿着从研究到市场成功的直线路径发展。',
      collocations: ['technological innovation', 'drive innovation', 'innovation policy'],
      synonyms: [
        { word: 'invention', note: '强调创造出前所未有的东西，innovation 更强调应用与推广。' },
        { word: 'novelty', note: '强调新颖性，不一定有实用价值。' }
      ],
      confusables: [
        { word: 'invasion', note: 'invasion 是“入侵”，拼写相近但含义完全不同。' }
      ]
    }),
    W('assumption', '/əˈsʌmpʃn/', 'n.', '假设；假定；承担', 'something that you accept as true without proof', {
      freq: 5, level: 'core', theme: 'education', affixIds: ['tion'], root: { id: 'sumpt', label: 'sumpt', meaning: '拿、取' },
      morph: [{ text: 'as-', type: 'prefix', gloss: 'to 向' }, { text: 'sumpt', type: 'root', gloss: 'take 拿' }, { text: '-ion', type: 'suffix', gloss: 'n. 行为' }],
      rootNote: 'as-（向）+ sumpt（拿）→ 先拿来当作真的 → 假设。',
      example: 'The argument rests on the assumption that economic growth will continue indefinitely.',
      exampleZh: '这一论点建立在经济增长将无限持续的假设之上。',
      collocations: ['on the assumption that', 'challenge an assumption', 'basic assumption'],
      synonyms: [
        { word: 'presumption', note: '更正式，常指未经证明就相信，可能含“冒昧”意味。' },
        { word: 'hypothesis', note: '强调待验证的科学假设，更严谨。' }
      ],
      confusables: [
        { word: 'consumption', note: 'consumption 是“消费；消耗”，拼写相近但含义不同。' }
      ]
    }),
    W('consumption', '/kənˈsʌmpʃn/', 'n.', '消费；消耗；食用', 'the act of using energy, goods, or food', {
      freq: 4, level: 'core', theme: 'environment', affixIds: ['tion'], root: { id: 'sumpt', label: 'sumpt', meaning: '拿、取' },
      morph: [{ text: 'con-', type: 'prefix', gloss: '完全' }, { text: 'sumpt', type: 'root', gloss: 'take 拿' }, { text: '-ion', type: 'suffix', gloss: 'n. 行为' }],
      rootNote: 'con-（完全）+ sumpt（拿）→ 全部用掉 → 消费、消耗。',
      example: 'Reducing energy consumption in cities requires changes in both technology and behavior.',
      exampleZh: '降低城市能源消耗，既需要技术变革，也需要行为改变。',
      collocations: ['energy consumption', 'consumption patterns', 'mass consumption'],
      synonyms: [
        { word: 'use', note: '最通用，不一定是“消费”。' },
        { word: 'expenditure', note: '强调支出或耗费，常用于财政、能源。' }
      ],
      confusables: [
        { word: 'assumption', note: 'assumption 是“假设”，与“消费”只差前缀。' }
      ]
    }),
    W('perception', '/pəˈsepʃn/', 'n.', '感知；看法；洞察力', 'the way you think about or understand something', {
      freq: 5, level: 'core', theme: 'culture', affixIds: ['tion'], root: { id: 'cept', label: 'cept', meaning: '拿、抓' },
      morph: [{ text: 'per-', type: 'prefix', gloss: 'through 穿过' }, { text: 'cept', type: 'root', gloss: 'take 拿' }, { text: '-ion', type: 'suffix', gloss: 'n. 行为' }],
      rootNote: 'per-（穿过）+ cept（拿）→ 通过感官抓住 → 感知、看法。',
      example: 'Public perception of risk often lags behind the actual evidence.',
      exampleZh: '公众对风险的感知往往滞后于实际证据。',
      collocations: ['public perception', 'perception of', 'shape perception'],
      synonyms: [
        { word: 'awareness', note: '强调意识到，不一定形成判断。' },
        { word: 'view', note: '最通用，指看法或观点。' }
      ],
      confusables: [
        { word: 'reception', note: 'reception 是“接待； reception 信号”，不是“感知”。' },
        { word: 'deception', note: 'deception 是“欺骗”，de- 向下/离开。' }
      ]
    }),
    W('distinction', '/dɪˈstɪŋkʃn/', 'n.', '区别；卓越；荣誉', 'a clear difference between two similar things', {
      freq: 4, level: 'core', theme: 'education', affixIds: ['tion'], root: { id: 'stinct', label: 'stinct', meaning: '刺、标记' },
      morph: [{ text: 'dis-', type: 'prefix', gloss: 'apart 分开' }, { text: 'stinct', type: 'root', gloss: 'mark 标记' }, { text: '-ion', type: 'suffix', gloss: 'n. 行为' }],
      rootNote: 'dis-（分开）+ stinct（标记）→ 用标记分开 → 区别。',
      example: 'The distinction between information and knowledge matters more than ever.',
      exampleZh: '信息与知识之间的区别，如今比以往任何时候都更重要。',
      collocations: ['make a distinction', 'clear distinction', 'of distinction'],
      synonyms: [
        { word: 'difference', note: '最通用，distinction 更正式、更强调清晰界限。' },
        { word: 'contrast', note: '强调对比之下显现的差异。' }
      ],
      confusables: [
        { word: 'extinction', note: 'extinction 是“灭绝”，ex- 向外。' },
        { word: 'instinct', note: 'instinct 是“本能”，in- 向内。' }
      ]
    }),
    W('implication', '/ˌɪmplɪˈkeɪʃn/', 'n.', '影响；含义；暗示', 'a possible effect or a meaning that is not stated directly', {
      freq: 5, level: 'hard', theme: 'society', affixIds: ['tion'], root: { id: 'plic', label: 'plic', meaning: '折叠' },
      morph: [{ text: 'im-', type: 'prefix', gloss: 'in 向内' }, { text: 'plic', type: 'root', gloss: 'fold 折叠' }, { text: '-ation', type: 'suffix', gloss: 'n. 行为' }],
      rootNote: 'im-（向内）+ plic（折叠）→ 折在里面 → 隐含的意义、影响。',
      example: 'The implication is that schools should teach judgment, not merely facts.',
      exampleZh: '其言下之意是，学校应教授判断力，而不仅仅是事实。',
      collocations: ['have implications for', 'by implication', 'policy implications'],
      synonyms: [
        { word: 'consequence', note: '强调结果，不强调“隐含意义”。' },
        { word: 'suggestion', note: '可指暗示，但语气更弱、更日常。' }
      ],
      confusables: [
        { word: 'application', note: 'application 是“申请；应用”，与“影响”不同。' }
      ]
    }),
    W('justification', '/ˌdʒʌstɪfɪˈkeɪʃn/', 'n.', '理由；辩护；正当化', 'a good reason for doing something', {
      freq: 3, level: 'hard', theme: 'society', affixIds: ['tion'], root: { id: 'just', label: 'just', meaning: '公正' },
      morph: [{ text: 'just', type: 'root', gloss: 'right 公正' }, { text: '-ification', type: 'suffix', gloss: 'n. 使…化' }],
      rootNote: 'just（公正）+ -ification（使…化）→ 使某事显得正当 → 辩护理由。',
      example: 'National security is often used as a justification for limiting civil liberties.',
      exampleZh: '国家安全常被用作限制公民自由的理由。',
      collocations: ['justification for', 'without justification', 'moral justification'],
      synonyms: [
        { word: 'rationale', note: '强调一套行动背后的基本理由，更正式。' },
        { word: 'defense', note: '强调为某事辩护的行为。' }
      ],
      confusables: [
        { word: 'justice', note: 'justice 是“正义”，justification 是“理由；辩护”。' }
      ]
    }),

    /* ---------------- -ity ---------------- */
    W('ambiguity', '/ˌæmbɪˈɡjuːəti/', 'n.', '歧义；模糊；模棱两可', 'the state of having more than one possible meaning', {
      freq: 3, level: 'hard', theme: 'culture', affixIds: ['ity'], root: { id: 'ambig', label: 'ambig', meaning: '游移' },
      morph: [{ text: 'ambi-', type: 'prefix', gloss: 'both 两边' }, { text: 'ig', type: 'root', gloss: 'drive 驱动' }, { text: '-uity', type: 'suffix', gloss: 'n. 状态' }],
      rootNote: 'ambi-（两边）+ ig（驱动）→ 被拉向两边 → 模棱两可。',
      example: 'The ambiguity of the regulation allows companies to interpret it in self-serving ways.',
      exampleZh: '法规的模糊性使公司能够以有利于自己的方式解读它。',
      collocations: ['avoid ambiguity', 'moral ambiguity', 'ambiguity in'],
      synonyms: [
        { word: 'vagueness', note: '强调不清楚、不具体，贬义较强。' },
        { word: 'uncertainty', note: '强调不确定，不一定是“多重含义”。' }
      ],
      confusables: [
        { word: 'ambition', note: 'ambition 是“雄心”，拼写极相近，是高频易混词。' }
      ]
    }),
    W('diversity', '/daɪˈvɜːsəti/', 'n.', '多样性；差异', 'a range of different people or things', {
      freq: 5, level: 'core', theme: 'society', affixIds: ['ity'], root: { id: 'vers', label: 'vers', meaning: '转' },
      morph: [{ text: 'di-', type: 'prefix', gloss: 'apart 分开' }, { text: 'vers', type: 'root', gloss: 'turn 转' }, { text: '-ity', type: 'suffix', gloss: 'n. 性质' }],
      rootNote: 'di-（分开）+ vers（转）+ -ity → 转向不同方向 → 多样性。',
      example: 'Diversity of thought is more valuable to a research team than uniformity of background.',
      exampleZh: '对一个研究团队来说，思想多样性比背景一致更有价值。',
      collocations: ['cultural diversity', 'diversity of', 'promote diversity'],
      synonyms: [
        { word: 'variety', note: '最通用，强调种类多。' },
        { word: 'heterogeneity', note: '更学术，强调构成成分不同。' }
      ],
      confusables: [
        { word: 'adversity', note: 'adversity 是“逆境”，拼写相近但含义完全不同。' }
      ]
    }),
    W('integrity', '/ɪnˈteɡrəti/', 'n.', '正直；完整；诚信', 'the quality of being honest and having strong moral principles', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['ity'], root: { id: 'integr', label: 'integr', meaning: '完整' },
      morph: [{ text: 'integr', type: 'root', gloss: 'whole 完整' }, { text: '-ity', type: 'suffix', gloss: 'n. 性质' }],
      rootNote: 'integr（完整）+ -ity → 人格完整 → 正直；事物完整 → 完整性。',
      example: 'Scientific integrity depends on researchers being willing to report results that contradict their hopes.',
      exampleZh: '科研诚信有赖于研究者愿意报告与自身期望相悖的结果。',
      collocations: ['academic integrity', 'personal integrity', 'structural integrity'],
      synonyms: [
        { word: 'honesty', note: '最直接，强调不说谎。' },
        { word: 'wholeness', note: '强调完整性，不涉及道德。' }
      ],
      confusables: [
        { word: 'integration', note: 'integration 是“整合；融入”，不是“正直”。' }
      ]
    }),
    W('prosperity', '/prɒˈsperəti/', 'n.', '繁荣；成功；富裕', 'the state of being successful and having a lot of money', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['ity'], root: { id: 'sper', label: 'sper', meaning: '希望' },
      morph: [{ text: 'pro-', type: 'prefix', gloss: 'forward 向前' }, { text: 'sper', type: 'root', gloss: 'hope 希望' }, { text: '-ity', type: 'suffix', gloss: 'n. 状态' }],
      rootNote: 'pro-（向前）+ sper（希望）+ -ity → 前景充满希望 → 繁荣。',
      example: 'Long-term prosperity depends more on shared opportunity than on short-term growth.',
      exampleZh: '长期繁荣更多取决于共享机会，而不是短期增长。',
      collocations: ['economic prosperity', 'shared prosperity', 'prosperity and stability'],
      synonyms: [
        { word: 'wealth', note: '强调财富本身，prosperity 更强调整体繁荣状态。' },
        { word: 'success', note: '最通用，可指个人或事业成功。' }
      ],
      confusables: [
        { word: 'property', note: 'property 是“财产；房产”，拼写相近但含义不同。' }
      ]
    }),
    W('vulnerability', '/ˌvʌlnərəˈbɪləti/', 'n.', '脆弱性；易受伤害', 'the state of being easily harmed physically or emotionally', {
      freq: 4, level: 'hard', theme: 'society', affixIds: ['ity'], root: { id: 'vulner', label: 'vulner', meaning: '受伤' },
      morph: [{ text: 'vulner', type: 'root', gloss: 'wound 伤' }, { text: '-ability', type: 'suffix', gloss: 'n. 能力/状态' }],
      rootNote: 'vulner（受伤）+ -ability → 容易受伤的状态 → 脆弱性。',
      example: 'The pandemic exposed the vulnerability of workers who lack paid sick leave.',
      exampleZh: '疫情暴露了没有带薪病假的劳动者的脆弱性。',
      collocations: ['vulnerability to', 'reduce vulnerability', 'emotional vulnerability'],
      synonyms: [
        { word: 'weakness', note: '最通用，可指人或系统的弱点。' },
        { word: 'exposure', note: '强调暴露在风险中，不一定是内在脆弱。' }
      ],
      confusables: [
        { word: 'availability', note: 'availability 是“可用性”，拼写相近但含义不同。' }
      ]
    }),

    /* ---------------- -ize / -ify ---------------- */
    W('emphasize', '/ˈemfəsaɪz/', 'v.', '强调；重视', 'to give special importance to something', {
      freq: 5, level: 'core', theme: 'education', affixIds: ['ize'], root: { id: 'phas', label: 'phas', meaning: '显示' },
      morph: [{ text: 'em-', type: 'prefix', gloss: 'in 进入' }, { text: 'phas', type: 'root', gloss: 'show 显示' }, { text: '-ize', type: 'suffix', gloss: 'v. 使' }],
      rootNote: 'em-（进入）+ phas（显示）+ -ize → 使显现出来 → 强调。',
      example: 'The report emphasizes that technology alone cannot solve structural inequality.',
      exampleZh: '报告强调，仅靠技术无法解决结构性不平等。',
      collocations: ['emphasize the importance', 'strongly emphasize', 'emphasize that'],
      synonyms: [
        { word: 'stress', note: '最接近，常与 importance、need 搭配。' },
        { word: 'highlight', note: '强调使某点突出，常用于展示、总结。' }
      ],
      confusables: [
        { word: 'emphasis', note: 'emphasis 是名词，emphasize 是动词，注意词性。' },
        { word: 'empathize', note: 'empathize 是“共情”，不是“强调”。' }
      ]
    }),
    W('prioritize', '/praɪˈɒrətaɪz/', 'v.', '优先处理；按优先级排序', 'to decide which things are most important and do them first', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['ize'], root: { id: 'prior', label: 'prior', meaning: '在前' },
      morph: [{ text: 'prior', type: 'root', gloss: 'before 在前' }, { text: '-itize', type: 'suffix', gloss: 'v. 使' }],
      rootNote: 'prior（在前）+ -itize → 把…放在前面 → 优先处理。',
      example: 'Governments facing limited budgets must prioritize the needs they can realistically meet.',
      exampleZh: '面临有限预算的政府必须优先处理那些实际能够满足的需求。',
      collocations: ['prioritize tasks', 'prioritize spending', 'top priority'],
      synonyms: [
        { word: 'rank', note: '强调排序，不一定涉及“优先行动”。' },
        { word: 'put first', note: '最口语，强调把某事放在首位。' }
      ],
      confusables: [
        { word: 'priority', note: 'priority 是名词“优先事项”，prioritize 是动词。' }
      ]
    }),
    W('stabilize', '/ˈsteɪbəlaɪz/', 'v.', '稳定；使稳固', 'to become or make something stable', {
      freq: 3, level: 'core', theme: 'society', affixIds: ['ize'], root: { id: 'sta', label: 'sta', meaning: '站立' },
      morph: [{ text: 'stabil', type: 'root', gloss: 'stand 站' }, { text: '-ize', type: 'suffix', gloss: 'v. 使' }],
      rootNote: 'stabil（站得稳）+ -ize → 使站稳 → 稳定。',
      example: 'The new policy is intended to stabilize housing prices without freezing the market.',
      exampleZh: '新政策旨在稳定房价，同时不使市场陷入停滞。',
      collocations: ['stabilize prices', 'stabilize the economy', 'stabilize a situation'],
      synonyms: [
        { word: 'steady', note: '作动词时强调使平稳，较口语。' },
        { word: 'balance', note: '强调平衡，不一定是“稳定”。' }
      ],
      confusables: [
        { word: 'mobilize', note: 'mobilize 是“动员”，拼写相近但含义不同。' }
      ]
    }),
    W('justify', '/ˈdʒʌstɪfaɪ/', 'v.', '证明…正当；为…辩护', 'to give a good reason for something', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['ize'], root: { id: 'just', label: 'just', meaning: '公正' },
      morph: [{ text: 'just', type: 'root', gloss: 'right 公正' }, { text: '-ify', type: 'suffix', gloss: 'v. 使' }],
      rootNote: 'just（公正）+ -ify（使）→ 使显得公正 → 证明正当。',
      example: 'The ends do not always justify the means, especially when basic rights are at stake.',
      exampleZh: '目的并不总能证明手段正当，尤其当基本权利受到威胁时。',
      collocations: ['justify a decision', 'justify doing', 'difficult to justify'],
      synonyms: [
        { word: 'defend', note: '强调为观点或行为辩护，可用于争论。' },
        { word: 'warrant', note: '更正式，强调情况足以使某事合理。' }
      ],
      confusables: [
        { word: 'justice', note: 'justice 是名词“正义”，justify 是动词“证明正当”。' }
      ]
    }),
    W('clarify', '/ˈklærəfaɪ/', 'v.', '澄清；阐明；使清楚', 'to make something easier to understand', {
      freq: 4, level: 'core', theme: 'education', affixIds: ['ize'], root: { id: 'clar', label: 'clar', meaning: '清楚' },
      morph: [{ text: 'clar', type: 'root', gloss: 'clear 清楚' }, { text: '-ify', type: 'suffix', gloss: 'v. 使' }],
      rootNote: 'clar（清楚）+ -ify（使）→ 使清楚 → 澄清。',
      example: 'The spokesperson clarified that the new rule would not apply to existing employees.',
      exampleZh: '发言人澄清，新规定不会适用于现有员工。',
      collocations: ['clarify a point', 'clarify the situation', 'to clarify'],
      synonyms: [
        { word: 'explain', note: '最通用，强调说明原因或过程。' },
        { word: 'elucidate', note: '更正式，强调把复杂问题讲清楚。' }
      ],
      confusables: [
        { word: 'classify', note: 'classify 是“分类”，拼写相近但含义不同。' }
      ]
    }),

    /* ---------------- -ous ---------------- */
    W('ambiguous', '/æmˈbɪɡjuəs/', 'adj.', '模棱两可的；含糊不清的', 'having more than one possible meaning', {
      freq: 4, level: 'hard', theme: 'culture', affixIds: ['ous'], root: { id: 'ambig', label: 'ambig', meaning: '游移' },
      morph: [{ text: 'ambi-', type: 'prefix', gloss: 'both 两边' }, { text: 'gu', type: 'root', gloss: 'drive 驱动' }, { text: '-ous', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'ambi-（两边）+ gu（驱动）→ 被拉向两边 → 模棱两可的。',
      example: 'The instructions were so ambiguous that two departments reached opposite conclusions.',
      exampleZh: '这些指示如此含糊，以至于两个部门得出了相反的结论。',
      collocations: ['ambiguous language', 'morally ambiguous', 'remain ambiguous'],
      synonyms: [
        { word: 'vague', note: '强调不具体、不清楚，不一定有“多重含义”。' },
        { word: 'equivocal', note: '更正式，强调故意含糊、可作多种解释。' }
      ],
      confusables: [
        { word: 'ambitious', note: 'ambitious 是“有雄心的”，拼写极相近，是经典易混词。' }
      ]
    }),
    W('conspicuous', '/kənˈspɪkjuəs/', 'adj.', '显眼的；引人注目的', 'very noticeable or attracting attention', {
      freq: 3, level: 'hard', theme: 'culture', affixIds: ['ous'], root: { id: 'spic', label: 'spic', meaning: '看' },
      morph: [{ text: 'con-', type: 'prefix', gloss: 'together 完全' }, { text: 'spic', type: 'root', gloss: 'look 看' }, { text: '-uous', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'con-（完全）+ spic（看）+ -uous → 完全能被看见 → 显眼的。',
      example: 'Conspicuous consumption has become less socially acceptable among younger consumers.',
      exampleZh: '在年轻消费者中，炫耀性消费已变得不那么被社会接受。',
      collocations: ['conspicuous consumption', 'conspicuous absence', 'conspicuous by absence'],
      synonyms: [
        { word: 'noticeable', note: '最通用，强调容易注意到。' },
        { word: 'obvious', note: '强调显而易见，语气更强。' }
      ],
      confusables: [
        { word: 'suspicious', note: 'suspicious 是“可疑的；多疑的”，拼写相近但含义不同。' }
      ]
    }),
    W('rigorous', '/ˈrɪɡərəs/', 'adj.', '严格的；严谨的；缜密的', 'very careful and thorough', {
      freq: 4, level: 'hard', theme: 'education', affixIds: ['ous'], root: { id: 'rig', label: 'rig', meaning: '僵硬' },
      morph: [{ text: 'rigor', type: 'root', gloss: 'stiff 严格' }, { text: '-ous', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'rigor（严格）+ -ous → 严格认真的 → 严谨的。',
      example: 'Rigorous peer review remains one of the best safeguards against flawed research.',
      exampleZh: '严谨的同行评审仍是防止缺陷研究的最佳保障之一。',
      collocations: ['rigorous analysis', 'rigorous standards', 'rigorous testing'],
      synonyms: [
        { word: 'strict', note: '强调规则执行严格，不一定含“缜密”。' },
        { word: 'thorough', note: '强调彻底、细致，最接近。' }
      ],
      confusables: [
        { word: 'vigorous', note: 'vigorous 是“有活力的；强健的”，拼写只差一个字母。' }
      ]
    }),
    W('tedious', '/ˈtiːdiəs/', 'adj.', '冗长乏味的；单调的', 'boring and lasting for a long time', {
      freq: 3, level: 'hard', theme: 'education', affixIds: ['ous'], root: { id: 'taed', label: 'taed', meaning: '厌倦' },
      morph: [{ text: 'tedi', type: 'root', gloss: 'weary 厌倦' }, { text: '-ous', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'tedi（厌倦）+ -ous → 令人厌倦的 → 冗长乏味的。',
      example: 'The tedious process of verifying every source slowed the investigation considerably.',
      exampleZh: '核实每一个来源的繁琐过程大大拖慢了调查进度。',
      collocations: ['tedious task', 'tedious process', 'seemingly tedious'],
      synonyms: [
        { word: 'boring', note: '最口语，最通用。' },
        { word: 'monotonous', note: '强调单调重复，不一定“冗长”。' }
      ],
      confusables: [
        { word: 'tenuous', note: 'tenuous 是“脆弱的；牵强的”，拼写相近但含义不同。' }
      ]
    }),
    W('unanimous', '/juˈnænɪməs/', 'adj.', '一致同意的；全体一致的', 'agreed by everyone in a group', {
      freq: 3, level: 'hard', theme: 'society', affixIds: ['ous'], root: { id: 'anim', label: 'anim', meaning: '心、精神' },
      morph: [{ text: 'un-', type: 'prefix', gloss: 'one 一' }, { text: 'anim', type: 'root', gloss: 'mind 心' }, { text: '-ous', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'un-（一）+ anim（心）+ -ous → 一条心 → 全体一致的。',
      example: 'The committee reached a unanimous decision after months of disagreement.',
      exampleZh: '在数月分歧之后，委员会达成了一致决定。',
      collocations: ['unanimous decision', 'unanimous support', 'unanimous agreement'],
      synonyms: [
        { word: 'united', note: '强调团结，不一定所有人都同意。' },
        { word: 'consensual', note: '强调基于共识，较正式。' }
      ],
      confusables: [
        { word: 'anonymous', note: 'anonymous 是“匿名的”，拼写极相近，是高频易混词。' }
      ]
    }),

    /* ---------------- -ive ---------------- */
    W('exclusive', '/ɪkˈskluːsɪv/', 'adj. / n.', '独有的；排他的；高级的', 'limited to a particular person or group', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['ive'], root: { id: 'clud', label: 'clud', meaning: '关闭' },
      morph: [{ text: 'ex-', type: 'prefix', gloss: 'out 向外' }, { text: 'clus', type: 'root', gloss: 'close 关闭' }, { text: '-ive', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'ex-（向外）+ clus（关闭）→ 把别人关在外面 → 排他的、独有的。',
      example: 'Exclusive access to data has become a major source of competitive advantage.',
      exampleZh: '对数据的独家访问权已成为竞争优势的主要来源。',
      collocations: ['exclusive access', 'mutually exclusive', 'exclusive interview'],
      synonyms: [
        { word: 'sole', note: '强调唯一，不强调“排他”。' },
        { word: 'select', note: '强调精选、限于少数人。' }
      ],
      confusables: [
        { word: 'inclusive', note: 'inclusive 是“包容的”，与 exclusive 相对。' },
        { word: 'elusive', note: 'elusive 是“难以捉摸的”，拼写相近但含义不同。' }
      ]
    }),
    W('sensitive', '/ˈsensətɪv/', 'adj.', '敏感的；体贴的；易受影响的', 'easily affected or offended by things', {
      freq: 5, level: 'core', theme: 'self', affixIds: ['ive'], root: { id: 'sens', label: 'sens', meaning: '感觉' },
      morph: [{ text: 'sens', type: 'root', gloss: 'feel 感觉' }, { text: '-itive', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'sens（感觉）+ -itive → 容易感受的 → 敏感的。',
      example: 'Teenagers are especially sensitive to how their peers respond to their mistakes.',
      exampleZh: '青少年尤其在意同伴如何回应自己的错误。',
      collocations: ['sensitive to', 'sensitive information', 'highly sensitive'],
      synonyms: [
        { word: 'delicate', note: '强调需要小心处理，也可指身体脆弱。' },
        { word: 'responsive', note: '强调反应快，不一定是“敏感”。' }
      ],
      confusables: [
        { word: 'sensible', note: 'sensible 是“明智的；合理的”，不是“敏感的”。' }
      ]
    }),
    W('innovative', '/ˈɪnəveɪtɪv/', 'adj.', '创新的；革新的', 'introducing new ideas or methods', {
      freq: 4, level: 'core', theme: 'technology', affixIds: ['ive'], root: { id: 'nov', label: 'nov', meaning: '新' },
      morph: [{ text: 'in-', type: 'prefix', gloss: 'in 进入' }, { text: 'nov', type: 'root', gloss: 'new 新' }, { text: '-ative', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'in-（进入）+ nov（新）+ -ative → 引入新意的 → 创新的。',
      example: 'Innovative firms often fail not because their ideas are bad but because they scale too early.',
      exampleZh: '创新型企业失败，往往不是因为想法不好，而是因为过早扩张。',
      collocations: ['innovative approach', 'innovative technology', 'highly innovative'],
      synonyms: [
        { word: 'inventive', note: '强调有发明创造力。' },
        { word: 'original', note: '强调原创、不模仿。' }
      ],
      confusables: [
        { word: 'initiative', note: 'initiative 是“倡议；主动性”，不是“创新的”。' }
      ]
    }),
    W('persuasive', '/pəˈsweɪsɪv/', 'adj.', '有说服力的；令人信服的', 'good at making people agree with you', {
      freq: 4, level: 'hard', theme: 'culture', affixIds: ['ive'], root: { id: 'suas', label: 'suas', meaning: '劝' },
      morph: [{ text: 'per-', type: 'prefix', gloss: 'through 彻底' }, { text: 'suas', type: 'root', gloss: 'urge 劝' }, { text: '-ive', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'per-（彻底）+ suas（劝）+ -ive → 彻底劝动 → 有说服力的。',
      example: 'A persuasive essay does not merely assert a view; it anticipates objections and answers them.',
      exampleZh: '一篇有说服力的文章不只是断言观点，还会预判并回应反对意见。',
      collocations: ['persuasive argument', 'persuasive evidence', 'highly persuasive'],
      synonyms: [
        { word: 'convincing', note: '最通用，强调使人相信。' },
        { word: 'cogent', note: '更正式，强调论证严密有力。' }
      ],
      confusables: [
        { word: 'pervasive', note: 'pervasive 是“普遍的；弥漫的”，拼写相近但含义不同。' }
      ]
    }),

    /* ---------------- -ent / -ant ---------------- */
    W('consistent', '/kənˈsɪstənt/', 'adj.', '一致的；持续的；始终如一的', 'always behaving or happening in the same way', {
      freq: 5, level: 'core', theme: 'self', affixIds: ['ent'], root: { id: 'sist', label: 'sist', meaning: '站立' },
      morph: [{ text: 'con-', type: 'prefix', gloss: 'together 一起' }, { text: 'sist', type: 'root', gloss: 'stand 站' }, { text: '-ent', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'con-（一起）+ sist（站）+ -ent → 站在一起 → 一致的。',
      example: 'The findings are consistent with earlier studies conducted in different countries.',
      exampleZh: '这些发现与在不同国家开展的早期研究一致。',
      collocations: ['consistent with', 'consistent effort', 'remain consistent'],
      synonyms: [
        { word: 'coherent', note: '强调逻辑连贯，常用于论证、政策。' },
        { word: 'steady', note: '强调稳定、不波动，常用于增长、进步。' }
      ],
      confusables: [
        { word: 'constant', note: 'constant 是“不断的；恒定的”，不一定有“一致”之意。' },
        { word: 'insistent', note: 'insistent 是“坚持要求的”，语气更强。' }
      ]
    }),
    W('persistent', '/pəˈsɪstənt/', 'adj.', '坚持不懈的；持续存在的', 'continuing to exist or happen, often for longer than expected', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['ent'], root: { id: 'sist', label: 'sist', meaning: '站立' },
      morph: [{ text: 'per-', type: 'prefix', gloss: 'through 贯穿' }, { text: 'sist', type: 'root', gloss: 'stand 站' }, { text: '-ent', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'per-（贯穿）+ sist（站）+ -ent → 一直站着 → 坚持不懈的、持续的。',
      example: 'Persistent inequality in access to healthcare undermines public trust in institutions.',
      exampleZh: '医疗资源获取方面持续存在的不平等，削弱了公众对机构的信任。',
      collocations: ['persistent problem', 'persistent effort', 'persist in doing'],
      synonyms: [
        { word: 'enduring', note: '强调长期存在，不强调主动坚持。' },
        { word: 'determined', note: '强调决心，多用于人。' }
      ],
      confusables: [
        { word: 'consistent', note: 'consistent 强调前后一致，persistent 强调持续不退。' }
      ]
    }),
    W('reluctant', '/rɪˈlʌktənt/', 'adj.', '不情愿的；勉强的', 'unwilling to do something', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['ent'], root: { id: 'luct', label: 'luct', meaning: '挣扎' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'against 反' }, { text: 'luct', type: 'root', gloss: 'struggle 挣扎' }, { text: '-ant', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 're-（反）+ luct（挣扎）+ -ant → 内心抗拒 → 不情愿的。',
      example: 'Employees are often reluctant to report problems that might reflect badly on their managers.',
      exampleZh: '员工往往不愿报告可能让上司难堪的问题。',
      collocations: ['reluctant to do', 'reluctant agreement', 'be reluctant'],
      synonyms: [
        { word: 'unwilling', note: '最直接，强调不愿意。' },
        { word: 'hesitant', note: '强调犹豫，不一定是“不愿意”。' }
      ],
      confusables: [
        { word: 'relentless', note: 'relentless 是“无情的；不间断的”，拼写相近但含义不同。' }
      ]
    }),
    W('relevant', '/ˈreləvənt/', 'adj.', '相关的；切题的；有意义的', 'closely connected with what is being discussed', {
      freq: 5, level: 'core', theme: 'education', affixIds: ['ent'], root: { id: 'lev', label: 'lev', meaning: '举起' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'again 再' }, { text: 'lev', type: 'root', gloss: 'raise 举起' }, { text: '-ant', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 're-（再）+ lev（举起）+ -ant → 被重新提起、与话题相关 → 相关的。',
      example: 'Students learn more when they can see how a concept is relevant to their own lives.',
      exampleZh: '当学生能看到一个概念与自己的生活相关时，他们学得更多。',
      collocations: ['relevant to', 'highly relevant', 'relevant information'],
      synonyms: [
        { word: 'pertinent', note: '更正式，强调与议题直接相关。' },
        { word: 'related', note: '最通用，关系可能较宽泛。' }
      ],
      confusables: [
        { word: 'irrelevant', note: 'irrelevant 是“不相关的”，加 ir- 后意思反转。' }
      ]
    }),
    W('dominant', '/ˈdɒmɪnənt/', 'adj.', '占主导地位的；显著的', 'most important, powerful, or noticeable', {
      freq: 4, level: 'core', theme: 'society', affixIds: ['ent'], root: { id: 'domin', label: 'domin', meaning: '支配' },
      morph: [{ text: 'domin', type: 'root', gloss: 'master 支配' }, { text: '-ant', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'domin（支配）+ -ant → 支配性的 → 占主导地位的。',
      example: 'A dominant platform can shape the rules of an entire market without owning it.',
      exampleZh: '一个占主导地位的平台即使不拥有整个市场，也能塑造其规则。',
      collocations: ['dominant position', 'dominant culture', 'increasingly dominant'],
      synonyms: [
        { word: 'prevailing', note: '强调当前盛行，语气比 dominant 弱。' },
        { word: 'controlling', note: '强调控制力，可用于股权、利益。' }
      ],
      confusables: [
        { word: 'dormant', note: 'dormant 是“休眠的；潜伏的”，拼写相近但含义不同。' }
      ]
    }),

    /* ---------------- -al ---------------- */
    W('conventional', '/kənˈvenʃənl/', 'adj.', '传统的；常规的；惯例的', 'based on what is generally done or believed', {
      freq: 5, level: 'core', theme: 'society', affixIds: ['al'], root: { id: 'ven', label: 'ven', meaning: '来' },
      morph: [{ text: 'con-', type: 'prefix', gloss: 'together 一起' }, { text: 'vent', type: 'root', gloss: 'come 来' }, { text: '-ional', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'con-（一起）+ vent（来）+ -ional → 大家一起来的 → 惯例的、传统的。',
      example: 'Conventional wisdom says that competition improves quality, but the evidence is mixed.',
      exampleZh: '传统观点认为竞争会提升质量，但证据并不一致。',
      collocations: ['conventional wisdom', 'conventional approach', 'conventional energy'],
      synonyms: [
        { word: 'traditional', note: '强调历史传承，时间跨度更长。' },
        { word: 'customary', note: '强调符合习俗或惯例。' }
      ],
      confusables: [
        { word: 'convenient', note: 'convenient 是“方便的”，拼写相近但含义不同。' }
      ]
    }),
    W('controversial', '/ˌkɒntrəˈvɜːʃl/', 'adj.', '有争议的；引起争论的', 'causing a lot of disagreement', {
      freq: 5, level: 'core', theme: 'society', affixIds: ['al'], root: { id: 'vers', label: 'vers', meaning: '转' },
      morph: [{ text: 'contro-', type: 'prefix', gloss: 'against 相反' }, { text: 'vers', type: 'root', gloss: 'turn 转' }, { text: '-ial', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'contro-（相反）+ vers（转）+ -ial → 转向对立面 → 有争议的。',
      example: 'The proposal to tax sugar-sweetened drinks remains deeply controversial.',
      exampleZh: '对含糖饮料征税的提案仍然极具争议。',
      collocations: ['controversial issue', 'highly controversial', 'controversial decision'],
      synonyms: [
        { word: 'disputed', note: '强调存在争议、尚未定论。' },
        { word: 'contentious', note: '更正式，强调容易引发争论。' }
      ],
      confusables: [
        { word: 'contemporary', note: 'contemporary 是“当代的；同时代的”，不是“有争议的”。' }
      ]
    }),
    W('crucial', '/ˈkruːʃl/', 'adj.', '关键的；至关重要的', 'extremely important because it affects the result', {
      freq: 5, level: 'core', theme: 'society', affixIds: ['al'], root: { id: 'cruc', label: 'cruc', meaning: '十字' },
      morph: [{ text: 'cruc', type: 'root', gloss: 'cross 十字' }, { text: '-ial', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'cruc（十字）+ -ial → 处在十字路口、决定方向 → 关键的。',
      example: 'Early childhood is a crucial period for developing language and social skills.',
      exampleZh: '幼儿期是发展语言和社交技能的关键时期。',
      collocations: ['crucial role', 'crucial factor', 'crucial to'],
      synonyms: [
        { word: 'vital', note: '强调生命攸关、必不可少。' },
        { word: 'decisive', note: '强调对结果起决定作用。' }
      ],
      confusables: [
        { word: 'critical', note: 'critical 还可表示“批评的；危急的”，含义更宽。' }
      ]
    }),
    W('fundamental', '/ˌfʌndəˈmentl/', 'adj. / n.', '根本的；基础的；基本原理', 'forming the base of something', {
      freq: 5, level: 'core', theme: 'education', affixIds: ['al'], root: { id: 'fund', label: 'fund', meaning: '底部' },
      morph: [{ text: 'fund', type: 'root', gloss: 'bottom 底' }, { text: '-amental', type: 'suffix', gloss: 'adj. 的' }],
      rootNote: 'fund（底部）+ -amental → 处在最底层的 → 根本的。',
      example: 'Access to clean water is a fundamental right, not a market privilege.',
      exampleZh: '获得清洁水源是一项基本权利，而不是市场特权。',
      collocations: ['fundamental change', 'fundamental right', 'be fundamental to'],
      synonyms: [
        { word: 'basic', note: '最通用，强调基础、简单。' },
        { word: 'essential', note: '强调必不可少，语气更强。' }
      ],
      confusables: [
        { word: 'monumental', note: 'monumental 是“巨大的；纪念性的”，拼写相近但含义不同。' }
      ]
    }),

    /* ---------------- -able / -ible ---------------- */
    W('remarkable', '/rɪˈmɑːkəbl/', 'adj.', '非凡的；显著的；值得注意的', 'unusual or surprising in a way that deserves attention', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['able'], root: { id: 'mark', label: 'mark', meaning: '标记' },
      morph: [{ text: 're-', type: 'prefix', gloss: 'again 再' }, { text: 'mark', type: 'root', gloss: 'note 标记' }, { text: '-able', type: 'suffix', gloss: '能…的' }],
      rootNote: 're-（再）+ mark（标记）+ -able → 值得再次标记的 → 非凡的。',
      example: 'What is remarkable about the recovery is how unevenly its benefits have been shared.',
      exampleZh: '这次复苏的非凡之处在于，其收益分配得多么不均衡。',
      collocations: ['remarkable progress', 'remarkable achievement', 'it is remarkable that'],
      synonyms: [
        { word: 'extraordinary', note: '语气更强，强调超出寻常。' },
        { word: 'notable', note: '强调值得注意，程度略弱。' }
      ],
      confusables: [
        { word: 'remark', note: 'remark 是“评论；注意到”，remarkable 是“非凡的”。' }
      ]
    }),
    W('sustainable', '/səˈsteɪnəbl/', 'adj.', '可持续的；可维持的', 'able to continue for a long time without damaging the environment', {
      freq: 5, level: 'core', theme: 'environment', affixIds: ['able'], root: { id: 'ten', label: 'ten', meaning: '握住、保持' },
      morph: [{ text: 'sus-', type: 'prefix', gloss: 'under 在下' }, { text: 'tain', type: 'root', gloss: 'hold 保持' }, { text: '-able', type: 'suffix', gloss: '能…的' }],
      rootNote: 'sus-（在下）+ tain（保持）+ -able → 能从下面托住、持续下去 → 可持续的。',
      example: 'A sustainable city must be affordable for the people who keep it running.',
      exampleZh: '一座可持续的城市，必须让维持其运转的人负担得起。',
      collocations: ['sustainable development', 'environmentally sustainable', 'sustainable growth'],
      synonyms: [
        { word: 'viable', note: '强调可行、能生存，不一定涉及环境。' },
        { word: 'enduring', note: '强调持续时间长，不强调资源承受力。' }
      ],
      confusables: [
        { word: 'maintainable', note: 'maintainable 强调可维护，sustainable 更强调长期与环境代价。' }
      ]
    }),
    W('viable', '/ˈvaɪəbl/', 'adj.', '可行的；能存活的', 'able to work successfully', {
      freq: 4, level: 'hard', theme: 'technology', affixIds: ['able'], root: { id: 'via', label: 'via', meaning: '路' },
      morph: [{ text: 'vi', type: 'root', gloss: 'way 路' }, { text: '-able', type: 'suffix', gloss: '能…的' }],
      rootNote: 'vi（路）+ -able → 有路可走 → 可行的。',
      example: 'For many small towns, remote work is the only viable way to retain young talent.',
      exampleZh: '对许多小镇来说，远程工作是留住年轻人才的唯一可行方式。',
      collocations: ['viable option', 'economically viable', 'viable alternative'],
      synonyms: [
        { word: 'feasible', note: '强调技术上或现实上可行。' },
        { word: 'workable', note: '更口语，强调能实际操作。' }
      ],
      confusables: [
        { word: 'visible', note: 'visible 是“可见的”，拼写相近但含义不同。' }
      ]
    }),

    /* ---------------- -ment ---------------- */
    W('enhancement', '/ɪnˈhɑːnsmənt/', 'n.', '提高；增强；改善', 'an improvement in quality, value, or attractiveness', {
      freq: 3, level: 'hard', theme: 'technology', affixIds: ['ment'], root: { id: 'alt', label: 'alt', meaning: '高' },
      morph: [{ text: 'en-', type: 'prefix', gloss: 'make 使' }, { text: 'hance', type: 'root', gloss: 'high 高' }, { text: '-ment', type: 'suffix', gloss: 'n. 结果' }],
      rootNote: 'en-（使）+ hance（高）+ -ment → 使变高 → 提升、增强。',
      example: 'The enhancement of public spaces can improve both mental health and local business.',
      exampleZh: '改善公共空间既能促进心理健康，也能带动本地商业。',
      collocations: ['performance enhancement', 'enhancement of', 'quality enhancement'],
      synonyms: [
        { word: 'improvement', note: '最通用，强调变好。' },
        { word: 'boost', note: '更口语，强调推动增长。' }
      ],
      confusables: [
        { word: 'entertainment', note: 'entertainment 是“娱乐”，拼写相近但含义不同。' }
      ]
    }),
    W('commitment', '/kəˈmɪtmənt/', 'n.', '承诺；投入；奉献', 'a promise or dedication to something', {
      freq: 5, level: 'core', theme: 'self', affixIds: ['ment'], root: { id: 'mit', label: 'mit', meaning: '送' },
      morph: [{ text: 'com-', type: 'prefix', gloss: 'together 完全' }, { text: 'mit', type: 'root', gloss: 'send 送' }, { text: '-ment', type: 'suffix', gloss: 'n. 行为' }],
      rootNote: 'com-（完全）+ mit（送）+ -ment → 把自己完全交出去 → 承诺、投入。',
      example: 'Real commitment to equality requires changes in budgets, not only in statements.',
      exampleZh: '对平等的真正承诺需要在预算上作出改变，而不仅是表态。',
      collocations: ['commitment to', 'long-term commitment', 'make a commitment'],
      synonyms: [
        { word: 'dedication', note: '强调投入时间和精力，感情色彩更强。' },
        { word: 'pledge', note: '强调公开、正式的承诺。' }
      ],
      confusables: [
        { word: 'committee', note: 'committee 是“委员会”，拼写相近但含义不同。' }
      ]
    }),
    W('judgment', '/ˈdʒʌdʒmənt/', 'n.', '判断；判断力；判决', 'the ability to make good decisions, or an opinion', {
      freq: 4, level: 'core', theme: 'self', affixIds: ['ment'], root: { id: 'jud', label: 'jud', meaning: '判断' },
      morph: [{ text: 'jud', type: 'root', gloss: 'judge 判断' }, { text: '-ment', type: 'suffix', gloss: 'n. 行为' }],
      rootNote: 'jud（判断）+ -ment → 判断的行为或结果。',
      example: 'Good judgment comes from experience, and experience often comes from bad judgment.',
      exampleZh: '好的判断力来自经验，而经验往往来自糟糕的判断。',
      collocations: ['good judgment', 'make a judgment', 'judgment call'],
      synonyms: [
        { word: 'assessment', note: '强调评估过程，较中性。' },
        { word: 'verdict', note: '多指正式裁决或结论。' }
      ],
      confusables: [
        { word: 'judge', note: 'judge 是“法官；判断”，judgment 是名词“判断”。' }
      ]
    })
  ];

  window.YANCI_DATA = {
    meta: {
      title: '研词 YANCI',
      subtitle: '考研英语一词汇工坊',
      version: '1.0',
      totalWords: words.length,
      updated: '2026-11'
    },
    themes: themes,
    affixes: affixes,
    roots: roots,
    words: words
  };
})();
