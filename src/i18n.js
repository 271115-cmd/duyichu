/* ============================================================
   i18n.js — multi-language system (8 languages)
   ------------------------------------------------------------
   • A small CENTERED modal (auralee.jp-style) lets the visitor
     pick their language; the site stays visible behind a
     semi-transparent overlay. Not a full-screen takeover.
   • Translatable text is marked  data-i18n="key" ; the markup
     already in the page is the ENGLISH original. Other languages
     come from the T table below. Placeholders use data-i18n-ph.
   • Essential brand Chinese (都一处, the giant 都/一/处 wordmark,
     the 都 seal, 艺 marks) is decorative identity and is never
     translated. Everything else reflects the chosen language —
     no language mixing.
   ============================================================ */

import { playSwish } from './sound.js';

const STORE = 'duyichu_lang';

/* Anniversary maths so dates never go stale: {YEARS} = age since founding,
   {NOW} = current year. Replaced in every translated string at apply time. */
export const FOUNDED = 1738;
const YEARS = new Date().getFullYear() - FOUNDED;
const NOW = new Date().getFullYear();
const fillTokens = (s) => s.indexOf('{') === -1 ? s : s.replace(/\{YEARS\}/g, YEARS).replace(/\{NOW\}/g, NOW);

/* Native name + flag for the chooser. `en` is the in-page markup. */
export const LANGS = [
  { code: 'en', native: 'English',  label: 'English',              flag: '🇬🇧' },
  { code: 'zh', native: '中文',      label: 'Chinese · 简体',        flag: '🇨🇳' },
  { code: 'ja', native: '日本語',    label: 'Japanese',             flag: '🇯🇵' },
  { code: 'ko', native: '한국어',    label: 'Korean',               flag: '🇰🇷' },
  { code: 'fr', native: 'Français',  label: 'French',               flag: '🇫🇷' },
  { code: 'de', native: 'Deutsch',   native2: '', label: 'German',  flag: '🇩🇪' },
  { code: 'es', native: 'Español',   label: 'Spanish',              flag: '🇪🇸' },
  { code: 'ru', native: 'Русский',   label: 'Russian',              flag: '🇷🇺' },
];
export const CODES = LANGS.map((l) => l.code);

/* Per-key translations. `en` is omitted — it is the page markup.
   <br> and <em> are preserved; <em> wraps the emphasised phrase. */
export const T = {
  // ── navigation ──
  'nav.home':    { zh:`首页`, ja:`ホーム`, ko:`홈`, fr:`Accueil`, de:`Start`, es:`Inicio`, ru:`Главная` },
  'nav.origin':  { zh:`起源`, ja:`起源`, ko:`기원`, fr:`Origine`, de:`Ursprung`, es:`Origen`, ru:`Истоки` },
  'nav.legacy':  { zh:`传承`, ja:`伝承`, ko:`전통`, fr:`Héritage`, de:`Erbe`, es:`Legado`, ru:`Наследие` },
  'nav.craft':   { zh:`工艺`, ja:`技`, ko:`기예`, fr:`Savoir-faire`, de:`Handwerk`, es:`Oficio`, ru:`Ремесло` },
  'nav.menu':     { zh:`菜单`, ja:`メニュー`, ko:`메뉴`, fr:`Menu`, de:`Speisekarte`, es:`Menú`, ru:`Меню` },
  'nav.heritage': { zh:`传承`, ja:`伝承`, ko:`전통`, fr:`Héritage`, de:`Erbe`, es:`Legado`, ru:`Наследие` },
  'nav.gifts':    { zh:`礼盒`, ja:`ギフト`, ko:`선물`, fr:`Boutique`, de:`Geschenke`, es:`Regalos`, ru:`Подарки` },
  'nav.reserve':  { zh:`预订`, ja:`予約`, ko:`예약`, fr:`Réserver`, de:`Reservieren`, es:`Reservar`, ru:`Бронь` },
  'a11y.skip':    { zh:`跳到主要内容`, ja:`本文へスキップ`, ko:`본문으로 건너뛰기`, fr:`Aller au contenu principal`, de:`Zum Hauptinhalt springen`, es:`Saltar al contenido principal`, ru:`Перейти к основному содержанию` },

  /* Structural aria-labels / alt text. The HTML-driven ones (loading, timeline,
     the maps, the wechat QR) get their English from the markup — no 'en' needed.
     The JS-injected ones (changeLang/selectLang/close/menu) are set via t(),
     which needs an explicit 'en'. */
  'aria.changeLang': { en:`Change language`, zh:`切换语言`, ja:`言語を変更`, ko:`언어 변경`, fr:`Changer de langue`, de:`Sprache ändern`, es:`Cambiar idioma`, ru:`Сменить язык` },
  'aria.selectLang': { en:`Select language`, zh:`选择语言`, ja:`言語を選択`, ko:`언어 선택`, fr:`Choisir la langue`, de:`Sprache wählen`, es:`Seleccionar idioma`, ru:`Выбрать язык` },
  'aria.close':      { en:`Close`, zh:`关闭`, ja:`閉じる`, ko:`닫기`, fr:`Fermer`, de:`Schließen`, es:`Cerrar`, ru:`Закрыть` },
  'aria.menu':       { en:`Menu`, zh:`菜单`, ja:`メニュー`, ko:`메뉴`, fr:`Menu`, de:`Menü`, es:`Menú`, ru:`Меню` },
  'aria.loading':    { zh:`加载中`, ja:`読み込み中`, ko:`로딩 중`, fr:`Chargement`, de:`Wird geladen`, es:`Cargando`, ru:`Загрузка` },
  'aria.timeline':   { zh:`时间轴`, ja:`年表`, ko:`연표`, fr:`Chronologie`, de:`Zeitleiste`, es:`Cronología`, ru:`Хронология` },
  'aria.mapHome':    { zh:`北京都一处三家门店地图`, ja:`北京の都一处3店舗の地図`, ko:`베이징 두이추 세 매장 지도`, fr:`Carte des trois maisons Duyichu à Pékin`, de:`Karte der drei Duyichu-Häuser in Peking`, es:`Mapa de las tres casas Duyichu en Pekín`, ru:`Карта трёх ресторанов Дуйичу в Пекине` },
  'aria.mapVisit':   { zh:`北京三维地图，标注都一处三家门店`, ja:`都一处3店舗を示す北京の3Dマップ`, ko:`두이추 세 매장을 표시한 베이징 3D 지도`, fr:`Carte 3D de Pékin avec les trois maisons Duyichu`, de:`3D-Karte von Peking mit den drei Duyichu-Häusern`, es:`Mapa 3D de Pekín con las tres casas Duyichu`, ru:`3D-карта Пекина с тремя ресторанами Дуйичу` },
  'aria.wechatQr':   { zh:`微信预订二维码`, ja:`WeChat予約用QRコード`, ko:`위챗 예약 QR 코드`, fr:`QR code de réservation WeChat`, de:`WeChat-Reservierungs-QR-Code`, es:`Código QR de reserva de WeChat`, ru:`QR-код для бронирования в WeChat` },
  'aria.wechatScan': { zh:`扫码用微信预订`, ja:`スキャンしてWeChatで予約`, ko:`스캔하여 위챗으로 예약`, fr:`Scannez pour réserver sur WeChat`, de:`Scannen, um über WeChat zu reservieren`, es:`Escanee para reservar en WeChat`, ru:`Отсканируйте, чтобы забронировать в WeChat` },

  // home hero positioning + credential bar (the most important signals, elevated)
  'home.eyebrow': { zh:`御赐烧麦 · 京城前门 · 始于 1738`, ja:`勅賜の焼売 · 北京前門 · 創業 1738`, ko:`황실이 명명한 사오마이 · 베이징 첸먼 · 1738`, fr:`Shaomai impérial · Qianmen, Pékin · depuis 1738`, de:`Kaiserliches Shaomai · Qianmen, Peking · seit 1738`, es:`Shaomai imperial · Qianmen, Pekín · desde 1738`, ru:`Императорский шаомай · Цяньмэнь, Пекин · с 1738` },
  'home.scroll':  { zh:`向下滚动探索`, ja:`スクロールして見る`, ko:`스크롤하여 둘러보기`, fr:`Faites défiler`, de:`Nach unten scrollen`, es:`Desliza para explorar`, ru:`Прокрутите вниз` },
  // ── Credentials chapter (home, right after the hero) ──
  'h.cred.idx':   { zh:`信誉`, ja:`信頼の証`, ko:`신뢰의 증표`, fr:`Distinctions`, de:`Auszeichnungen`, es:`Credenciales`, ru:`Регалии` },
  'h.cred.tag':   { zh:`实至名归`, ja:`積み重ねた信頼`, ko:`쌓아온 신뢰`, fr:`Mérité, non revendiqué`, de:`Verdient, nicht behauptet`, es:`Merecido, no proclamado`, ru:`Заслужено, не заявлено` },
  'h.cred.title': { zh:`三个世纪的<br><em>声誉</em>`, ja:`三世紀の<br><em>信用</em>`, ko:`세 세기의<br><em>명성</em>`, fr:`Trois siècles<br>de <em>renom</em>`, de:`Drei Jahrhunderte<br><em>Ansehen</em>`, es:`Tres siglos<br>de <em>prestigio</em>`, ru:`Три века<br><em>репутации</em>` },
  'cb.founded':  { zh:`始创`, ja:`創業`, ko:`창업`, fr:`Fondé`, de:`Gegründet`, es:`Fundado`, ru:`Основан` },
  'cb.imperial': { zh:`乾隆御赐 · 1752`, ja:`乾隆帝より命名 · 1752`, ko:`건륭제 명명 · 1752`, fr:`Décret impérial · 1752`, de:`Kaiserlicher Erlass · 1752`, es:`Decreto imperial · 1752`, ru:`Императорский указ · 1752` },
  'cb.heritage': { zh:`国家级非物质文化遗产`, ja:`国家級無形文化遺産`, ko:`국가급 무형문화유산`, fr:`Patrimoine national`, de:`Nationales Kulturerbe`, es:`Patrimonio nacional`, ru:`Нац. наследие` },
  'cb.brand':    { zh:`中华老字号`, ja:`中華の老舗`, ko:`중화 노포`, fr:`Marque historique`, de:`Traditionsmarke`, es:`Marca histórica`, ru:`Историческая марка` },
  'nav.contact': { zh:`到访`, ja:`アクセス`, ko:`오시는 길`, fr:`Nous trouver`, de:`Anfahrt`, es:`Visítanos`, ru:`Как добраться` },

  // ── landing (the 3D model gate) ──
  'ld.title': { zh:`都一处`, ja:`都一処`, ko:`두이추`, fr:`DUYICHU`, de:`DUYICHU`, es:`DUYICHU`, ru:`ДУЙИЧУ` },
  'ld.sub':   { zh:`始于 1738`, ja:`創業 1738`, ko:`1738년 창업`, fr:`Depuis 1738`, de:`Seit 1738`, es:`Desde 1738`, ru:`С 1738 года` },
  'ld.prompt':{ zh:`点击红色小楼，步入其中`, ja:`赤い建物をクリックして入る`, ko:`붉은 건물을 클릭해 입장`, fr:`Cliquez sur la maison rouge pour entrer`, de:`Auf das rote Haus klicken, um einzutreten`, es:`Haz clic en la casa roja para entrar`, ru:`Нажмите на красный дом, чтобы войти` },
  'ld.enter': { en:`Click to enter`, zh:`点此进入`, ja:`ここをクリック`, ko:`클릭하여 입장`, fr:`Cliquez pour entrer`, de:`Klicken zum Eintreten`, es:`Clic para entrar`, ru:`Нажмите, чтобы войти` },

  // ── home · history ──
  'h.hist.idx':   { zh:`01 / 历史`, ja:`01 / 歴史`, ko:`01 / 역사`, fr:`01 / Histoire`, de:`01 / Geschichte`, es:`01 / Historia`, ru:`01 / История` },
  'h.hist.tag':   { zh:`起源 · 1738`, ja:`起源 · 1738`, ko:`기원 · 1738`, fr:`Origines · 1738`, de:`Ursprung · 1738`, es:`Orígenes · 1738`, ru:`Истоки · 1738` },
  'h.hist.label': { zh:`第一章 — 创始`, ja:`第一章 — 創業`, ko:`제1장 — 창업`, fr:`Chapitre 01 — La fondation`, de:`Kapitel 01 — Die Gründung`, es:`Capítulo 01 — La fundación`, ru:`Глава 01 — Основание` },
  'h.hist.title': { zh:`一盏灯，<br>仍在<em>燃烧</em>`, ja:`闇の中で<br>なお<em>燃える</em>灯`, ko:`어둠 속에서<br>여전히 <em>타오르는</em> 등불`, fr:`Une lanterne<br><em>brûle</em> encore`, de:`Eine Laterne<br><em>brennt</em> noch`, es:`Un farol que aún<br><em>arde</em>`, ru:`Фонарь, что всё ещё<br><em>горит</em>` },
  'h.hist.body':  { zh:`1738 年除夕，北京城家家闭户、抵御严寒——唯有前门一间小馆，仍亮着一盏孤灯。一位旅人自冰冷的街头走入，落座用膳。`, ja:`1738年の大晦日、厳しい寒さに北京じゅうの店が固く扉を閉ざしていた——前門の小さな店をのぞいて。ただ一つの灯りがともるその店へ、凍てつく通りから一人の旅人が入り、席に着いた。`, ko:`1738년 섣달 그믐, 매서운 추위에 베이징의 모든 가게가 문을 닫았다 — 첸먼의 작은 주막 하나만은 예외였다. 등불 하나가 여전히 밝혀진 그곳으로, 얼어붙은 거리에서 한 나그네가 들어와 자리에 앉았다.`, fr:`La veille du Nouvel An 1738, toutes les boutiques de Pékin s'étaient closes contre le froid — sauf une petite taverne de Qianmen, dont l'unique lanterne brillait encore. Un voyageur entra de la rue glacée pour se restaurer.`, de:`Am Silvesterabend 1738 hatte ganz Peking gegen die Kälte die Läden geschlossen — bis auf eine kleine Schänke in Qianmen, deren einzige Laterne noch brannte. Ein Reisender trat aus der eisigen Straße ein, um zu speisen.`, es:`En la víspera de Año Nuevo de 1738, todas las tiendas de Pekín habían cerrado contra el frío — salvo una pequeña taberna en Qianmen, cuyo único farol seguía encendido. Un viajero entró desde la calle helada para comer.`, ru:`В канун Нового года 1738-го весь Пекин запер двери от стужи — кроме маленькой харчевни в Цяньмэне, где всё ещё горел одинокий фонарь. С морозной улицы вошёл путник и сел за стол.` },
  'h.hist.cta':   { zh:`进入时间线 →`, ja:`年表へ →`, ko:`연대기로 →`, fr:`Entrer dans la chronologie →`, de:`Zur Zeitleiste →`, es:`Entrar en la cronología →`, ru:`К хронике →` },

  // ── home · story ──
  'h.story.idx':   { zh:`02 / 御赐`, ja:`02 / 勅命`, ko:`02 / 어명`, fr:`02 / Le décret`, de:`02 / Der Erlass`, es:`02 / El decreto`, ru:`02 / Указ` },
  'h.story.tag':   { zh:`乾隆御赐`, ja:`乾隆帝`, ko:`건륭제`, fr:`L'empereur Qianlong`, de:`Kaiser Qianlong`, es:`El emperador Qianlong`, ru:`Император Цяньлун` },
  'h.story.label': { zh:`第二章 — 皇帝`, ja:`第二章 — 皇帝`, ko:`제2장 — 황제`, fr:`Chapitre 02 — L'empereur`, de:`Kapitel 02 — Der Kaiser`, es:`Capítulo 02 — El emperador`, ru:`Глава 02 — Император` },
  'h.story.title': { zh:`那位旅人，<br>正是<em>皇帝</em>`, ja:`その旅人こそ<br><em>皇帝</em>であった`, ko:`그 나그네는<br>바로 <em>황제</em>였다`, fr:`Le voyageur était<br>l'<em>Empereur</em>`, de:`Der Reisende war<br>der <em>Kaiser</em>`, es:`El viajero era<br>el <em>Emperador</em>`, ru:`Путником был<br><em>император</em>` },
  'h.story.body':  { zh:`他正是微服返京的乾隆皇帝。为这份温暖与烧卖的滋味所动，他御赐其名，令其流芳数代——称其为京城独一无二之处。`, ja:`それは、お忍びで都へ戻る途中の乾隆帝であった。その温もりと焼売の味に心を打たれ、帝はこの店に名を授けた——都にただ一つの場所、と。その名は王朝を越えて今に伝わる。`, ko:`그는 미복 차림으로 도성으로 돌아오던 건륭제였다. 그 온기와 사오마이의 맛에 감동한 황제는 이곳에 이름을 내렸다 — 도성에 둘도 없는 곳이라 하여. 그 이름은 왕조를 넘어 오늘까지 이어진다.`, fr:`C'était Qianlong, regagnant la Cité interdite en secret. Touché par la chaleur du lieu et la saveur des raviolis, il lui accorda un nom qui survivrait aux dynasties — le déclarant le seul endroit de son espèce dans toute la capitale.`, de:`Es war Qianlong, der heimlich in die Verbotene Stadt zurückkehrte. Gerührt von der Wärme und dem Geschmack der Teigtaschen verlieh er dem Haus einen Namen, der Dynastien überdauern sollte — den einzigen Ort seiner Art in der ganzen Hauptstadt.`, es:`Era Qianlong, que regresaba en secreto a la Ciudad Prohibida. Conmovido por la calidez y el sabor de los dumplings, le concedió un nombre que sobreviviría a las dinastías — declarándolo el único lugar de su clase en toda la capital.`, ru:`Это был Цяньлун, тайно возвращавшийся в Запретный город. Тронутый теплом и вкусом пельменей, он даровал заведению имя, пережившее династии, — назвав его единственным местом своего рода во всей столице.` },
  'h.story.cta':   { zh:`阅读传奇 →`, ja:`伝説を読む →`, ko:`전설 읽기 →`, fr:`Lire la légende →`, de:`Die Legende lesen →`, es:`Leer la leyenda →`, ru:`Читать легенду →` },

  // ── home · craft ──
  'h.craft.idx':   { zh:`03 / 工艺`, ja:`03 / 技`, ko:`03 / 기예`, fr:`03 / Le savoir-faire`, de:`03 / Das Handwerk`, es:`03 / El oficio`, ru:`03 / Ремесло` },
  'h.craft.tag':   { zh:`手工 · 二十四折`, ja:`手仕事 · 二十四のひだ`, ko:`수작업 · 스물네 주름`, fr:`À la main · 24 plis`, de:`Von Hand · 24 Falten`, es:`A mano · 24 pliegues`, ru:`Вручную · 24 складки` },
  'h.craft.label': { zh:`第三章 — 蜻蜓之翼`, ja:`第三章 — 蜻蛉の翅`, ko:`제3장 — 잠자리 날개`, fr:`Chapitre 03 — Ailes de libellule`, de:`Kapitel 03 — Libellenflügel`, es:`Capítulo 03 — Alas de libélula`, ru:`Глава 03 — Крылья стрекозы` },
  'h.craft.title': { zh:`手工捏制<br><em>二十四</em>道褶`, ja:`手で折る<br><em>二十四</em>のひだ`, ko:`손으로 빚은<br><em>스물네</em> 주름`, fr:`Plié 24 fois<br>à la <em>main</em>`, de:`24-mal gefaltet<br>von <em>Hand</em>`, es:`Plegado 24 veces<br>a <em>mano</em>`, ru:`Двадцать четыре складки<br><em>вручную</em>` },
  'h.craft.cta':   { zh:`查看完整菜单 →`, ja:`メニューを見る →`, ko:`전체 메뉴 보기 →`, fr:`Voir le menu complet →`, de:`Zur ganzen Speisekarte →`, es:`Ver el menú completo →`, ru:`Всё меню →` },

  // ── dishes (home chips + craft page) ──
  'dish.shrimp': { zh:`鲜虾`, ja:`海老`, ko:`새우`, fr:`Crevette`, de:`Garnele`, es:`Gamba`, ru:`Креветка` },
  'dish.crab':   { zh:`蟹黄`, ja:`蟹味噌`, ko:`게알`, fr:`Corail de crabe`, de:`Krabbenrogen`, es:`Hueva de cangrejo`, ru:`Крабовая икра` },
  'dish.three':  { zh:`三鲜`, ja:`三鮮`, ko:`삼선`, fr:`Trois délices`, de:`Drei Köstlichkeiten`, es:`Tres delicias`, ru:`Три деликатеса` },
  'dish.veg':    { zh:`素菜`, ja:`野菜`, ko:`채소`, fr:`Légumes`, de:`Gemüse`, es:`Verduras`, ru:`Овощи` },
  'dish.lamb':   { zh:`羊肉`, ja:`羊肉`, ko:`양고기`, fr:`Agneau`, de:`Lamm`, es:`Cordero`, ru:`Баранина` },
  'dish.pork':   { zh:`猪肉`, ja:`豚肉`, ko:`돼지고기`, fr:`Porc`, de:`Schweinefleisch`, es:`Cerdo`, ru:`Свинина` },

  // ── home · the houses (map) ──
  'h.map.idx':   { zh:`04 / 门店`, ja:`04 / 店舗`, ko:`04 / 매장`, fr:`04 / Les maisons`, de:`04 / Die Häuser`, es:`04 / Las casas`, ru:`04 / Дома` },
  'h.map.tag':   { zh:`三店 · 北京`, ja:`三店舗 · 北京`, ko:`세 매장 · 베이징`, fr:`Trois maisons · Pékin`, de:`Drei Häuser · Peking`, es:`Tres casas · Pekín`, ru:`Три дома · Пекин` },
  'h.map.label': { zh:`第四章 — 门店`, ja:`第四章 — 店舗`, ko:`제4장 — 매장`, fr:`Chapitre 04 — Les maisons`, de:`Kapitel 04 — Die Häuser`, es:`Capítulo 04 — Las casas`, ru:`Глава 04 — Дома` },
  'h.map.title': { zh:`一个名号，<br>三处<em>餐桌</em>`, ja:`一つの名に<br>三つの<em>食卓</em>`, ko:`하나의 이름,<br>세 곳의 <em>식탁</em>`, fr:`Un seul nom,<br>trois <em>tables</em>`, de:`Ein Name,<br>drei <em>Tische</em>`, es:`Un nombre,<br>tres <em>mesas</em>`, ru:`Одно имя,<br>три <em>стола</em>` },

  // ── location cards (en included: the SVG map markers read these via t()) ──
  'loc.1.name': { en:`Qianmen`, zh:`前门店`, ja:`前門店`, ko:`첸먼점`, fr:`Qianmen`, de:`Qianmen`, es:`Qianmen`, ru:`Цяньмэнь` },
  'loc.1.desc': { en:`36 Qianmen St · Since 1738`, zh:`前门大街 36 号 · 始于 1738`, ja:`前門大街 36 号 · 創業 1738`, ko:`첸먼대街 36호 · 1738년`, fr:`36 rue Qianmen · Depuis 1738`, de:`Qianmen-Str. 36 · Seit 1738`, es:`Calle Qianmen 36 · Desde 1738`, ru:`ул. Цяньмэнь, 36 · с 1738` },
  'loc.2.name': { en:`Yongdingmen`, zh:`永定门店`, ja:`永定門店`, ko:`융딩먼점`, fr:`Yongdingmen`, de:`Yongdingmen`, es:`Yongdingmen`, ru:`Юндинмэнь` },
  'loc.2.desc': { en:`Yongdingmen Inner East St`, zh:`永定门内东街`, ja:`永定門内東街`, ko:`융딩먼 내 동街`, fr:`Rue Est intérieure de Yongdingmen`, de:`Yongdingmen Innere Oststr.`, es:`Calle Este interior de Yongdingmen`, ru:`Юндинмэнь, Внутр. Восточная ул.` },
  'loc.3.name': { en:`Fangzhuang`, zh:`方庄店`, ja:`方荘店`, ko:`팡좡점`, fr:`Fangzhuang`, de:`Fangzhuang`, es:`Fangzhuang`, ru:`Фанчжуан` },
  'loc.3.desc': { en:`Fangzhuang · Pufang Rd`, zh:`方庄 · 蒲芳路`, ja:`方荘 · 蒲芳路`, ko:`팡좡 · 푸팡로`, fr:`Fangzhuang · route Pufang`, de:`Fangzhuang · Pufang-Str.`, es:`Fangzhuang · carretera Pufang`, ru:`Фанчжуан · ул. Пуфан` },

  // ── home · visit / footer ──
  'h.visit.idx':   { zh:`05 / 到访`, ja:`05 / 来店`, ko:`05 / 방문`, fr:`05 / La visite`, de:`05 / Der Besuch`, es:`05 / La visita`, ru:`05 / Визит` },
  'h.visit.tag':   { zh:`前门 · 北京`, ja:`前門 · 北京`, ko:`첸먼 · 베이징`, fr:`Qianmen · Pékin`, de:`Qianmen · Peking`, es:`Qianmen · Pekín`, ru:`Цяньмэнь · Пекин` },
  'h.visit.brand': { zh:`都一处 —<br>京城<br><span style="color:var(--accent);">别无二处。</span>`, ja:`都一处 —<br>ただ<br><span style="color:var(--accent);">一つの場所。</span>`, ko:`都一处 —<br>오직<br><span style="color:var(--accent);">이곳뿐.</span>`, fr:`都一处 —<br>le lieu<br><span style="color:var(--accent);">unique.</span>`, de:`都一处 —<br>der einzige<br><span style="color:var(--accent);">Ort.</span>`, es:`都一处 —<br>el único<br><span style="color:var(--accent);">lugar.</span>`, ru:`都一处 —<br>единственное<br><span style="color:var(--accent);">место.</span>` },
  'h.visit.col1':  { zh:`到访`, ja:`来店`, ko:`방문`, fr:`Visite`, de:`Besuch`, es:`Visita`, ru:`Визит` },
  'h.visit.col2':  { zh:`目录`, ja:`目次`, ko:`목차`, fr:`Index`, de:`Index`, es:`Índice`, ru:`Разделы` },
  'h.visit.addr1': { zh:`前门大街 36 号`, ja:`前門大街 36 号`, ko:`첸먼대街 36호`, fr:`36 rue Qianmen`, de:`Qianmen-Straße 36`, es:`Calle Qianmen, 36`, ru:`ул. Цяньмэнь, 36` },
  'h.visit.addr2': { zh:`北京市东城区`, ja:`北京市東城区`, ko:`베이징 둥청구`, fr:`Dongcheng, Pékin`, de:`Dongcheng, Peking`, es:`Dongcheng, Pekín`, ru:`Дунчэн, Пекин` },
  'h.visit.copy':  { zh:`都一处烧卖馆 · 版权所有`, ja:`都一处 焼売館 · 版権所有`, ko:`都一处 사오마이관 · 판권 소유`, fr:`都一处 Shaomai · Tous droits réservés`, de:`都一处 Shaomai · Alle Rechte vorbehalten`, es:`都一处 Shaomai · Todos los derechos reservados`, ru:`都一处 Шаомай · Все права защищены` },

  // ── origin (about) ──
  'o.idx':   { zh:`起源`, ja:`起源`, ko:`기원`, fr:`Origine`, de:`Ursprung`, es:`Origen`, ru:`Истоки` },
  'o.tag':   { zh:`乾隆 · 1752`, ja:`乾隆 · 1752`, ko:`건륭 · 1752`, fr:`Qianlong · 1752`, de:`Qianlong · 1752`, es:`Qianlong · 1752`, ru:`Цяньлун · 1752` },
  'o.imgcap':{ zh:`前门旧影`, ja:`前門の古写真`, ko:`첸먼 옛 모습`, fr:`Qianmen autrefois`, de:`Qianmen einst`, es:`Qianmen antaño`, ru:`Старый Цяньмэнь` },
  'o.label': { zh:`创始 · 1738 年除夕`, ja:`創業 · 1738年 大晦日`, ko:`창업 · 1738년 섣달 그믐`, fr:`La fondation · veille du Nouvel An 1738`, de:`Die Gründung · Silvester 1738`, es:`La fundación · víspera de Año Nuevo de 1738`, ru:`Основание · канун Нового года 1738` },
  'o.title': { zh:`皇帝御赐<br>之<em>名</em>`, ja:`皇帝が授けし<br>その<em>名</em>`, ko:`황제가 내린<br><em>이름</em>`, fr:`Un nom donné<br>par un <em>Empereur</em>`, de:`Ein Name, verliehen<br>von einem <em>Kaiser</em>`, es:`Un nombre dado<br>por un <em>Emperador</em>`, ru:`Имя, дарованное<br><em>императором</em>` },
  'o.body':  { zh:`北京城家家闭户，抵御除夕的严寒。唯有一家例外——前门一间简朴小馆，一盏孤灯仍在黑暗中燃烧。`, ja:`大晦日の厳しい寒さに、北京の店はみな扉を閉ざしていた。ただ一軒をのぞいて——前門の質素な小店、その一灯だけが闇の中で燃え続けていた。`, ko:`섣달 그믐의 추위에 베이징의 모든 가게가 문을 닫았다. 단 한 곳만은 예외였다 — 첸먼의 소박한 작은 가게, 그 등불 하나가 어둠 속에서 여전히 타고 있었다.`, fr:`Toutes les boutiques de Pékin s'étaient closes contre le froid mordant du Nouvel An. Toutes sauf une — une humble taverne de Qianmen, dont l'unique lanterne brûlait encore dans la nuit.`, de:`Ganz Peking hatte gegen die beißende Silvesterkälte die Läden geschlossen. Bis auf einen — eine bescheidene kleine Schänke in Qianmen, deren einzige Laterne noch im Dunkeln brannte.`, es:`Todas las tiendas de Pekín habían cerrado contra el frío cortante de Año Nuevo. Todas menos una — una humilde taberna de Qianmen, cuyo único farol aún ardía en la oscuridad.`, ru:`Весь Пекин запер двери от лютого новогоднего холода. Кроме одной — скромной харчевни в Цяньмэне, чей одинокий фонарь всё ещё горел во тьме.` },
  'o.cta1':  { zh:`进入时间线 →`, ja:`年表へ →`, ko:`연대기로 →`, fr:`Vers la chronologie →`, de:`Zur Zeitleiste →`, es:`A la cronología →`, ru:`К хронике →` },
  // origin · the founder (new chapter)
  'o.founder.idx':   { zh:`创始人`, ja:`創業者`, ko:`창업자`, fr:`Le fondateur`, de:`Der Gründer`, es:`El fundador`, ru:`Основатель` },
  'o.founder.tag':   { zh:`1738 · 鲜鱼口`, ja:`1738 · 鮮魚口`, ko:`1738 · 셴위커우`, fr:`1738 · Xianyukou`, de:`1738 · Xianyukou`, es:`1738 · Xianyukou`, ru:`1738 · Сяньюйкоу` },
  'o.founder.label': { zh:`自山西，骑驴而来`, ja:`山西から、ロバに乗って`, ko:`산시에서, 나귀를 타고`, fr:`Du Shanxi, à dos d'âne`, de:`Aus Shanxi, auf einem Esel`, es:`Desde Shanxi, en burro`, ru:`Из Шаньси, на осле` },
  'o.founder.title': { zh:`一间酒铺，<br>一个<em>名号</em>未至`, ja:`一軒の酒舗、<br>まだ見ぬ<em>名</em>`, ko:`한 칸 술집,<br>아직 오지 않은 <em>이름</em>`, fr:`Une taverne,<br>un <em>nom</em> à venir`, de:`Eine Schenke,<br>ein <em>Name</em>, der kommen wird`, es:`Una taberna,<br>un <em>nombre</em> por llegar`, ru:`Кабачок<br>и <em>имя</em>, что ещё впереди` },
  'o.founder.body':  { zh:`乾隆三年，王瑞福自山西老家骑着毛驴东行入京，在前门外鲜鱼口开起一间简朴的"王记酒铺"。彼时无人料到——十余年后，一位皇帝会亲手为它题名。`, ja:`乾隆三年、王瑞福は山西の故郷からロバに乗って都へ上り、前門外・鮮魚口に質素な「王記酒舗」を開いた。その十数年後、一人の皇帝が自らこの店に名を授けることになるとは、誰も知らなかった。`, ko:`건륭 3년, 왕루이푸는 산시 고향에서 나귀를 타고 도성으로 올라와 첸먼 밖 셴위커우에 소박한 '왕기주포'를 열었다. 십수 년 뒤 한 황제가 친히 이 가게에 이름을 내릴 줄은 아무도 몰랐다.`, fr:`En 1738, Wang Ruifu quitte son Shanxi natal et gagne la capitale à dos d'âne ; près de la porte de Qianmen, à Xianyukou, il ouvre une humble taverne, « Wang Ji ». Nul ne se doute alors qu'une dizaine d'années plus tard, un empereur lui donnera son nom de sa propre main.`, de:`1738 reitet Wang Ruifu aus seiner Heimat Shanxi auf einem Esel in die Hauptstadt und eröffnet bei Xianyukou, vor dem Qianmen-Tor, die bescheidene Schenke „Wang Ji". Niemand ahnt, dass gut zehn Jahre später ein Kaiser ihr eigenhändig einen Namen geben wird.`, es:`En 1738, Wang Ruifu deja su Shanxi natal y llega a la capital en burro; junto a la puerta de Qianmen, en Xianyukou, abre una humilde taberna, «Wang Ji». Nadie imagina entonces que, una década después, un emperador le dará nombre de su puño y letra.`, ru:`В 1738 году Ван Жуйфу выезжает из родной Шаньси в столицу на осле и у ворот Цяньмэнь, в Сяньюйкоу, открывает скромный кабачок «Ван Цзи». Никто и не подозревает, что лет через десять сам император своей рукой даст ему имя.` },

  'o.legend.idx':   { zh:`传奇`, ja:`伝説`, ko:`전설`, fr:`La légende`, de:`Die Legende`, es:`La leyenda`, ru:`Легенда` },
  'o.legend.tag':   { zh:`紫禁城`, ja:`紫禁城`, ko:`자금성`, fr:`La Cité interdite`, de:`Die Verbotene Stadt`, es:`La Ciudad Prohibida`, ru:`Запретный город` },
  'o.legend.label': { zh:`旅人`, ja:`旅人`, ko:`나그네`, fr:`Le voyageur`, de:`Der Reisende`, es:`El viajero`, ru:`Путник` },
  'o.legend.title': { zh:`那正是乾隆，<br><em>微服</em>而行`, ja:`それは乾隆帝、<br><em>お忍び</em>の旅`, ko:`그가 바로 건륭제,<br><em>미복</em> 차림이었다`, fr:`C'était Qianlong,<br>voyageant <em>incognito</em>`, de:`Es war Qianlong,<br><em>inkognito</em> unterwegs`, es:`Era Qianlong,<br>viajando de <em>incógnito</em>`, ru:`Это был Цяньлун,<br><em>инкогнито</em> в пути` },
  'o.legend.body':  { zh:`在那静谧的节日之夜，他为这份温暖与呈上的烧卖所深深打动，宣告此乃京城独一无二之处——自此名垂至今。`, ja:`その静かな祝祭の夜、供された焼売とその温もりに深く心を動かされ、帝はここを都にただ一つの場所と宣した——以来、その名は今に至る。`, ko:`그 고요한 명절 밤, 차려진 사오마이와 그 온기에 깊이 감동한 황제는 이곳을 도성에 둘도 없는 곳이라 선언했다 — 그 이름은 오늘까지 이어진다.`, fr:`En cette nuit de fête silencieuse, touché par la chaleur du lieu et les raviolis qu'on lui servit, l'Empereur le déclara le seul endroit de son espèce dans la capitale — et il l'est resté depuis.`, de:`In jener stillen Festnacht, gerührt von der Wärme und den ihm gereichten Teigtaschen, erklärte der Kaiser es zum einzigen Ort seiner Art in der Hauptstadt — und so ist es geblieben.`, es:`En aquella silenciosa noche de fiesta, conmovido por la calidez y los dumplings que le sirvieron, el Emperador lo declaró el único lugar de su clase en la capital — y así ha permanecido.`, ru:`В ту тихую праздничную ночь, тронутый теплом и поданными пельменями, император провозгласил его единственным местом своего рода в столице — и таким оно осталось.` },
  'o.cta2':  { zh:`探寻工艺 →`, ja:`技を見る →`, ko:`기예를 보다 →`, fr:`Voir le savoir-faire →`, de:`Zum Handwerk →`, es:`Ver el oficio →`, ru:`К ремеслу →` },

  // ── legacy ──
  'l.idx':   { zh:`传承`, ja:`伝承`, ko:`전통`, fr:`Héritage`, de:`Erbe`, es:`Legado`, ru:`Наследие` },
  'l.tag':   { zh:`{YEARS} 年`, ja:`{YEARS} 年`, ko:`{YEARS}년`, fr:`{YEARS} ans`, de:`{YEARS} Jahre`, es:`{YEARS} años`, ru:`{YEARS} лет` },
  'l.label': { zh:`卓越的时间线`, ja:`卓越の年表`, ko:`탁월함의 연대기`, fr:`La chronologie de l'excellence`, de:`Die Zeitleiste der Vortrefflichkeit`, es:`La cronología de la excelencia`, ru:`Хроника совершенства` },
  'l.title': { zh:`三百年，<br>一<em>味</em>`, ja:`三世紀、<br>一つの<em>味</em>`, ko:`세 세기,<br>하나의 <em>맛</em>`, fr:`Trois siècles,<br>une seule <em>recette</em>`, de:`Drei Jahrhunderte,<br>ein <em>Rezept</em>`, es:`Tres siglos,<br>una <em>receta</em>`, ru:`Три века,<br>один <em>рецепт</em>` },
  'l.y1738': { zh:`王瑞福自山西骑驴入京，在前门鲜鱼口开起"王记酒铺"。`, ja:`王瑞福が山西からロバに乗って上京し、前門・鮮魚口に「王記酒舗」を開く。`, ko:`왕루이푸가 산시에서 나귀를 타고 상경해 첸먼 셴위커우에 '왕기주포'를 연다.`, fr:`Wang Ruifu arrive du Shanxi à dos d'âne et ouvre la taverne « Wang Ji » à Xianyukou, près de Qianmen.`, de:`Wang Ruifu reitet aus Shanxi auf einem Esel nach Peking und eröffnet die Schenke „Wang Ji" in Xianyukou bei Qianmen.`, es:`Wang Ruifu llega de Shanxi en burro y abre la taberna «Wang Ji» en Xianyukou, junto a Qianmen.`, ru:`Ван Жуйфу приезжает из Шаньси на осле и открывает кабачок «Ван Цзи» в Сяньюйкоу у Цяньмэня.` },
  'l.y1752': { zh:`乾隆微服至此，赞"京都只此一处"，亲题"都一处"匾额相赐。`, ja:`乾隆帝がお忍びで訪れ、「都にただ一処」と称え、自ら「都一处」の扁額を授ける。`, ko:`건륭제가 미복으로 찾아 "도성에 오직 이곳뿐"이라 칭하며 친필 '都一处' 편액을 내린다.`, fr:`Qianlong, incognito, le proclame « le seul endroit de la capitale » et lui offre un panneau de sa main : 都一处.`, de:`Qianlong preist es inkognito als „den einzigen Ort der Hauptstadt" und schenkt ihm eine eigenhändige Tafel: 都一处.`, es:`Qianlong, de incógnito, lo proclama «el único lugar de la capital» y le regala una placa de su puño: 都一处.`, ru:`Цяньлун, инкогнито, называет его «единственным местом в столице» и дарует табличку своей рукой: 都一处.` },
  'l.y1956': { zh:`公私合营，自鲜鱼口南迁至北侧宽敞新址，重张迎客。`, ja:`公私合営により、鮮魚口の南からより広い北側の新店舗へ移り、再び店を開く。`, ko:`공사합영으로 셴위커우 남쪽에서 더 넓은 북쪽 새 자리로 옮겨 다시 문을 연다.`, fr:`Sous le partenariat public-privé, l'enseigne s'installe dans des locaux plus vastes au nord de Xianyukou.`, de:`Im Zuge der öffentlich-privaten Partnerschaft zieht das Haus in größere Räume nördlich von Xianyukou.`, es:`Con la sociedad mixta, la casa se traslada a un local más amplio al norte de Xianyukou.`, ru:`В рамках государственно-частного партнёрства заведение переезжает в более просторное помещение к северу от Сяньюйкоу.` },
  'l.y2008': { zh:`都一处烧麦制作技艺，列入国家级非物质文化遗产。`, ja:`都一处の焼売製作技術が、国家級無形文化遺産に登録される。`, ko:`두이추 사오마이 제작 기예가 국가급 무형문화유산으로 등재된다.`, fr:`L'art du shaomai de Duyichu est inscrit au patrimoine culturel immatériel national.`, de:`Die Shaomai-Kunst von Duyichu wird ins nationale immaterielle Kulturerbe aufgenommen.`, es:`El arte del shaomai de Duyichu se inscribe en el patrimonio cultural inmaterial nacional.`, ru:`Искусство шаомай Дуйичу вносится в национальное нематериальное культурное наследие.` },
  // ── story-reel: scroll hint + scene headlines (1956 / 2008); en from markup ──
  'reel.scroll': { zh:`滚动，穿越时光`, ja:`スクロールして時を旅する`, ko:`스크롤하여 시간을 여행하세요`, fr:`Faites défiler pour voyager dans le temps`, de:`Scrollen Sie durch die Zeit`, es:`Desplázate para viajar en el tiempo`, ru:`Прокрутите сквозь время` },
  'o.y1956.tag':   { zh:`1956 · 公私合营`, ja:`1956 · 公私合営`, ko:`1956 · 공사합영`, fr:`1956 · Une ère nouvelle`, de:`1956 · Eine neue Ära`, es:`1956 · Una nueva era`, ru:`1956 · Новая эпоха` },
  'o.y1956.title': { zh:`馆迁新址，<br><em>手艺如旧</em>`, ja:`店は移れど、<br><em>技は変わらず</em>`, ko:`가게는 옮겨도,<br><em>솜씨는 그대로</em>`, fr:`La maison déménage,<br>le <em>savoir-faire demeure</em>`, de:`Das Haus zieht um,<br>das <em>Handwerk bleibt</em>`, es:`La casa se muda,<br>el <em>oficio permanece</em>`, ru:`Дом переезжает,<br><em>ремесло остаётся</em>` },
  'o.y2008.tag':   { zh:`2008 · 国家级非遗`, ja:`2008 · 国家級無形文化遺産`, ko:`2008 · 국가급 무형문화유산`, fr:`2008 · Patrimoine immatériel`, de:`2008 · Immaterielles Erbe`, es:`2008 · Patrimonio inmaterial`, ru:`2008 · Нематериальное наследие` },
  'o.y2008.title': { zh:`一门技艺，<br>自此<em>由国家守护</em>`, ja:`その技は今、<br><em>国に守られる</em>`, ko:`이제 그 기예를<br><em>나라가 지킨다</em>`, fr:`Un savoir-faire<br>que la nation <em>protège</em>`, de:`Ein Handwerk, das die Nation<br>nun <em>bewahrt</em>`, es:`Un oficio que la nación<br>ahora <em>protege</em>`, ru:`Ремесло, которое теперь<br><em>хранит страна</em>` },
  'l.living.label': { zh:`活的传统`, ja:`生きた伝統`, ko:`살아있는 전통`, fr:`Tradition vivante`, de:`Lebendige Tradition`, es:`Tradición viva`, ru:`Живая традиция` },
  'l.living.tag':   { zh:`非物质文化遗产`, ja:`無形文化遺産`, ko:`무형문화유산`, fr:`Patrimoine immatériel`, de:`Immaterielles Erbe`, es:`Patrimonio inmaterial`, ru:`Нематериальное наследие` },
  'l.living.title': { zh:`每一只，<br>都手工<em>捏成</em>`, ja:`一つひとつ<br>手で<em>包む</em>`, ko:`하나하나<br>손으로 <em>빚다</em>`, fr:`Chacun,<br>plié à la <em>main</em>`, de:`Jedes Stück,<br>von <em>Hand</em> geformt`, es:`Cada uno,<br>plegado a <em>mano</em>`, ru:`Каждый —<br>слеплен <em>вручную</em>` },
  'l.living.body':  { zh:`新一代在老师傅门下习艺，承袭将面皮擀至薄如蝉翼的功夫——蜻蜓之翼，一门需经年磨炼、用一生守护的技艺。`, ja:`新しい世代が老練の師のもとで学び、皮を蝉の翅ほどに薄く延ばす技を受け継ぐ——蜻蛉の翅と呼ばれる、年月をかけて磨き、一生をかけて守る技。`, ko:`새로운 세대가 노련한 장인 아래서 배우며, 반죽을 매미 날개처럼 얇게 미는 기술을 이어받는다 — 잠자리 날개라 불리는, 여러 해를 갈고닦아 평생 지켜야 하는 기예다.`, fr:`Une nouvelle génération se forme auprès des maîtres, héritant de l'art d'étaler la pâte si fine qu'elle en devient translucide — ailes de libellule, un savoir qui demande des années à parfaire et une vie à préserver.`, de:`Eine neue Generation lernt bei den Meistern und erbt die Kunst, den Teig hauchdünn auszurollen, bis er durchscheint — Libellenflügel, ein Können, das Jahre zum Vollenden und ein Leben zum Bewahren braucht.`, es:`Una nueva generación se forma con los maestros, heredando el arte de estirar la masa tan fina que se vuelve translúcida — alas de libélula, un saber que exige años de perfeccionar y una vida de preservar.`, ru:`Новое поколение учится у старых мастеров, перенимая умение раскатывать тесто до прозрачности крыла стрекозы — мастерство, которое оттачивают годами и хранят всю жизнь.` },
  'l.cta':   { zh:`进入工艺 →`, ja:`技へ →`, ko:`기예로 →`, fr:`Vers le savoir-faire →`, de:`Zum Handwerk →`, es:`Al oficio →`, ru:`К ремеслу →` },
  'l.imgcap':{ zh:`制作工艺`, ja:`製法の様子`, ko:`만드는 과정`, fr:`L'art du pliage`, de:`Die Faltkunst`, es:`El arte del plegado`, ru:`Искусство лепки` },

  // ── craft ──
  'c.idx':   { zh:`工艺`, ja:`技`, ko:`기예`, fr:`Savoir-faire`, de:`Handwerk`, es:`Oficio`, ru:`Ремесло` },
  'c.tag':   { zh:`手工 · 二十四折`, ja:`手仕事 · 二十四のひだ`, ko:`수작업 · 스물네 주름`, fr:`À la main · 24 plis`, de:`Von Hand · 24 Falten`, es:`A mano · 24 pliegues`, ru:`Вручную · 24 складки` },
  'c.label': { zh:`蜻蜓之翼的艺术`, ja:`蜻蛉の翅の芸術`, ko:`잠자리 날개의 예술`, fr:`L'art des ailes de libellule`, de:`Die Kunst der Libellenflügel`, es:`El arte de las alas de libélula`, ru:`Искусство крыльев стрекозы` },
  'c.title': { zh:`通透之皮，<br>二十四道<em>褶</em>`, ja:`透ける皮、<br>二十四の<em>ひだ</em>`, ko:`비치는 피,<br>스물네 <em>주름</em>`, fr:`Pâte translucide,<br>vingt-quatre <em>plis</em>`, de:`Durchscheinender Teig,<br>vierundzwanzig <em>Falten</em>`, es:`Masa translúcida,<br>veinticuatro <em>pliegues</em>`, ru:`Прозрачное тесто,<br>двадцать четыре <em>складки</em>` },
  'c.tech.idx':   { zh:`技法`, ja:`技法`, ko:`기법`, fr:`La technique`, de:`Die Technik`, es:`La técnica`, ru:`Техника` },
  'c.tech.tag':   { zh:`薄如蝉翼`, ja:`蝉の翅のごとく`, ko:`매미 날개처럼`, fr:`Fin comme une aile de cigale`, de:`Dünn wie ein Zikadenflügel`, es:`Fino como ala de cigarra`, ru:`Тонко, как крыло цикады` },
  'c.tech.label': { zh:`手工封口`, ja:`手で封じる`, ko:`손으로 여미다`, fr:`Scellé à la main`, de:`Von Hand verschlossen`, es:`Sellado a mano`, ru:`Скреплено вручную` },
  'c.tech.title': { zh:`擀至极薄，<br>能<em>透光</em>`, ja:`極限まで薄く、<br>光を<em>通す</em>`, ko:`지극히 얇게,<br>빛이 <em>비치도록</em>`, fr:`Étalé si fin<br>qu'il retient la <em>lumière</em>`, de:`So dünn gerollt,<br>dass er das <em>Licht</em> hält`, es:`Estirado tan fino<br>que retiene la <em>luz</em>`, ru:`Раскатано так тонко,<br>что держит <em>свет</em>` },
  'c.tech.body':  { zh:`一只烧麦要历经十六道工序。师傅以"走槌"将面皮压至通透，再聚拢成二十四道花褶，暗合二十四节气——如花般绽放，自宫廷年代传承至今，全凭双手延续。`, ja:`焼売一つに十六の工程。職人は「走槌」で皮を透けるまで延ばし、二十四の花びらのようなひだに寄せる——それは二十四節気を映し、花のように開く。宮廷の時代から変わらぬ技を、今も手だけで受け継ぐ。`, ko:`사오마이 하나에 열여섯 공정이 든다. 장인은 '走槌'로 피를 비칠 때까지 밀어 스물네 개의 꽃잎 같은 주름으로 모은다 — 스물네 절기를 담아 꽃처럼 피어난다. 궁정 시대 그대로의 기법을 지금도 오직 손으로 잇는다.`, fr:`Chaque shaomai demande seize étapes. Au « rouleau marcheur », la pâte est étalée jusqu'à la transparence puis rassemblée en vingt-quatre plis — un pour chacun des vingt-quatre termes solaires — qui s'ouvrent comme une fleur. Une technique inchangée depuis l'époque impériale, perpétuée à la main.`, de:`Ein Shaomai durchläuft sechzehn Schritte. Mit dem „Laufhammer" wird der Teig hauchdünn ausgerollt und zu vierundzwanzig Falten gerafft — eine für jeden der vierundzwanzig Sonnenabschnitte —, die sich wie eine Blüte öffnen. Eine seit der Kaiserzeit unveränderte Kunst, von Hand bewahrt.`, es:`Cada shaomai exige dieciséis pasos. Con el «rodillo andante», la masa se estira hasta la transparencia y se reúne en veinticuatro pliegues — uno por cada uno de los veinticuatro términos solares — que se abren como una flor. Una técnica inalterada desde la época imperial, perpetuada a mano.`, ru:`Каждый шаомай проходит шестнадцать этапов. «Шагающей скалкой» тесто раскатывают до прозрачности и собирают в двадцать четыре складки — по одной на каждый из двадцати четырёх солнечных периодов, — раскрывающиеся, как цветок. Техника, неизменная со времён империи, и поныне хранимая руками.` },
  'c.cta':   { zh:`预订餐位 →`, ja:`席を予約する →`, ko:`자리 예약 →`, fr:`Réserver une table →`, de:`Tisch reservieren →`, es:`Reservar mesa →`, ru:`Забронировать стол →` },

  // ── contact ──
  'ct.idx':   { zh:`到访`, ja:`来店`, ko:`방문`, fr:`Visite`, de:`Besuch`, es:`Visita`, ru:`Визит` },
  'ct.tag':   { zh:`前门 · 北京`, ja:`前門 · 北京`, ko:`첸먼 · 베이징`, fr:`Qianmen · Pékin`, de:`Qianmen · Peking`, es:`Qianmen · Pekín`, ru:`Цяньмэнь · Пекин` },
  'ct.addr':  { zh:`北京市东城区前门大街 36 号`, ja:`北京市東城区 前門大街 36 号`, ko:`베이징 둥청구 첸먼대街 36호`, fr:`36 rue Qianmen, Dongcheng, Pékin`, de:`Qianmen-Straße 36, Dongcheng, Peking`, es:`Calle Qianmen 36, Dongcheng, Pekín`, ru:`Пекин, Дунчэн, ул. Цяньмэнь, 36` },
  'ct.title': { zh:`唯一<br><em>之所</em>`, ja:`唯一<br>の<em>場所</em>`, ko:`오직<br>이 <em>곳</em>`, fr:`Le lieu<br><em>unique</em>`, de:`Der einzige<br><em>Ort</em>`, es:`El <em>único</em><br>lugar`, ru:`Единственное<br><em>место</em>` },
  'ct.sub':   { zh:`一张 {YEARS} 年的餐桌，仍设于老北京之心。`, ja:`{YEARS}年つづく食卓は、今も古き北京の中心にある。`, ko:`{YEARS}년의 식탁이 여전히 옛 베이징의 한가운데 놓여 있다.`, fr:`Une table de {YEARS} ans, toujours dressée au cœur du vieux Pékin.`, de:`Ein {YEARS} Jahre alter Tisch, noch immer im Herzen des alten Peking gedeckt.`, es:`Una mesa de {YEARS} años, aún puesta en el corazón del viejo Pekín.`, ru:`Стол с {YEARS}-летней историей всё так же накрыт в сердце старого Пекина.` },
  'ct.reserve.idx': { zh:`预订`, ja:`予約`, ko:`예약`, fr:`Réserver`, de:`Reservieren`, es:`Reservar`, ru:`Бронь` },
  'ct.hours': { zh:`营业 10:00 — 21:00`, ja:`営業 10:00 — 21:00`, ko:`영업 10:00 — 21:00`, fr:`Ouvert 10h00 — 21h00`, de:`Geöffnet 10:00 — 21:00`, es:`Abierto 10:00 — 21:00`, ru:`Открыто 10:00 — 21:00` },
  'ct.book.label': { zh:`订座`, ja:`席のご予約`, ko:`자리 예약`, fr:`Réserver une table`, de:`Tisch buchen`, es:`Reservar una mesa`, ru:`Бронь стола` },
  'ct.book.title': { zh:`预订您的<em>餐位</em>`, ja:`お席を<em>ご予約</em>`, ko:`<em>자리</em>를 예약하세요`, fr:`Réservez votre <em>table</em>`, de:`Reservieren Sie Ihren <em>Tisch</em>`, es:`Reserve su <em>mesa</em>`, ru:`Забронируйте <em>стол</em>` },
  'ct.f.name':  { zh:`姓名`, ja:`お名前`, ko:`이름`, fr:`Nom`, de:`Name`, es:`Nombre`, ru:`Имя` },
  'ct.f.phone': { zh:`电话`, ja:`電話`, ko:`전화`, fr:`Téléphone`, de:`Telefon`, es:`Teléfono`, ru:`Телефон` },
  'ct.f.date':  { zh:`日期`, ja:`日付`, ko:`날짜`, fr:`Date`, de:`Datum`, es:`Fecha`, ru:`Дата` },
  'ct.f.time':  { zh:`时间`, ja:`時間`, ko:`시간`, fr:`Heure`, de:`Uhrzeit`, es:`Hora`, ru:`Время` },
  'ct.f.guests':{ zh:`人数`, ja:`人数`, ko:`인원`, fr:`Convives`, de:`Gäste`, es:`Comensales`, ru:`Гостей` },
  'ct.f.room':  { zh:`座位`, ja:`お席`, ko:`좌석`, fr:`Salle`, de:`Sitzplatz`, es:`Sala`, ru:`Зал` },
  'ct.f.notes': { zh:`备注`, ja:`ご要望`, ko:`요청`, fr:`Demandes`, de:`Wünsche`, es:`Solicitudes`, ru:`Пожелания` },
  'ct.f.namePh':{ zh:`您的姓名`, ja:`お名前`, ko:`성함`, fr:`Votre nom`, de:`Ihr Name`, es:`Su nombre`, ru:`Ваше имя` },
  'ct.f.notesPh':{ zh:`过敏、场合、偏好…`, ja:`アレルギー、ご利用シーン、ご希望など…`, ko:`알레르기, 방문 목적, 선호 사항…`, fr:`Allergies, occasion, préférences…`, de:`Allergien, Anlass, Vorlieben…`, es:`Alergias, ocasión, preferencias…`, ru:`Аллергии, повод, пожелания…` },
  'ct.room.hall':    { zh:`大堂`, ja:`大広間`, ko:`홀`, fr:`Salle principale`, de:`Haupthalle`, es:`Sala principal`, ru:`Главный зал` },
  'ct.room.private': { zh:`包间`, ja:`個室`, ko:`개별실`, fr:`Salon privé`, de:`Privatraum`, es:`Sala privada`, ru:`Отдельный кабинет` },
  'ct.room.window':  { zh:`临窗`, ja:`窓際`, ko:`창가`, fr:`Près de la fenêtre`, de:`Fensterplatz`, es:`Junto a la ventana`, ru:`У окна` },
  'ct.submit': { zh:`确认预订`, ja:`予約を確定`, ko:`예약 확정`, fr:`Confirmer la réservation`, de:`Reservierung bestätigen`, es:`Confirmar la reserva`, ru:`Подтвердить бронь` },
  'ct.wechat': { zh:`微信预订`, ja:`WeChat 予約`, ko:`위챗 예약`, fr:`Réserver sur WeChat`, de:`WeChat-Buchung`, es:`Reserva por WeChat`, ru:`Бронь в WeChat` },
  'ct.wechatNote': { zh:`扫码添加，即时预订与确认`, ja:`スキャンして追加、その場で予約・確認`, ko:`스캔하여 추가, 즉시 예약·확인`, fr:`Scannez pour nous ajouter — réservation et confirmation instantanées`, de:`Scannen, um uns hinzuzufügen — sofortige Buchung und Bestätigung`, es:`Escanee para añadirnos — reserva y confirmación al instante`, ru:`Отсканируйте, чтобы добавить нас — мгновенная бронь и подтверждение` },
  'ct.direct': { zh:`直接联系`, ja:`お問い合わせ`, ko:`직접 연락`, fr:`Contact direct`, de:`Direkter Kontakt`, es:`Contacto directo`, ru:`Прямая связь` },
  'ct.hoursLine': { zh:`前门大街 36 号 · 每日 10:00 — 21:00`, ja:`前門大街 36 号 · 毎日 10:00 — 21:00`, ko:`첸먼대街 36호 · 매일 10:00 — 21:00`, fr:`36 rue Qianmen · tous les jours 10h00 — 21h00`, de:`Qianmen-Str. 36 · täglich 10:00 — 21:00`, es:`Calle Qianmen 36 · todos los días 10:00 — 21:00`, ru:`ул. Цяньмэнь, 36 · ежедневно 10:00 — 21:00` },

  // ── reservation confirmation (used by the contact inline script via t()) ──
  'ct.success':  { en:`Your request is ready — send the email that just opened, or scan the WeChat code to confirm instantly.`, zh:`您的预订请求已生成——请发送刚刚打开的邮件，或扫描微信二维码即时确认。`, ja:`ご予約リクエストを作成しました。開いたメールを送信するか、WeChat コードをスキャンしてその場で確定してください。`, ko:`예약 요청이 준비되었습니다. 방금 열린 이메일을 보내거나 위챗 코드를 스캔해 즉시 확정하세요.`, fr:`Votre demande est prête — envoyez l'e-mail qui vient de s'ouvrir, ou scannez le code WeChat pour confirmer aussitôt.`, de:`Ihre Anfrage ist bereit — senden Sie die soeben geöffnete E-Mail oder scannen Sie den WeChat-Code zur sofortigen Bestätigung.`, es:`Su solicitud está lista — envíe el correo que acaba de abrirse o escanee el código de WeChat para confirmar al instante.`, ru:`Ваш запрос готов — отправьте только что открывшееся письмо или отсканируйте код WeChat для мгновенного подтверждения.` },
  'ct.prepared': { en:`Request prepared`, zh:`请求已生成`, ja:`リクエストを作成しました`, ko:`요청이 준비됨`, fr:`Demande préparée`, de:`Anfrage vorbereitet`, es:`Solicitud preparada`, ru:`Запрос готов` },

  // ── visit logistics (tourist-friendly: works with no Chinese SIM / WeChat) ──
  'v.book.online':    { zh:`在线预订`, ja:`オンライン予約`, ko:`온라인 예약`, fr:`Réserver en ligne`, de:`Online reservieren`, es:`Reservar en línea`, ru:`Забронировать онлайн` },
  'v.book.onlineSub': { zh:`安全预订 · 支持国际信用卡`, ja:`安全な予約 · 海外カード対応`, ko:`안전한 예약 · 해외 카드 가능`, fr:`Paiement sécurisé · cartes internationales acceptées`, de:`Sichere Buchung · internationale Karten`, es:`Reserva segura · se aceptan tarjetas internacionales`, ru:`Безопасное бронирование · принимаются зарубежные карты` },
  'v.book.or':        { zh:`或在下方申请餐位——我们将在 2 小时内回复`, ja:`または下記からお席をリクエスト — 2時間以内にご返信します`, ko:`또는 아래에서 예약을 요청하세요 — 2시간 이내에 답변드립니다`, fr:`ou demandez une table ci-dessous — réponse sous 2 heures`, de:`oder unten einen Tisch anfragen — Antwort innerhalb von 2 Stunden`, es:`o solicite una mesa abajo — respondemos en 2 horas`, ru:`или оставьте заявку ниже — ответим в течение 2 часов` },
  'v.book.response':  { en:`We confirm every request within 2 hours, by email or phone.`, zh:`我们将在 2 小时内通过邮件或电话确认每一份预订请求。`, ja:`いただいたご予約は、メールまたはお電話にて2時間以内に確認いたします。`, ko:`모든 예약 요청은 이메일 또는 전화로 2시간 이내에 확인해 드립니다.`, fr:`Nous confirmons chaque demande sous 2 heures, par e-mail ou par téléphone.`, de:`Wir bestätigen jede Anfrage innerhalb von 2 Stunden per E-Mail oder Telefon.`, es:`Confirmamos cada solicitud en un plazo de 2 horas, por correo o teléfono.`, ru:`Мы подтверждаем каждую заявку в течение 2 часов по электронной почте или телефону.` },
  'v.book.confirmTitle': { en:`Request ready`, zh:`请求已生成`, ja:`リクエストの準備ができました`, ko:`요청이 준비되었습니다`, fr:`Demande prête`, de:`Anfrage bereit`, es:`Solicitud lista`, ru:`Заявка готова` },
  'v.book.confirmBody':  { en:`We will confirm within 2 hours. Send the details by email, or copy them to book through your preferred channel.`, zh:`我们将在 2 小时内确认。请通过邮件发送以下信息，或复制后通过您方便的渠道预订。`, ja:`2時間以内に確認いたします。下記の内容をメールで送信するか、コピーしてご都合のよい方法でご予約ください。`, ko:`2시간 이내에 확인해 드립니다. 아래 내용을 이메일로 보내거나 복사하여 원하시는 방법으로 예약하세요.`, fr:`Nous confirmerons sous 2 heures. Envoyez les détails par e-mail, ou copiez-les pour réserver via le canal de votre choix.`, de:`Wir bestätigen innerhalb von 2 Stunden. Senden Sie die Angaben per E-Mail oder kopieren Sie sie, um über Ihren bevorzugten Kanal zu buchen.`, es:`Lo confirmaremos en 2 horas. Envíe los datos por correo o cópielos para reservar por el canal que prefiera.`, ru:`Мы подтвердим в течение 2 часов. Отправьте данные по e-mail или скопируйте их, чтобы забронировать удобным способом.` },
  'v.book.status':    { en:`Awaiting confirmation`, zh:`等待确认`, ja:`確認待ち`, ko:`확인 대기 중`, fr:`En attente de confirmation`, de:`Wartet auf Bestätigung`, es:`A la espera de confirmación`, ru:`Ожидает подтверждения` },
  'v.book.sendEmail': { en:`Send by email`, zh:`通过邮件发送`, ja:`メールで送信`, ko:`이메일로 보내기`, fr:`Envoyer par e-mail`, de:`Per E-Mail senden`, es:`Enviar por correo`, ru:`Отправить по e-mail` },
  'v.book.copy':      { en:`Copy details`, zh:`复制信息`, ja:`内容をコピー`, ko:`내용 복사`, fr:`Copier les détails`, de:`Details kopieren`, es:`Copiar datos`, ru:`Скопировать данные` },
  'v.book.copied':    { en:`Copied ✓`, zh:`已复制 ✓`, ja:`コピーしました ✓`, ko:`복사됨 ✓`, fr:`Copié ✓`, de:`Kopiert ✓`, es:`Copiado ✓`, ru:`Скопировано ✓` },

  'v.plan.idx':      { zh:`要点`, ja:`基本情報`, ko:`필수 정보`, fr:`Essentiel`, de:`Wissenswertes`, es:`Esencial`, ru:`Главное` },
  'v.plan.title':    { zh:`到访<em>指南</em>`, ja:`ご来店<em>案内</em>`, ko:`방문 <em>안내</em>`, fr:`Préparer votre <em>visite</em>`, de:`Ihren Besuch <em>planen</em>`, es:`Planifique su <em>visita</em>`, ru:`Планирование <em>визита</em>` },
  'v.hours.label':   { zh:`营业时间`, ja:`営業時間`, ko:`영업시간`, fr:`Horaires`, de:`Öffnungszeiten`, es:`Horario`, ru:`Часы работы` },
  'v.hours.value':   { zh:`每日 10:00 – 21:00`, ja:`毎日 10:00 – 21:00`, ko:`매일 10:00 – 21:00`, fr:`tous les jours 10h00 – 21h00`, de:`täglich 10:00 – 21:00`, es:`todos los días 10:00 – 21:00`, ru:`ежедневно 10:00 – 21:00` },
  'v.hours.note':    { zh:`全年无休，节假日照常营业；春节期间时间可能调整。`, ja:`祝日を含め年中無休。旧正月（春節）期間は時間が変更となる場合があります。`, ko:`공휴일 포함 연중무휴. 춘절 기간에는 시간이 변경될 수 있습니다.`, fr:`Ouvert tous les jours, y compris la plupart des jours fériés. Horaires modifiables pendant la fête du Printemps.`, de:`Täglich geöffnet, auch an den meisten Feiertagen. Während des Frühlingsfests können die Zeiten abweichen.`, es:`Abierto todos los días, incluida la mayoría de festivos. El horario puede variar durante el Año Nuevo chino.`, ru:`Открыто ежедневно, включая большинство праздников. В период Праздника весны часы могут меняться.` },
  'v.price.label':   { zh:`人均消费`, ja:`お一人様あたり`, ko:`1인 평균`, fr:`Prix moyen par personne`, de:`Durchschnitt pro Person`, es:`Media por persona`, ru:`Средний счёт на человека` },
  'v.price.value':   { zh:`¥80 – 150`, ja:`¥80 – 150（約 US$11 – 21）`, ko:`¥80 – 150 (약 US$11 – 21)`, fr:`80 – 150 ¥ · environ 11 – 21 US$`, de:`80 – 150 ¥ · etwa 11 – 21 US$`, es:`80 – 150 ¥ · unos 11 – 21 US$`, ru:`¥80 – 150 · около 11 – 21 US$` },
  'v.metro.label':   { zh:`最近地铁`, ja:`最寄り駅`, ko:`가장 가까운 지하철`, fr:`Métro le plus proche`, de:`Nächste U-Bahn`, es:`Metro más cercano`, ru:`Ближайшее метро` },
  'v.metro.value':   { zh:`前门站 · 2 号线 / 8 号线`, ja:`前門駅 · 2号線・8号線`, ko:`첸먼역 · 2호선·8호선`, fr:`Station Qianmen · lignes 2 et 8`, de:`Station Qianmen · Linien 2 & 8`, es:`Estación Qianmen · líneas 2 y 8`, ru:`Станция Цяньмэнь · линии 2 и 8` },
  'v.metro.walk':    { zh:`步行约 5 分钟`, ja:`徒歩約 5 分`, ko:`도보 약 5분`, fr:`≈ 5 min à pied`, de:`≈ 5 Min. zu Fuß`, es:`≈ 5 min a pie`, ru:`≈ 5 мин пешком` },
  'v.taxi.label':    { zh:`请出示给出租车司机`, ja:`タクシー運転手にお見せください`, ko:`택시 기사에게 보여 주세요`, fr:`Montrez ceci à votre chauffeur de taxi`, de:`Zeigen Sie dies Ihrem Taxifahrer`, es:`Muestre esto a su taxista`, ru:`Покажите это водителю такси` },
  'v.taxi.copy':     { en:`Copy address`, zh:`复制地址`, ja:`住所をコピー`, ko:`주소 복사`, fr:`Copier l'adresse`, de:`Adresse kopieren`, es:`Copiar dirección`, ru:`Скопировать адрес` },
  'v.taxi.copied':   { en:`Copied ✓`, zh:`已复制 ✓`, ja:`コピーしました ✓`, ko:`복사됨 ✓`, fr:`Copié ✓`, de:`Kopiert ✓`, es:`Copiado ✓`, ru:`Скопировано ✓` },

  'v.loc.idx':   { zh:`门店`, ja:`店舗`, ko:`매장`, fr:`Adresses`, de:`Standorte`, es:`Ubicaciones`, ru:`Адреса` },
  'v.loc.label': { zh:`就近选择门店`, ja:`最寄りの店舗へ`, ko:`가까운 매장 찾기`, fr:`Trouvez la maison la plus proche`, de:`Finden Sie das nächste Haus`, es:`Encuentre la casa más cercana`, ru:`Выберите ближайший дом` },

  // ── menu · dietary & allergen ──
  'c.menu.label': { zh:`馅料`, ja:`餡の種類`, ko:`소 종류`, fr:`Les garnitures`, de:`Die Füllungen`, es:`Los rellenos`, ru:`Начинки` },
  'c.menu.title': { zh:`选一味<br>你的<em>馅</em>`, ja:`お好みの<br><em>餡</em>を`, ko:`당신의 <em>소</em>를<br>고르다`, fr:`Choisissez<br>votre <em>garniture</em>`, de:`Wählen Sie<br>Ihre <em>Füllung</em>`, es:`Elija su<br><em>relleno</em>`, ru:`Выберите<br>свою <em>начинку</em>` },
  'c.menu.note':  { zh:`每张烧麦皮均为小麦粉所制，现点现包。预订时请告知任何过敏，厨房会为您安排。`, ja:`焼売の皮はすべて小麦粉製で、ご注文ごとに包みます。アレルギーがあればご予約時にお知らせください。厨房がご案内します。`, ko:`모든 사오마이 피는 밀가루로 만들며 주문 즉시 빚습니다. 알레르기가 있으면 예약 시 알려 주세요. 주방에서 안내해 드립니다.`, fr:`Toutes les pâtes à shaomai sont à base de blé et façonnées à la commande. Signalez toute allergie lors de la réservation — la cuisine vous guidera.`, de:`Alle Shaomai-Teighüllen enthalten Weizen und werden frisch gefaltet. Bitte nennen Sie Allergien bei der Reservierung — die Küche berät Sie.`, es:`Todas las masas de shaomai llevan trigo y se elaboran al momento. Indique cualquier alergia al reservar — la cocina le orientará.`, ru:`Все оболочки шаомай из пшеничной муки и лепятся под заказ. Сообщите об аллергии при бронировании — кухня поможет с выбором.` },
  'c.menu.allergens': { zh:`致敏成分`, ja:`アレルゲン`, ko:`알레르기 유발 성분`, fr:`Allergènes`, de:`Allergene`, es:`Alérgenos`, ru:`Аллергены` },
  // tags (also used as legend)
  'tag.wheat':     { en:`Wheat`, zh:`小麦`, ja:`小麦`, ko:`밀`, fr:`Blé`, de:`Weizen`, es:`Trigo`, ru:`Пшеница` },
  'tag.shellfish': { en:`Shellfish`, zh:`甲壳类`, ja:`甲殻類`, ko:`갑각류`, fr:`Crustacés`, de:`Krebstiere`, es:`Mariscos`, ru:`Моллюски` },
  'tag.pork':      { en:`Pork`, zh:`猪肉`, ja:`豚肉`, ko:`돼지고기`, fr:`Porc`, de:`Schwein`, es:`Cerdo`, ru:`Свинина` },
  'tag.lamb':      { en:`Lamb`, zh:`羊肉`, ja:`羊肉`, ko:`양고기`, fr:`Agneau`, de:`Lamm`, es:`Cordero`, ru:`Баранина` },
  'tag.veg':       { en:`Vegetarian`, zh:`纯素`, ja:`ベジタリアン`, ko:`채식`, fr:`Végétarien`, de:`Vegetarisch`, es:`Vegetariano`, ru:`Вегетарианское` },
  'tag.legend':    { zh:`图例`, ja:`凡例`, ko:`범례`, fr:`Légende`, de:`Legende`, es:`Leyenda`, ru:`Обозначения` },
  // gallery captions (designed photo slots — drop a real <img> in each frame)
  'gal.steam': { zh:`蒸笼初启`, ja:`せいろを開く`, ko:`찜기를 열다`, fr:`La vapeur`, de:`Der Dampf`, es:`El vapor`, ru:`Пар над пароваркой` },
  'gal.fold':  { zh:`二十四褶`, ja:`二十四のひだ`, ko:`스물네 주름`, fr:`Vingt-quatre plis`, de:`Vierundzwanzig Falten`, es:`Veinticuatro pliegues`, ru:`Двадцать четыре складки` },
  'gal.plate': { zh:`一桌之味`, ja:`食卓にて`, ko:`식탁에서`, fr:`À table`, de:`Am Tisch`, es:`En la mesa`, ru:`За столом` },

  // ── "Good to know" — costs, payment, language (Visit page) ──
  'gk.title':  { zh:`贴心提示`, ja:`ご利用にあたって`, ko:`알아두면 좋은 점`, fr:`Bon à savoir`, de:`Gut zu wissen`, es:`Información útil`, ru:`Полезно знать` },
  'gk.tax.l':  { zh:`税费`, ja:`税`, ko:`세금`, fr:`Taxes`, de:`Steuer`, es:`Impuestos`, ru:`Налог` },
  'gk.tax.v':  { zh:`已含。所见即所付，无额外费用。`, ja:`込み。表示価格がそのままお支払い額です。`, ko:`포함. 보이는 가격이 내는 가격입니다.`, fr:`Comprises. Le prix affiché est le prix final.`, de:`Inklusive. Der angezeigte Preis ist der Endpreis.`, es:`Incluidos. El precio que ve es el que paga.`, ru:`Включён. Указанная цена — окончательная.` },
  'gk.tip.l':  { zh:`小费`, ja:`チップ`, ko:`팁`, fr:`Pourboire`, de:`Trinkgeld`, es:`Propina`, ru:`Чаевые` },
  'gk.tip.v':  { zh:`无需。中国不收小费，账单也不含服务费。`, ja:`不要です。中国にチップの習慣はなく、サービス料も加算されません。`, ko:`필요 없습니다. 중국에는 팁 문화가 없고 봉사료도 붙지 않습니다.`, fr:`Inutile. Le pourboire n'a pas cours en Chine et aucun service n'est ajouté.`, de:`Nicht üblich. In China gibt es kein Trinkgeld, und es wird kein Service berechnet.`, es:`No se espera. En China no hay propina ni se añade servicio.`, ru:`Не нужны. В Китае чаевых нет, и плата за обслуживание не добавляется.` },
  'gk.pay.l':  { zh:`支付`, ja:`お支払い`, ko:`결제`, fr:`Paiement`, de:`Zahlung`, es:`Pago`, ru:`Оплата` },
  'gk.pay.v':  { zh:`现金（人民币）与银联随时可用；支付宝、微信支付可在 App 内绑定境外卡。实体 Visa／万事达卡未必受理。`, ja:`現金（人民元）と銀聯（UnionPay）はいつでも可。Alipay・WeChat Pay はアプリ内で海外カードも使えます。実物の Visa／Mastercard は使えない場合があります。`, ko:`현금(위안)과 유니온페이는 언제나 가능합니다. 알리페이·위챗페이는 앱에서 해외 카드도 됩니다. 실물 Visa/Mastercard는 안 될 수 있습니다.`, fr:`Espèces (RMB) et UnionPay toujours acceptés. Alipay et WeChat Pay acceptent les cartes étrangères dans l'appli. Une carte Visa/Mastercard physique peut être refusée.`, de:`Bargeld (RMB) und UnionPay immer möglich. Alipay & WeChat Pay akzeptieren ausländische Karten in der App. Eine physische Visa/Mastercard wird evtl. nicht angenommen.`, es:`Efectivo (RMB) y UnionPay siempre válidos. Alipay y WeChat Pay aceptan tarjetas extranjeras en la app. Una Visa/Mastercard física puede no aceptarse.`, ru:`Наличные (юани) и UnionPay принимаются всегда. Alipay и WeChat Pay принимают зарубежные карты в приложении. Физическую Visa/Mastercard могут не принять.` },
  'gk.lang.l': { zh:`语言`, ja:`言語`, ko:`언어`, fr:`Langue`, de:`Sprache`, es:`Idioma`, ru:`Язык` },
  'gk.lang.v': { zh:`前台可用英文为您服务。到店出示本页或您的预订即可。`, ja:`受付では英語で対応いたします。ご来店時にこのページかご予約をお見せください。`, ko:`프런트에서 영어로 도와드립니다. 도착하시면 이 페이지나 예약을 보여 주세요.`, fr:`Notre accueil vous aidera en anglais. Présentez cette page ou votre réservation à l'arrivée.`, de:`Unser Empfang hilft Ihnen auf Englisch. Zeigen Sie bei der Ankunft diese Seite oder Ihre Reservierung.`, es:`Nuestra recepción le atenderá en inglés. Muestre esta página o su reserva al llegar.`, ru:`На стойке вам помогут по-английски. По прибытии покажите эту страницу или вашу бронь.` },
  'gk.diet.l': { zh:`饮食`, ja:`食事`, ko:`식단`, fr:`Régime`, de:`Ernährung`, es:`Dieta`, ru:`Питание` },
  'gk.diet.v': { zh:`六种馅料，每款均标注过敏原。预订时请告知我们您的过敏情况。`, ja:`六種の餡には、それぞれアレルゲン表示があります。ご予約時にアレルギーをお知らせください。`, ko:`여섯 가지 소에 모두 알레르기 정보를 표시합니다. 예약 시 알레르기를 알려 주세요.`, fr:`Six garnitures, chacune étiquetée par allergène. Signalez-nous toute allergie à la réservation.`, de:`Sechs Füllungen, jede mit Allergen-Kennzeichnung. Nennen Sie uns Allergien bei der Reservierung.`, es:`Seis rellenos, cada uno con etiqueta de alérgenos. Indíquenos cualquier alergia al reservar.`, ru:`Шесть начинок, каждая с маркировкой аллергенов. Сообщите об аллергии при бронировании.` },
  'v.cta':     { zh:`预订餐桌 →`, ja:`席を予約する →`, ko:`테이블 예약 →`, fr:`Réserver une table →`, de:`Tisch reservieren →`, es:`Reservar una mesa →`, ru:`Забронировать стол →` },
  'v.facts.open': { zh:`营业时间`, ja:`営業時間`, ko:`영업시간`, fr:`Ouvert`, de:`Geöffnet`, es:`Abierto`, ru:`Часы` },
  'v.lg.ring':  { zh:`环路`, ja:`環状道路`, ko:`순환로`, fr:`Périphériques`, de:`Ringstraßen`, es:`Anillos viales`, ru:`Кольцевые дороги` },
  'v.lg.hint':  { zh:`点选下方门店，即可飞抵`, ja:`下の店舗をタップで飛行`, ko:`아래 매장을 누르면 날아갑니다`, fr:`Touchez une maison pour y voler`, de:`Tippen Sie auf ein Haus, um hinzufliegen`, es:`Toca una casa para volar allí`, ru:`Нажмите на дом, чтобы перелететь` },
  'v.hours.last': { en:`Last seating 20:15`, zh:`最后入座 20:15`, ja:`ラストオーダー（最終入店）20:15`, ko:`마지막 입장 20:15`, fr:`Dernière table à 20h15`, de:`Letzter Einlass 20:15`, es:`Última mesa 20:15`, ru:`Последняя посадка 20:15` },

  // ── credentials / recognition ──
  'cred.title': { zh:`荣誉认证`, ja:`認定・受賞`, ko:`인증·영예`, fr:`Distinctions`, de:`Auszeichnungen`, es:`Reconocimientos`, ru:`Признание` },
  'cred.1': { zh:`中华老字号`, ja:`中華老舗（中華老字号）`, ko:`중화 라오쯔하오 (노포)`, fr:`Marque historique de Chine`, de:`Traditionsmarke Chinas`, es:`Marca histórica de China`, ru:`Историческая марка Китая` },
  'cred.2': { en:`National Intangible Cultural Heritage · 2008`, zh:`国家级非物质文化遗产 · 2008`, ja:`国家級無形文化遺産 · 2008`, ko:`국가급 무형문화유산 · 2008`, fr:`Patrimoine culturel immatériel national · 2008`, de:`Nationales immaterielles Kulturerbe · 2008`, es:`Patrimonio cultural inmaterial nacional · 2008`, ru:`Нац. нематериальное наследие · 2008` },
  'cred.3': { en:`Named by the Qianlong Emperor · 1752`, zh:`乾隆御赐其名 · 1752`, ja:`乾隆帝より命名 · 1752`, ko:`건륭제 친히 명명 · 1752`, fr:`Nommé par l'empereur Qianlong · 1752`, de:`Vom Qianlong-Kaiser benannt · 1752`, es:`Nombrado por el emperador Qianlong · 1752`, ru:`Назван императором Цяньлуном · 1752` },
  'cred.reviews': { zh:`各平台评价`, ja:`各サイトの評価`, ko:`리뷰 보기`, fr:`Avis & guides`, de:`Bewertungen`, es:`Reseñas`, ru:`Отзывы` },

  // ── Recognition section (Visit page): the imperial decree as the first review ──
  'rec.idx':   { zh:`赞誉`, ja:`評価`, ko:`평가`, fr:`Distinctions`, de:`Auszeichnungen`, es:`Reconocimiento`, ru:`Признание` },
  'rec.tag':   { zh:`誉满京城 · 始于 1752`, ja:`京を魅了 · 1752年より`, ko:`1752년부터 사랑받다`, fr:`Acclamé depuis 1752`, de:`Gefeiert seit 1752`, es:`Aclamado desde 1752`, ru:`Признан с 1752 года` },
  'rec.label': { zh:`第一份食评`, ja:`最初の評`, ko:`최초의 평가`, fr:`La première critique`, de:`Die erste Kritik`, es:`La primera reseña`, ru:`Первый отзыв` },
  'rec.quote': { zh:`京城之中，独此一处。`, ja:`都の中で、ただ一つの処。`, ko:`온 도성에서 오직 이곳뿐.`, fr:`Le seul endroit de son espèce dans toute la capitale.`, de:`Der einzige Ort seiner Art in der ganzen Hauptstadt.`, es:`El único lugar de su clase en toda la capital.`, ru:`Единственное место такого рода во всей столице.` },
  'rec.by':    { zh:`——乾隆帝，1752 年除夕`, ja:`——乾隆帝、1752年の大晦日`, ko:`— 건륭제, 1752년 섣달 그믐`, fr:`— L'empereur Qianlong, un soir de Nouvel An, 1752`, de:`— Kaiser Qianlong, an einem Silvesterabend 1752`, es:`— El emperador Qianlong, una víspera de Año Nuevo de 1752`, ru:`— Император Цяньлун, в канун Нового года 1752-го` },

  // ── Gifts / Shop (merch — 礼盒) ──
  'g.idx':   { zh:`礼盒`, ja:`ギフト`, ko:`선물`, fr:`Boutique`, de:`Geschenke`, es:`Regalos`, ru:`Подарки` },
  'g.tag':   { zh:`带一份回家`, ja:`お持ち帰り`, ko:`집으로 가져가기`, fr:`À emporter`, de:`Zum Mitnehmen`, es:`Para llevar`, ru:`Возьмите домой` },
  'g.label': { zh:`把都一处<br>带回家`, ja:`都一处を<br>お持ち帰り`, ko:`두이추를<br>집으로`, fr:`La maison,<br>à emporter`, de:`Das Haus,<br>für daheim`, es:`La casa,<br>para llevar`, ru:`Дом —<br>с собой` },
  'g.title': { zh:`把<em>传承</em><br>带回家`, ja:`<em>伝統</em>を<br>持ち帰る`, ko:`<em>전통</em>을<br>집으로`, fr:`Emportez la<br><em>tradition</em>`, de:`Die <em>Tradition</em><br>mit nach Hause`, es:`Llévese la<br><em>tradición</em>`, ru:`Заберите<br><em>традицию</em>` },
  'g.body':  { zh:`从国家级非遗的厨房，到您的餐桌——节令礼盒、可在家蒸制的速冻烧麦，以及来自这家 {YEARS} 年老店的纪念。`, ja:`国家級無形文化遺産の厨房から、あなたの食卓へ——季節のギフトボックス、家で蒸せる冷凍焼売、そして {YEARS} 年の老舗からの記念品。`, ko:`국가급 무형문화유산의 주방에서 당신의 식탁으로 — 명절 선물 세트, 집에서 찌는 냉동 사오마이, 그리고 {YEARS}년 노포의 기념품.`, fr:`De la cuisine classée patrimoine national à votre table — coffrets de fête, shaomai surgelés à cuire chez soi, et souvenirs d'une maison de {YEARS} ans.`, de:`Aus der Küche des nationalen Kulturerbes auf Ihren Tisch — Festtags-Geschenkboxen, gefrorene Shaomai zum Dämpfen daheim und Andenken eines {YEARS} Jahre alten Hauses.`, es:`De la cocina, patrimonio nacional, a su mesa — cajas de regalo festivas, shaomai congelados para cocer en casa y recuerdos de una casa de {YEARS} años.`, ru:`С кухни национального наследия — на ваш стол: праздничные наборы, замороженные шаомай для дома и сувениры заведения с {YEARS}-летней историей.` },
  'g.box.n':    { zh:`御礼礼盒`, ja:`御礼ギフトボックス`, ko:`황실 선물 세트`, fr:`Coffret impérial`, de:`Kaiserliche Geschenkbox`, es:`Caja de regalo imperial`, ru:`Императорский набор` },
  'g.box.d':    { zh:`手工烧麦 · 节令包装，中秋与春节首选。`, ja:`手包みの焼売・季節の化粧箱、中秋と春節に。`, ko:`수제 사오마이 · 명절 포장, 추석과 춘절에.`, fr:`Shaomai pliés à la main, écrin de fête — pour la mi-automne et le Nouvel An.`, de:`Handgefaltete Shaomai, festliche Verpackung — zum Mondfest und Frühlingsfest.`, es:`Shaomai hechos a mano, estuche festivo — para el Festival del Medio Otoño y el Año Nuevo.`, ru:`Шаомай ручной лепки, праздничная упаковка — к Празднику середины осени и Новому году.` },
  'g.frozen.n': { zh:`速冻烧麦`, ja:`冷凍焼売`, ko:`냉동 사오마이`, fr:`Shaomai surgelés`, de:`Tiefgekühlte Shaomai`, es:`Shaomai congelados`, ru:`Замороженные шаомай` },
  'g.frozen.d': { zh:`急冻封存，二十四褶完好——在家蒸 8 分钟即成。`, ja:`急速冷凍で二十四のひだそのまま——家で8分蒸すだけ。`, ko:`급속 냉동, 스물네 주름 그대로 — 집에서 8분만 찌면 완성.`, fr:`Surgélation rapide, vingt-quatre plis intacts — 8 minutes à la vapeur chez vous.`, de:`Schockgefroren, vierundzwanzig Falten intakt — daheim 8 Minuten dämpfen.`, es:`Ultracongelados, veinticuatro pliegues intactos — 8 minutos al vapor en casa.`, ru:`Шоковая заморозка, двадцать четыре складки целы — 8 минут на пару дома.` },
  'g.plaque.n': { zh:`"都一处"匾额复刻`, ja:`「都一处」扁額レプリカ`, ko:`'都一处' 편액 복각`, fr:`Réplique de la plaque 都一处`, de:`Replik der Tafel 都一处`, es:`Réplica de la placa 都一处`, ru:`Реплика таблички 都一处` },
  'g.plaque.d': { zh:`乾隆御赐之名，髹漆木雕，可悬于厅堂。`, ja:`乾隆帝御賜の名を、漆塗りの木彫で。`, ko:`건륭제가 내린 이름을 옻칠 목조로.`, fr:`Le nom décrété par Qianlong, en bois laqué.`, de:`Der von Qianlong verliehene Name, in lackiertem Holz.`, es:`El nombre concedido por Qianlong, en madera lacada.`, ru:`Имя, дарованное Цяньлуном, в лакированном дереве.` },
  'g.tea.n':    { zh:`老店茶`, ja:`老舗の茶`, ko:`노포의 차`, fr:`Thé de la maison`, de:`Haus-Tee`, es:`Té de la casa`, ru:`Чай заведения` },
  'g.tea.d':    { zh:`本店茶配，佐烧麦的热气而饮。`, ja:`店のブレンド茶、湯気のそばで一杯。`, ko:`집만의 블렌드 차, 김 곁에서 한 잔.`, fr:`Le mélange maison, à verser près de la vapeur.`, de:`Die Hausmischung, zum Dampf gereicht.`, es:`La mezcla de la casa, junto al vapor.`, ru:`Фирменный купаж — к горячему пару.` },
  'g.order': { zh:`门店选购，或微信咨询北京市内节令配送。`, ja:`店頭にてお求め、または WeChat で北京市内の季節配送をお問い合わせください。`, ko:`매장에서 구매하거나 위챗으로 베이징 시내 명절 배송을 문의하세요.`, fr:`En boutique, ou demandez sur WeChat la livraison festive dans Pékin.`, de:`Im Laden erhältlich, oder fragen Sie per WeChat nach Festtags-Lieferung in Peking.`, es:`En tienda, o pregunte por WeChat la entrega festiva en Pekín.`, ru:`В магазине или уточните в WeChat праздничную доставку по Пекину.` },

  // ── dynamic footer year (1738 — current) ──
  'footer.est': { en:`1738 — {NOW}`, zh:`1738 — {NOW}`, ja:`1738 — {NOW}`, ko:`1738 — {NOW}`, fr:`1738 — {NOW}`, de:`1738 — {NOW}`, es:`1738 — {NOW}`, ru:`1738 — {NOW}` },

  // ── per-language <title> (set from body[data-title-key]; en = static <title>) ──
  'title.home':   { zh:`都一处 · 京城烧麦老字号 · 始于 1738`, ja:`都一处 · 北京の焼売老舗 · 創業 1738`, ko:`두이추 都一处 · 베이징 사오마이 노포 · 1738`, fr:`都一处 Duyichu · maison de shaomai à Pékin · depuis 1738`, de:`都一处 Duyichu · Shaomai-Haus in Peking · seit 1738`, es:`都一处 Duyichu · casa de shaomai en Pekín · desde 1738`, ru:`都一处 Дуйичу · дом шаомай в Пекине · с 1738` },
  'title.origin': { zh:`起源 · 都一处`, ja:`起源 · 都一处`, ko:`기원 · 두이추 都一处`, fr:`Origine · 都一处 Duyichu`, de:`Ursprung · 都一处 Duyichu`, es:`Origen · 都一处 Duyichu`, ru:`Истоки · 都一处 Дуйичу` },
  'title.legacy': { zh:`传承 · 都一处`, ja:`伝承 · 都一处`, ko:`전통 · 두이추 都一处`, fr:`Héritage · 都一处 Duyichu`, de:`Erbe · 都一处 Duyichu`, es:`Legado · 都一处 Duyichu`, ru:`Наследие · 都一处 Дуйичу` },
  'title.craft':  { zh:`工艺 · 都一处`, ja:`技 · 都一处`, ko:`기예 · 두이추 都一处`, fr:`Savoir-faire · 都一处 Duyichu`, de:`Handwerk · 都一处 Duyichu`, es:`Oficio · 都一处 Duyichu`, ru:`Ремесло · 都一处 Дуйичу` },
  'title.visit':  { zh:`到访 · 都一处`, ja:`アクセス · 都一处`, ko:`오시는 길 · 두이추 都一处`, fr:`Visite · 都一处 Duyichu`, de:`Besuch · 都一处 Duyichu`, es:`Visita · 都一处 Duyichu`, ru:`Визит · 都一处 Дуйичу` },
  'title.menu':   { zh:`菜单 · 都一处`, ja:`メニュー · 都一处`, ko:`메뉴 · 두이추 都一处`, fr:`Menu · 都一处 Duyichu`, de:`Speisekarte · 都一处 Duyichu`, es:`Menú · 都一处 Duyichu`, ru:`Меню · 都一处 Дуйичу` },
  'title.gifts':  { zh:`礼盒 · 都一处`, ja:`ギフト · 都一处`, ko:`선물 · 두이추 都一处`, fr:`Boutique · 都一处 Duyichu`, de:`Geschenke · 都一处 Duyichu`, es:`Regalos · 都一处 Duyichu`, ru:`Подарки · 都一处 Дуйичу` },

  /* Per-page meta DESCRIPTIONS — baked into each /<lang>/ page's <meta name="description">
     + og/twitter description by the prerender (scripts/prerender-i18n.mjs). en = the markup. */
  'meta.home':     { zh:`都一处——北京御赐烧麦老字号，乾隆赐名，自 1738 年起在前门大街以二十四道褶的烧麦待客，国家级非物质文化遗产。`, ja:`都一处——乾隆帝に名を賜った北京の焼売の老舗。1738 年より前門大街で二十四のひだの焼売を供する、国家級無形文化遺産。`, ko:`두이추——건륭제가 이름을 내린 베이징의 사오마이 노포. 1738년부터 첸먼대로에서 스물네 겹 사오마이를 내는 국가급 무형문화유산.`, fr:`都一处 Duyichu — maison de shaomai impériale de Pékin, nommée par l'empereur Qianlong, servant ses raviolis à 24 plis rue Qianmen depuis 1738. Patrimoine culturel immatériel national.`, de:`都一处 Duyichu — kaiserliches Shaomai-Haus in Peking, vom Qianlong-Kaiser benannt, serviert seit 1738 seine 24-fach gefalteten Teigtaschen an der Qianmen-Straße. Nationales immaterielles Kulturerbe.`, es:`都一处 Duyichu — casa imperial de shaomai de Pekín, nombrada por el emperador Qianlong, que sirve sus empanadillas de 24 pliegues en la calle Qianmen desde 1738. Patrimonio Cultural Inmaterial Nacional.`, ru:`都一处 Дуйичу — императорский дом шаомай в Пекине, названный императором Цяньлуном; подаёт пельмени в 24 складки на улице Цяньмэнь с 1738 года. Национальное нематериальное культурное наследие.` },
  'meta.heritage': { zh:`都一处近三百年传承：1738 年王瑞福创立，1752 年乾隆赐名，并列入国家级非物质文化遗产。`, ja:`都一处、三世紀におよぶ歩み——1738 年に王瑞福が創業、1752 年に乾隆帝が命名、国家級無形文化遺産に登録。`, ko:`두이추의 근 삼백 년——1738년 왕루이푸가 창업하고 1752년 건륭제가 이름을 내렸으며 국가급 무형문화유산에 등재.`, fr:`Près de trois siècles de 都一处 Duyichu : fondée par Wang Ruifu en 1738, nommée par l'empereur Qianlong en 1752, et inscrite au patrimoine culturel immatériel national.`, de:`Fast drei Jahrhunderte 都一处 Duyichu: 1738 von Wang Ruifu gegründet, 1752 vom Qianlong-Kaiser benannt und als nationales immaterielles Kulturerbe eingetragen.`, es:`Casi tres siglos de 都一处 Duyichu: fundada por Wang Ruifu en 1738, nombrada por el emperador Qianlong en 1752 e inscrita como Patrimonio Cultural Inmaterial Nacional.`, ru:`Почти три века 都一处 Дуйичу: основан Ван Жуйфу в 1738 году, назван императором Цяньлуном в 1752 году и внесён в список национального нематериального культурного наследия.` },
  'meta.menu':     { zh:`都一处菜单：手工烧麦六种馅料，附过敏原标识——皮压至通透，捏出二十四道褶，对应二十四节气。`, ja:`都一处のメニュー：手折りの焼売を六種の餡で、アレルゲン表示付き。皮を透けるまで延ばし、二十四節気にちなむ二十四のひだに。`, ko:`두이추 메뉴: 손으로 빚은 사오마이 여섯 가지 소, 알레르기 표시 포함——투명하게 민 피를 스물네 절기를 따라 스물네 겹으로.`, fr:`La carte de 都一处 Duyichu : shaomai pliés à la main en six garnitures, avec étiquettes d'allergènes — une pâte rendue translucide et réunie en 24 plis, un par terme solaire.`, de:`Die Speisekarte von 都一处 Duyichu: handgefaltete Shaomai in sechs Füllungen, mit Allergen-Kennzeichnung — ein hauchdünn ausgerollter Teig, in 24 Falten gelegt, eine je Sonnenperiode.`, es:`La carta de 都一处 Duyichu: shaomai plegados a mano en seis rellenos, con etiquetas de alérgenos — una masa prensada translúcida y reunida en 24 pliegues, uno por término solar.`, ru:`Меню 都一处 Дуйичу: шаомай ручной лепки с шестью начинками и маркировкой аллергенов — тесто раскатано до прозрачности и собрано в 24 складки, по числу солнечных периодов.` },
  'meta.gifts':    { zh:`把都一处带回家：节庆礼盒、可带走的冷冻烧麦、乾隆御赐牌匾复刻与本店茶——出自国家级非遗厨房。`, ja:`都一处を持ち帰る：祝祭のギフトボックス、冷凍焼売、乾隆御賜の扁額レプリカ、店の茶——国家級無形文化遺産の厨房から。`, ko:`두이추를 집으로: 명절 선물 세트, 냉동 사오마이, 건륭 御賜 편액 복제품, 그리고 가게의 차——국가급 무형문화유산의 주방에서.`, fr:`Emportez 都一处 Duyichu chez vous : coffrets de fête, shaomai surgelés à emporter, une réplique de la plaque décrétée par Qianlong, et le thé de la maison — d'une cuisine classée patrimoine culturel immatériel national.`, de:`都一处 Duyichu für zu Hause: Festtags-Geschenkboxen, gefrorene Shaomai zum Mitnehmen, eine Nachbildung der von Qianlong verliehenen Tafel und der Haustee — aus einer Küche des nationalen immateriellen Kulturerbes.`, es:`Llévate 都一处 Duyichu a casa: cajas de regalo festivas, shaomai congelados para llevar, una réplica de la placa otorgada por Qianlong y el té de la casa — de una cocina Patrimonio Cultural Inmaterial Nacional.`, ru:`Заберите 都一处 Дуйичу домой: праздничные подарочные наборы, замороженный шаомай навынос, копия дарованной Цяньлуном таблички и фирменный чай — с кухни национального нематериального наследия.` },
  'meta.contact':  { zh:`到访北京都一处——三家门店、营业时间、人均价格、最近地铁、出租车司机卡片，以及面向境外宾客的订座。`, ja:`北京の都一处へ——三つの店舗、営業時間、価格、最寄り駅、タクシー運転手に見せるカード、海外のお客様のご予約。`, ko:`베이징 두이추를 방문하세요——세 매장, 영업시간, 가격, 가까운 지하철, 택시 기사용 카드, 해외 손님을 위한 예약.`, fr:`Visitez 都一处 Duyichu à Pékin — trois maisons, horaires, prix, le métro le plus proche, une carte pour votre chauffeur de taxi, et la réservation de table pour les visiteurs internationaux.`, de:`Besuchen Sie 都一处 Duyichu in Peking — drei Häuser, Öffnungszeiten, Preise, die nächste U-Bahn, eine Karte für Ihren Taxifahrer und Tischreservierungen für internationale Gäste.`, es:`Visite 都一处 Duyichu en Pekín — tres casas, horarios, precios, el metro más cercano, una tarjeta para su taxista y reservas de mesa para visitantes internacionales.`, ru:`Посетите 都一处 Дуйичу в Пекине — три дома, часы работы, цены, ближайшее метро, карточка для таксиста и бронирование столиков для зарубежных гостей.` },
};

let current = null;

function tr(key, lang) {
  if (lang === 'en') return null;            // en = page markup
  const row = T[key];
  return row && row[lang] != null ? row[lang] : null;
}

/* For scripts that need a string outside the DOM-attribute flow (e.g. the
   reservation confirmation). Falls back to the key's English, then the key. */
export function t(key) { const row = T[key] || {}; return row[current] != null ? row[current] : (row.en != null ? row.en : key); }
export function getLang() { return current || 'en'; }

// --- per-language URL routing (only active in the pre-rendered prod build) ---
// The build emits /<lang>/<page> static pages with <html data-prelang>. When
// present, switching language NAVIGATES to that page's URL in the new language
// (a full page load — consistent with the rest of the site's navigation, and it
// keeps the URL and its statically-translated content in sync). Without it
// (dev / single-URL build) we switch in place as before.
const isPrerendered = () => !!document.documentElement.dataset.prelang;
const langPrefix = () => { const p = document.documentElement.dataset.prelang; return p && p !== 'en' ? '/' + p : ''; };
function pageSeg() {
  let p = location.pathname.replace(/^\/(en|zh|ja|ko|fr|de|es|ru)(\/|$)/, '/');
  const seg = p.replace(/^\//, '');
  return (seg === '' || seg === 'index.html') ? '' : seg;
}
function langUrl(lang) { const s = pageSeg(); return lang === 'en' ? '/' + s : '/' + lang + '/' + s; }
function switchLang(lang) {
  if (!CODES.includes(lang)) return;
  if (isPrerendered()) {
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    const url = langUrl(lang);
    if (url !== location.pathname) { location.href = url; return; }
  }
  applyLang(lang);
}

function applyLang(lang) {
  current = CODES.includes(lang) ? lang : 'en';
  const root = document.documentElement;
  root.setAttribute('lang', current === 'zh' ? 'zh-CN' : current);
  root.dataset.lang = current;
  try { localStorage.setItem(STORE, current); } catch (e) {}

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (el.dataset.i18nOrig === undefined) el.dataset.i18nOrig = el.innerHTML;
    const t = tr(el.dataset.i18n, current);
    const target = fillTokens(t != null ? t : el.dataset.i18nOrig);
    if (el.innerHTML !== target) {
      el.innerHTML = target;
      el.querySelectorAll('.reveal-text').forEach((s) => { s.style.opacity = '1'; s.style.transform = 'none'; });
    }
  });

  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    if (el.dataset.i18nPhOrig === undefined) el.dataset.i18nPhOrig = el.getAttribute('placeholder') || '';
    const t = tr(el.dataset.i18nPh, current);
    el.setAttribute('placeholder', fillTokens(t != null ? t : el.dataset.i18nPhOrig));
  });

  // structural aria-labels + img alt that live in the HTML markup (en stays
  // from the markup; the original is stored so switching back to en restores it)
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    if (el.dataset.i18nAriaOrig === undefined) el.dataset.i18nAriaOrig = el.getAttribute('aria-label') || '';
    const v = tr(el.dataset.i18nAria, current);
    el.setAttribute('aria-label', fillTokens(v != null ? v : el.dataset.i18nAriaOrig));
  });
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    if (el.dataset.i18nAltOrig === undefined) el.dataset.i18nAltOrig = el.getAttribute('alt') || '';
    const v = tr(el.dataset.i18nAlt, current);
    el.setAttribute('alt', fillTokens(v != null ? v : el.dataset.i18nAltOrig));
  });

  // per-language <title> (SEO + shareability), from the page's data-title-key.
  // Capture the original (English) <title> so switching back to en restores it
  // instead of leaving the previous language's title in the tab.
  const tk = document.body && document.body.dataset.titleKey;
  if (tk) {
    if (document.body.dataset.titleOrig === undefined) document.body.dataset.titleOrig = document.title;
    const tt = tr(tk, current);
    document.title = fillTokens(tt != null ? tt : document.body.dataset.titleOrig);
  }

  // the nav / bottom switchers show the current language and open the chooser
  const meta = LANGS.find((l) => l.code === current);
  document.querySelectorAll('.lang-toggle').forEach((b) => {
    b.innerHTML = `<span class="lt-globe" aria-hidden="true">◷</span>${meta ? meta.native : 'EN'}`;
    b.setAttribute('aria-label', t('aria.changeLang'));
  });

  // JS-injected chrome that persists across language switches (modal + burger)
  const modalEl = document.getElementById('l10n');
  if (modalEl) {
    modalEl.setAttribute('aria-label', t('aria.selectLang'));
    const cl = modalEl.querySelector('.l10n-close');
    if (cl) cl.setAttribute('aria-label', t('aria.close'));
  }
  const burgerEl = document.querySelector('.nav-burger');
  if (burgerEl) burgerEl.setAttribute('aria-label', t('aria.menu'));

  // let the rest of the app react (e.g. the map relabels its markers)
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: current } }));
}

/* ── shared focus trap for overlays (language modal + mobile nav) ──
   Keeps Tab inside the open overlay and returns focus to whatever opened it,
   so keyboard users aren't dropped behind the dialog (WCAG 2.4.3 / 2.1.2). */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let trapHandler = null, trapReturn = null;
function trapFocus(container, returnTo) {
  releaseTrap();                                  // only one trap active at a time
  trapReturn = returnTo || document.activeElement;
  const first = container.querySelector(FOCUSABLE);
  if (first) first.focus();
  trapHandler = (e) => {
    if (e.key !== 'Tab') return;
    const f = [...container.querySelectorAll(FOCUSABLE)];
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };
  document.addEventListener('keydown', trapHandler, true);
}
function releaseTrap() {
  if (!trapHandler) return;
  document.removeEventListener('keydown', trapHandler, true);
  trapHandler = null;
  const ret = trapReturn; trapReturn = null;
  if (ret && typeof ret.focus === 'function') { try { ret.focus(); } catch (e) {} }
}

/* ── auralee-style chooser: small centred modal, site visible behind ── */
let modal = null;
function buildModal() {
  if (modal) return modal;
  const wrap = document.createElement('div');
  wrap.id = 'l10n'; wrap.className = 'l10n-overlay';
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', t('aria.selectLang'));
  const rows = LANGS.map((l) =>
    `<li><button type="button" class="l10n-row" data-l="${l.code}">
       <span class="l10n-flag" aria-hidden="true">${l.flag}</span>
       <span class="l10n-native">${l.native}</span>
       <span class="l10n-en">${l.label}</span>
       <span class="l10n-check" aria-hidden="true">✓</span>
     </button></li>`).join('');
  wrap.innerHTML =
    `<div class="l10n-modal" role="document">
       <button class="l10n-close" type="button" aria-label="${t('aria.close')}">✕</button>
       <div class="l10n-brand">都一处</div>
       <div class="l10n-title">Select language · 选择语言</div>
       <ul class="l10n-list">${rows}</ul>
     </div>`;
  document.body.appendChild(wrap);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeModal(); });        // backdrop closes
  wrap.querySelector('.l10n-close').addEventListener('click', closeModal);
  wrap.querySelectorAll('.l10n-row').forEach((btn) => {
    btn.addEventListener('click', () => { switchLang(btn.dataset.l); markActive(); closeModal(); });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && wrap.classList.contains('open')) closeModal(); });
  modal = wrap;
  return wrap;
}
function markActive() {
  if (!modal) return;
  modal.querySelectorAll('.l10n-row').forEach((b) => b.classList.toggle('active', b.dataset.l === current));
}
function openModal(opener) {
  // capture the trigger explicitly — clicking a <button> doesn't focus it on
  // macOS Safari/Firefox, so document.activeElement would be unreliable here
  const ret = (opener && typeof opener.focus === 'function') ? opener : document.activeElement;
  buildModal(); markActive();
  playSwish(320);                          // a whisper of silk as the chooser slides in
  requestAnimationFrame(() => {
    modal.classList.add('open');
    requestAnimationFrame(() => trapFocus(modal, ret));   // focus only once the overlay is actually visible
  });
}
function closeModal() { if (modal && modal.classList.contains('open')) { modal.classList.remove('open'); releaseTrap(); } }

function injectToggles() {
  const nav = document.querySelector('nav');
  const navLinks = document.querySelector('nav .nav-links');
  if (navLinks && !navLinks.querySelector('.lang-toggle')) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lang-toggle nav-lang';
    b.addEventListener('click', () => openModal(b));
    navLinks.appendChild(b);
  }
  // mobile hamburger — the desktop link row can't fit a phone, so collapse it
  if (nav && navLinks && !nav.querySelector('.nav-burger')) {
    const burger = document.createElement('button');
    burger.type = 'button'; burger.className = 'nav-burger'; burger.setAttribute('aria-label', t('aria.menu')); burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span></span><span></span><span></span>';
    const closeNav = () => { if (!nav.classList.contains('open')) return; nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); releaseTrap(); };
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { playSwish(260); trapFocus(navLinks, burger); } else releaseTrap();
    });
    navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); });
    // Esc closes the menu (unless the language modal is the thing on top)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !(modal && modal.classList.contains('open'))) closeNav();
    });
    nav.appendChild(burger);
  }
  // (the bottom .lang-bottom toggle was removed — the nav language toggle is the
  //  single, always-visible control; a second one read as out of place)

  // persistent Reserve CTA — booking one tap from anywhere (not on the Visit
  // page itself). Shown from the start on every page INCLUDING home, so a
  // first-time visitor can book/skip-ahead without waiting for the 3D entry to
  // finish (the preloader poster covers it during load; it surfaces with the
  // landing). main.js also re-asserts .show after entry (idempotent).
  const ns = document.querySelector('[data-barba-namespace]')?.dataset.barbaNamespace;
  if (ns !== 'contact' && !document.getElementById('reserve-cta')) {
    const a = document.createElement('a');
    a.id = 'reserve-cta'; a.href = langPrefix() + (isPrerendered() ? '/contact' : '/contact.html'); a.className = 'reserve-cta show';
    a.innerHTML = `<span class="rcta-dot"></span><span data-i18n="nav.reserve">Reserve</span>`;
    document.body.appendChild(a);
  }
}

export function initI18n() {
  injectToggles();
  // Pre-rendered page (<html data-prelang>): the markup is already in that
  // language — honour it over any stored preference and remember it, and never
  // pop the chooser (the visitor arrived on a language-specific URL on purpose).
  const pre = document.documentElement.dataset.prelang;
  if (pre && CODES.includes(pre)) {
    try { localStorage.setItem(STORE, pre); } catch (e) {}
    applyLang(pre);
    return;
  }
  let stored = null;
  try { stored = localStorage.getItem(STORE); } catch (e) {}
  if (CODES.includes(stored)) {
    applyLang(stored);
  } else {
    applyLang('en');     // sensible default while the chooser is open
    openModal();         // first visit → ask
  }
}
