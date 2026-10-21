if (Array.isArray(window.SEONYU_DATA) && (window.SEONYU_DATA.length===50 || window.SEONYU_DATA.length===100)) {
(()=>{
'use strict';
const DATA=window.SEONYU_DATA, DBKEY='seonyu.english.master.v50.v1', OLDKEY='seonyu.english.master.day01.v1';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)], h=t=>String(t??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const voiceKey=id=>id;
const today=()=>new Date().toISOString().slice(0,10);
function makeDB(){return {schema:1,app:'seonyu-master-50',created:Date.now(),prefs:{speed:.85,lead:250,puzzleRepeats:3,fontLevel:3},records:{},read:{},quiz:{},assessments:[],edits:{},currentDay:1};}
let db;try{db=JSON.parse(localStorage.getItem(DBKEY)||'null')}catch(e){}if(!db||db.schema!==1||db.app!=='seonyu-master-50')db=makeDB();db.prefs={...makeDB().prefs,...db.prefs};db.records??={};db.read??={};db.quiz??={};db.edits??={};db.assessments??=[];
function rec(id){return db.records[id]??(db.records[id]={stars:0,chunk:0,cloze:false,word:false,reviewCount:0,due:null,interval:0,streak:0,longTerm:false,last:null,history:[],errors:0});}
function save(){db.changed=Date.now();try{localStorage.setItem(DBKEY,JSON.stringify(db))}catch(e){toast('저장 실패! 설정에서 백업 파일을 받아주세요.')}}
function lesson(day){return DATA[day-1]}
function phrases(day){return lesson(day).phrases.map((p,i)=>({...p,...(db.edits[p.id]||{}),index:i}))}
function phrase(id){for(let i=0;i<DATA.length;i++)for(const p of phrases(i+1))if(p.id===id)return p;return null}
function completion(day){const p=phrases(day);return db.read[day]&&db.quiz[day]&&p.every(x=>rec(x.id).stars===7&&rec(x.id).chunk>=db.prefs.puzzleRepeats&&rec(x.id).cloze&&rec(x.id).word)}
function completionCount(){return DATA.filter(d=>completion(d.day)).length}
const datestr=ms=>ms?new Date(ms).toLocaleDateString('ko-KR',{month:'short',day:'numeric'}):'없음';
const STAR_COLORS=['#f9e7b7','#f7d990','#f6cf77','#f4bf5d','#f2b243','#dc9a27','#b97706'];
const getTitle=(d)=>`DAY ${String(d).padStart(2,'0')} · ${lesson(d).title}`;
const states={screen:location.hash==='#settings'?'settings':'home',day:Math.max(1,Math.min(DATA.length,db.currentDay||1)),idx:0,stage:0,chunkChoices:[],chosen:[],wordChoices:[],wordChosen:[],gapIndex:0,clozeShown:false,busy:false,status:'',readerAnswer:null,reviewIds:[],reviewIndex:0,reviewShow:false,reviewWords:[],reviewOrder:[],reviewOptions:[],reviewChoice:null,reviewWrong:false,reviewBusy:false,exam:null,examResult:null,mic:null,activeWord:-1,voiceBusy:false};let u=states;
function toast(text){let old=q('.toast');if(old)old.remove();const el=document.createElement('div');el.className='toast';el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),3000)}
function shuffle(a){let b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
const button=(name,act,cls='secondary',disabled=false)=>`<button class="btn ${cls}" data-act="${h(act)}" ${disabled?'disabled':''}>${name}</button>`;
const bar=(n,d)=>`<div class="pbar"><div style="width:${Math.min(100,Math.max(0,(n/Math.max(1,d))*100))}%"></div></div>`;
const title=(eye,head,subtitle)=>`<div class="sectionhead"><div class="eyebrow">${h(eye)}</div><h1>${h(head)}</h1><p>${h(subtitle)}</p></div>`;
const stepDots=(idx,n)=>`<div class="phase-dots">${Array.from({length:n},(_,i)=>`<span class="${i<idx?'done':i===idx?'active':''}"></span>`).join('')}</div>`;
const totalStars=()=>DATA.reduce((s,d)=>s+d.phrases.reduce((z,p)=>z+Math.min(7,rec(p.id).stars),0),0);
const maxStars=()=>DATA.reduce((s,d)=>s+d.phrases.length*7,0);
const studied=()=>DATA.reduce((s,d)=>s+d.phrases.filter(p=>rec(p.id).word).length,0);
const dueIds=()=>DATA.flatMap(d=>d.phrases.filter(p=>rec(p.id).due&&rec(p.id).due<=Date.now()).map(p=>p.id));
function nav(screen,day){stopVoice();u.busy=false;u.status='';u.screen=screen;if(day){u.day=day;db.currentDay=day;save()}if(screen==='listen'){u.idx=Math.max(0,phrases(u.day).findIndex(p=>rec(p.id).stars<7));}if(screen==='train'){const a=phrases(u.day);const i=a.findIndex(p=>!rec(p.id).word);u.idx=i<0?0:i;setupStage(0)}if(screen==='review'){u.reviewIds=dueIds();u.reviewIndex=0;if(u.reviewIds.length)reviewPrepare();else u.reviewShow=false}if(screen==='reader')u.readerAnswer=null;u.clozeShown=false;draw();window.scrollTo({top:0,behavior:'instant'})}
function topbar(){return `<div class="top"><div class="eyebrow">✨ SEONYU ENGLISH MASTER</div><div class="topright"><div class="font-size-switch" role="group" aria-label="글씨 크기 5단계"><span>글씨</span>${[1,2,3,4,5].map(n=>`<button type="button" data-act="font-level:${n}" class="${db.prefs.fontLevel===n?'active':''}" aria-label="글씨 크기 ${n}단계" aria-pressed="${db.prefs.fontLevel===n}">${n}</button>`).join('')}</div><span class="chip">🌱 ${completionCount()} / ${DATA.length} 강</span><span class="chip">🧠 복습 ${dueIds().length}문장</span><button class="btn secondary" data-act="nav:assessments" style="padding:7px 10px;min-height:32px;font-size:12px">평가</button><button class="btn secondary" data-act="nav:settings" style="padding:7px 10px;min-height:32px;font-size:12px" aria-label="설정">⚙</button></div></div>`}
const N=[['home','⌂','오늘'],['chapters','▦','강의 목록'],['reader','📖','관찰일기'],['listen','♫','듣기'],['train','✦','암기'],['review','↻','복습'],['assessments','✓','평가'],['records','▥','기록'],['settings','⚙','설정']];
function draw(){document.documentElement.style.setProperty('--font-scale',([.83,.92,1,1.12,1.24][(Math.max(1,Math.min(5,Number(db.prefs.fontLevel)||3)))-1]));const body=({home:pageHome,chapters:pageChapters,reader:pageReader,listen:pageListen,train:pageTrain,review:pageReview,assessments:pageAssessments,records:pageRecords,settings:pageSettings,exam:pageExam,examReport:pageExamReport})[u.screen]||pageHome;const main=body();q('#app').innerHTML=`<div class="wrap"><aside class="sidebar"><div class="brand"><div class="brand-mark">S</div><div><strong>선유 영어 마스터</strong><small>ENGLISH MASTER 100</small></div></div><div class="nav">${N.map(([k,ico,n])=>`<button class="${u.screen===k?'active':''}" data-act="nav:${k}"><span>${ico}</span>${n}</button>`).join('')}</div><div class="sidefoot">🐾 12월 24일까지<br>100강 완성을 향해 가요!</div></aside><main class="main">${topbar()}${main}</main></div><div class="mobilebar">${N.filter(x=>['home','chapters','listen','train','review'].includes(x[0])).map(([k,ico,n])=>`<button class="${u.screen===k?'active':''}" data-act="nav:${k}"><b>${ico}</b>${n}</button>`).join('')}</div>`}
function stat(num,label){return `<div class="stat"><strong>${h(num)}</strong><small>${h(label)}</small></div>`}
function pageHome(){const d=u.day,L=lesson(d),ids=dueIds();const completed=DATA.filter(x=>completion(x.day)).length;const deadline=new Date('2026-12-24T23:59:59+09:00'),left=Math.max(0,Math.ceil((deadline.getTime()-Date.now())/86400000));return `${title('내 영어 탐험', '오늘도 한 문장씩, 천천히! 🐾', '작은 성공을 모으면 100강도 어느새 완성돼요.')}<div class="grid3">${stat(completed+'/'+DATA.length,'완료한 강')}${stat(studied()+'/'+DATA.reduce((n,x)=>n+x.phrases.length,0),'완성한 문장')}${stat(ids.length,'오늘 복습할 문장')}</div><div class="panel"><div class="lesson-top"><div><div class="eyebrow">TODAY’S ADVENTURE</div><h2>${h(getTitle(d))}</h2><p class="muted">${h(L.meaning)}</p></div><span class="pill gold">🎯 2강/일</span></div><div style="margin:16px 0">${bar(phrases(d).filter(p=>rec(p.id).word).length,phrases(d).length)}</div><div class="btnrow">${button('1. 📖 의미 배우기','nav:reader')}${button('2. 🔊 별 7개 듣기','nav:listen')}${button('3. 🧩 암기 시작','nav:train','gold')}</div></div><div class="grid2"><div class="panel"><h3>🔁 오늘 복습</h3><p class="muted">${ids.length?`${ids.length}개의 문장이 다시 만나길 기다려요.`:'아직 복습할 문장이 없어요. 새 문장을 배워 봐요!'}</p>${button('기억 복습하기','nav:review','secondary',!ids.length)}</div><div class="panel"><h3>🎓 졸업 프로젝트</h3><p class="muted">12월 24일 목표 · 약 ${left}일 남았어요.</p><p class="small muted">학습 자료 준비 현황 · ${DATA.length}/100강</p><div class="project-progress-label"><strong>${DATA.length}%</strong><span>전체 100강 중 ${DATA.length}강 제공</span></div>${bar(DATA.length,100)}<p class="small muted" style="margin-top:16px">선유의 실제 학습 완료: ${completed}/100강 (${completed}%)</p>${bar(completed,100)}<div style="margin-top:16px">${button('${DATA.length}강 학습지도','nav:chapters')}</div></div></div><div class="panel"><h3>💛 하루 학습 순서</h3><p class="muted">① 영어관찰일기(읽기만) → ② 문장 7회 듣기 → ③ 의미 덩어리 조립 → ④ 핵심 빈칸 → ⑤ 모든 단어로 문장 완성 → ⑥ 간격 복습</p><p class="small muted">※ 교재에 따라 예문 수가 다른 강은 실제 등록된 문장 수를 따릅니다.</p></div>`}
function pageChapters(){return `${title('COURSE MAP','1~${DATA.length}강 학습 지도','어떤 강이든 선택하여 학습할 수 있어요. 진도는 문장별로 자동 저장됩니다.')}<div class="panel"><div class="map-grid">${DATA.map(d=>{const n=phrases(d.day).filter(p=>rec(p.id).word).length,t=phrases(d.day).length;return `<button class="lesson-tile ${u.day===d.day?'active':''} ${completion(d.day)?'complete':''}" data-act="open-day:${d.day}"><b>${d.day}</b><em>${h(d.title)}</em><small>${n}/${t}문장 ${completion(d.day)?'✅':''}</small></button>`}).join('')}</div></div><div class="panel"><h3>📋 시험 체크포인트</h3><p class="muted">10강마다 형성평가, 50강 중간평가, 100강 최종평가(합격 95점)를 볼 수 있어요.</p>${button('평가 관리로 이동','nav:assessments')}</div>`}
function lessonSelector(){return `<div class="lesson-top" style="align-items:center"><div><span class="pill gold">${h(getTitle(u.day))}</span><p class="small muted">${h(lesson(u.day).meaning)}</p></div><div class="lesson-switch"><button data-act="open-day:${Math.max(1,u.day-1)}" ${u.day===1?'disabled':''}>◀</button><button data-act="nav:chapters">▦</button><button data-act="open-day:${Math.min(DATA.length,u.day+1)}" ${u.day===DATA.length?'disabled':''}>▶</button></div></div>`}
function pageReader(){const L=lesson(u.day);const choices=shuffleQuizOptions(u.day);return `${title('STEP 01 · READ','동사 탐정','여기서는 영어 소리가 나오지 않아요. 동사의 뜻을 발견해 봐요.')}<div class="panel">${lessonSelector()}<h2 style="margin-top:15px">🔎 동사 탐정 · ${h(L.title)}</h2><p style="line-height:1.85;margin:18px 0 4px">이번 장에서 동사가 어떤 뜻으로 쓰이는지 먼저 알아보세요. 아래 핵심 의미를 읽고 탐정 문제를 풀면 돼요.</p></div><div class="panel"><h2>🎯 오늘 발견할 핵심 뜻</h2><div class="korean-prompt">${h(L.meaning)}</div><p style="line-height:1.9">${h(L.explain)}</p><h3 style="margin-top:23px">탐정 문제: ${h(L.title.split(' ')[0])}의 이번 쓰임은?</h3><div class="stack">${choices.map((it,i)=>`<button class="btn ${u.readerAnswer===i?(it.ok?'secondary':'line'):'line'}" data-act="reader-choice:${i}" style="text-align:left;width:100%">${i+1}. ${h(it.text)} ${u.readerAnswer===i?(it.ok?'✓ 정답':'다시 생각해 봐요'):''}</button>`).join('')}</div><div class="btnrow">${button('읽기 마침 · 듣기로 이동','read-done','gold')}</div></div>`}
function shuffleQuizOptions(day){const d=lesson(day); const opts=[{text:d.meaning,ok:true}];for(let offset of [7,19]){let other=lesson(((day+offset-1)%DATA.length)+1);if(other.meaning===d.meaning)other=lesson(((day+offset+5)%DATA.length)+1);opts.push({text:other.meaning,ok:false})}const seed=day%3;return [...opts.slice(seed),...opts.slice(0,seed)]}
function starMarkup(n){return `<div class="star-row">${Array.from({length:7},(_,i)=>`<span class="star" data-num="${i+1}" data-filled="${i<n?i+1:0}" aria-label="${i<n?'획득':'미획득'} 별 ${i+1}">★</span>`).join('')}</div>`}
function wordsMarkup(s){return h(s).split(/(\s+)/).map((x,i)=>/^\s+$/.test(x)?x:`<span class="audio-word" data-word="${i}">${x}</span>`).join('')}
function pageListen(){let ps=phrases(u.day),p=ps[u.idx]||ps[0],r=rec(p.id);let total=ps.reduce((n,x)=>n+rec(x.id).stars,0);return `${title('STEP 02 · LISTEN','귀에 익히는 7개의 별 ⭐','영어 또는 한국어 문장을 누르면 영어가 나와요. 끝까지 들으면 별이 하나씩 채워져요.')}<div class="panel">${lessonSelector()}<div class="listen-route">${ps.map((x,i)=>`<button class="${u.idx===i?'active':''}" data-act="listen-select:${i}">${i===0?'대표 문장':'예문 '+i}<span>${rec(x.id).stars} / 7 ★</span></button>`).join('')}</div><p class="small muted">오늘의 듣기 지도 · 원하는 문장으로 바로 이동할 수 있어요.</p><div style="margin:14px 0">${bar(total,ps.length*7)}</div><div class="small muted">듣기 별 ${total} / ${ps.length*7}개</div></div><div class="panel listen-focus"><div class="lesson-top"><b>${u.idx===0?'대표 문장':'MODEL EXAMPLE '+u.idx}</b><span class="pill gold">${r.stars} / 7</span></div>${starMarkup(r.stars)}<button class="touch-speak" data-act="listen-play" ${u.voiceBusy?'disabled':''}><div class="en">${wordsMarkup(p.en)}</div><div class="ko">${h(p.ko)}</div></button><div class="statusline" id="listen-status">${h(u.status||'영어 또는 한국어를 눌러 들어 보세요.')}</div><div class="btnrow">${button('🔊 문장 듣기','listen-play','gold',u.voiceBusy)}${button('■ 재생 멈추기','stop-voice','line',!u.voiceBusy)}${button('다음 문장 →','listen-next','secondary')}</div></div><div class="panel"><div class="formrow"><label>속도 <select id="speech-speed">${[.7,.75,.85,1].map(v=>`<option value="${v}" ${db.prefs.speed===v?'selected':''}>${v}배속</option>`).join('')}</select></label><label>하이라이트 <select id="speech-lead">${[0,120,250,350,500].map(v=>`<option value="${v}" ${db.prefs.lead===v?'selected':''}>${v===0?'보정 없음':(v/1000)+'초 먼저'}</option>`).join('')}</select></label></div><p class="small muted">음성 인식 엔진이 단어 경계를 제공하지 않는 기기에서는 근사 타이밍으로 표시됩니다.</p></div>`}
// Select a high-frequency central word. The content is user-editable in Settings.
function gapWord(p){const d=lesson(Number(p.id.slice(3,5)));const stem=d.title.split(' ')[0].toLowerCase();const variants={have:['have','has','had','having'],get:['get','gets','got','getting'],make:['make','makes','made','making'],take:['take','takes','took','taken','taking'],do:['do','does','did','doing'],like:['like','likes','liked'],see:['see','sees','seen','saw'],know:['know','knows','knew'],work:['work','works','worked','working'],go:['go','goes','went','going','gone'],want:['want','wants','wanted'],say:['say','says','said'],let:['let','lets'],give:['give','gives','gave','given'],keep:['keep','keeps','kept']};const words=p.en.split(/\s+/);let idx=words.findIndex(w=>(variants[stem]||[stem]).includes(w.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g,'')));if(idx<0)idx=Math.min(words.length-1,Math.max(0,Math.floor(words.length/2)));return {words,idx,answer:words[idx].replace(/^[^a-z]+|[^a-z]+$/gi,'')||words[idx]}}
// Put verbs on their own puzzle cards without changing the words of the source sentence.
// This works after either automatic or parent-reviewed semantic chunking.
function separateVerbCards(parts){
  const verbWords=new Set(("am is are was were be been being have has had having do does did done doing don't doesn't didn't get gets got gotten getting make makes made making take takes took taken taking like likes liked liking know knows knew known knowing see sees saw seen seeing want wants wanted wanting go goes went gone going can could will would should shall must may might need needs needed needing work works worked working say says said saying give gives gave given giving keep keeps kept keeping let lets letting ask asks asked asking think thinks thought thinking feel feels felt feeling eat eats ate eaten eating drink drinks drank drunk drinking help helps helped helping thank thanks thanked thanking find finds found finding buy buys bought buying live lives lived living love loves loved loving use uses used using meet meets met meeting play plays played playing come comes came coming put puts putting set sets setting become becomes became becoming try tries tried trying call calls called calling watch watches watched watching look looks looked looking spend spends spent spending enjoy enjoys enjoyed enjoying pay pays paid paying start starts started starting finish finishes finished finishing leave leaves left leaving invite invites invited inviting bring brings brought bringing put puts putting hold holds held holding tell tells told telling speak speaks spoke spoken speaking sit sits sat sitting stand stands stood standing turn turns turned turning move moves moved moving change changes changed changing write writes wrote written writing read reads reading learn learns learned learnt learning study studies studied studying sleep sleeps slept sleeping wake wakes woke woken waking turn turns turned turning wait waits waited waiting run runs ran running wear wears wore worn wearing drive drives drove driven driving break breaks broke broken breaking open opens opened opening close closes closed closing talk talks talked talking happen happens happened happening remember remembers remembered remembering forget forgets forgot forgotten forgetting understand understands understood understanding choose chooses chose chosen choosing check checks checked checking promise promises promised promising cook cooks cooked cooking clean cleans cleaned cleaning send sends sent sending borrow borrows borrowed borrowing lend lends lent lending lose loses lost losing win wins won winning move moves moved moving stay stays stayed staying join joins joined joining visit visits visited visiting return returns returned returning receive receives received receiving").split(' '));
  const determiners=new Set(["a","an","the","my","your","our","his","her","their","this","that","these","those","some","any"]);
  const clean=w=>w.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g,'');
  return parts.flatMap(part=>{
    const words=part.trim().split(/\s+/).filter(Boolean);
    const result=[],buffer=[];
    const flush=()=>{if(buffer.length){result.push(buffer.join(' '));buffer.length=0}};
    words.forEach((word,i)=>{
      const token=clean(word),prev=i>0?clean(words[i-1]):'';
      const nounLike=determiners.has(prev)&&["work","play","need","watch","call","change","help","look","drink","break","study","drive","turn","talk","plan","book","visit","sleep","run"].includes(token);
      const prepLike=token==="like"&&["feel","feels","felt","look","looks","looked","sound","sounds","seem","seems"].includes(prev);
      const helperQuestion=i===0&&["do","does","did","can","could","will","would","should","shall"].includes(token)&&["i","you","we","they","he","she","it"].includes(clean(words[i+1]||''));
      if(verbWords.has(token)&&!nounLike&&!prepLike&&!helperQuestion){
        const infinitive=buffer.length&&clean(buffer[buffer.length-1])==='to';
        if(infinitive)buffer.pop();
        flush();result.push(infinitive?'to '+word:word);
      }
      else buffer.push(word);
    });
    flush();
    return result;
  }).reduce((acc,part)=>{
    // Keep conjunctions attached to a following verb rather than leaving lone cards.
    if(acc.length&&['and','or','but'].includes(acc[acc.length-1].toLowerCase())&&part){acc[acc.length-1]+=' '+part;}
    else acc.push(part);
    return acc;
  },[]);
}
// Meaning-first segmentation; no textbook examples live in the public application.
// Optional human-reviewed chunks are stored only with locally imported learning data.
function chunks(p){
  const src=p.en.trim();
  if(Array.isArray(p.chunks)&&p.chunks.length>1&&p.chunks.every(x=>typeof x==='string')&&p.chunks.join(' ').replace(/\s+/g,' ').trim()===src)return separateVerbCards(p.chunks);
  const w=src.split(/\s+/).filter(Boolean),n=w.length;
  if(n<=3)return separateVerbCards([src]);
  const plain=s=>s.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g,'');
  const norm=w.map(plain),cuts=new Set([0,n]);
  const add=i=>{if(i>0&&i<n)cuts.add(i)};
  const verb=new Set(('am is are was were be been being have has had do does did don\'t doesn\'t didn\'t get gets got make makes made take takes took like likes liked know knows knew see sees saw seen want wants wanted go goes went gone going can could will would should shall must may might need needs needed work works worked working say says said give gives gave given keep keeps kept let lets ask asks asked think thinks thought feel feels felt eat eats ate drink drinks drank help helps helped thank thanks find finds found buy buys bought need needs live lives lived love loves loved use uses used meet meets met play plays played come comes came put puts set sets become becomes became try tries tried call calls called watch watches watched look looks looked spend spends spent enjoy enjoys enjoyed pay pays paid start starts started finish finishes finished leave leaves left invite invites invited like likes liked').split(' '));
  const links=new Set(['because','but','although','though','unless','while','whether','whereas','since','until','if','when','so']);
  const prep=new Set(['in','on','at','with','from','for','during','after','before','into','without','over','under','through','around','of','by']);
  const timeWords=new Set(['today','tomorrow','yesterday','tonight','now']);
  const mainVerbIndex=norm.findIndex((w,i)=>i>0&&verb.has(w));
  for(let i=1;i<n;i++){
    const t=norm[i],prev=norm[i-1],rem=n-i;
    if(/[,;:]$/.test(w[i-1])&&rem>=2)add(i);
    if(/[.!?]$/.test(w[i-1])&&rem>=2&&/^[A-Z]/.test(w[i]))add(i);
    if(links.has(t)&&i>=2&&rem>=2)add(i);
    if(t==='and'&&rem>=2&&norm.slice(0,i).some(x=>verb.has(x))&&(verb.has(norm[i+1])||['i','you','we','he','she','they','it',"i'll","we'll","you'll"].includes(norm[i+1])))add(i);
    if(prep.has(t)&&i>=3&&rem>=2&&(i>=4||n>=8)&&(mainVerbIndex<0||i>mainVerbIndex)&&!links.has(norm[i+1])&&!prep.has(norm[i+1])&&!['living','staying','sitting','standing','working','playing','waiting','having','have','has','had'].includes(prev))add(i);
    if(t==='to'&&i>=3&&rem>=2&&['do','finish','buy','meet','see','make','get','run','take','visit','reply','help','watch','go','join','use','find','eat','have','study','work','spend'].includes(norm[i+1]))add(i);
    if(timeWords.has(t)&&i>=3&&rem>=2)add(i);
    if(['meet','give','get','help','take','bring','pick','drop','call','send','proofread','prepare','fix','clean','wait'].includes(t)&&i>=3&&norm.slice(0,i).some(v=>['have','has','had'].includes(v))&&rem>=2&&norm[i-1]!=='to')add(i);
    if(['this','last','next','every'].includes(t)&&i>=3&&rem>=2&&['week','weekend','month','year','morning','afternoon','evening','night','summer','friday','saturday','sunday'].includes(norm[i+1]))add(i);
    if(['living','staying','sitting','standing','working','playing','waiting'].includes(t)&&i>=3&&rem>=2&&!['is','are','am','was','were','been','be','a','an','the','some','any','all','my','our','your'].includes(prev)&&!norm.slice(Math.max(0,i-3),i).some(v=>['am','is','are','was','were'].includes(v)))add(i);
  }
  for(let start of [...cuts].sort((a,b)=>a-b)){
    const end=[...cuts].filter(i=>i>start).sort((a,b)=>a-b)[0]||n;
    if(end-start<4)continue;
    const subj=norm[start];let found=-1;
    for(let i=start+1;i<Math.min(start+6,end-1);i++)if(verb.has(norm[i])&&norm[i-1]!=='to'){found=i;break;}
    if(found>start&&end-found>=2&&(['i','we','you','he','she','they','it','my','our','your','his','her','their','the','a','an','this','that','these','those','there','who','what','where','do','does','did'].includes(subj)||found-start>=2))add(found);
  }
  let boundaries=[...cuts].sort((a,b)=>a-b),out=[];
  for(let k=0;k<boundaries.length-1;k++){
    let chunk=w.slice(boundaries[k],boundaries[k+1]);
    while(chunk.length>8){
      let opts=[];
      for(let j=3;j<=Math.min(7,chunk.length-2);j++){
        let t=plain(chunk[j]), before=plain(chunk[j-1]);
        let score=(prep.has(t)?7:0)+(links.has(t)?7:0)+(t==='to'?5:0)+(['and','or'].includes(t)?5:0)+(['a','an','the','my','your','our','this','that','some','any'].includes(t)?2:0)-Math.abs(j-5);
        if(verb.has(t)&&['i','you','we','they','he','she','it'].includes(plain(chunk[0])))score+=3;
        if(before==='to')score-=8;
        opts.push([score,j]);
      }
      opts.sort((a,b)=>b[0]-a[0]);const cut=opts.length?opts[0][1]:5;
      out.push(chunk.slice(0,cut).join(' '));chunk=chunk.slice(cut);
    }
    if(chunk.length)out.push(chunk.join(' '));
  }
  for(let i=0;i<out.length;i++){
    const one=out[i].split(/\s+/);
    if(one.length===1&&['a','an','the','and','or','to','in','on','at','for','of','with','from','but','so','if','when'].includes(plain(one[0]))){
      if(i+1<out.length){out[i+1]=out[i]+' '+out[i+1];out.splice(i,1);i--;}
      else if(i>0){out[i-1]+=' '+out[i];out.splice(i,1);i--;}
    }
  }
  return separateVerbCards(out.length>1?out:[src]);
}
function setupStage(stage){u.stage=stage;u.chosen=[];u.wordChosen=[];u.clozeShown=false;u.busy=false;u.status='';const p=phrases(u.day)[u.idx];if(p){u.chunkChoices=shuffle(chunks(p).map((_,i)=>i));u.wordChoices=shuffle(p.en.trim().split(/\s+/).map((_,i)=>i));u.gapIndex=gapWord(p).idx}}
function pageTrain(){const ps=phrases(u.day),p=ps[u.idx]||ps[0],r=rec(p.id);const names=['1. 의미 덩어리 조립','2. 핵심 빈칸','3. 낱단어 영어 완성'];let center='';if(u.stage===0){const a=chunks(p);center=`<button class="korean-prompt" style="width:100%;border:0;cursor:pointer;color:var(--ink)" data-act="train-play" aria-label="한국어 문장을 눌러 영어 듣기">${h(p.ko)} <span style="font-size:12px;color:#688b7e">🔊</span></button><p class="muted small">듣기 후 의미 덩어리를 순서대로 골라요. 음성이 끝나기 전에는 다음 카드를 누를 수 없어요.</p><div class="chosen-area" id="selected-words">${u.chosen.length?u.chosen.map(i=>`<span class="token chosen">${h(a[i])}</span>`).join(''):'<span class="placeholder">아래 단어 덩어리를 차례로 선택해요</span>'}</div><div class="option-bank">${u.chunkChoices.map(i=>`<button class="token" data-act="chunk:${i}" ${u.chosen.includes(i)||u.busy?'disabled':''}>${h(a[i])}</button>`).join('')}</div><div class="statusline">${h(u.status||`${r.chunk} / ${db.prefs.puzzleRepeats}회 완성`)} · 끝까지 들은 뒤 진행합니다</div>`}
else if(u.stage===1){const g=gapWord(p);const display=g.words.map((w,i)=>i===g.idx?(u.clozeShown?h(w):'<span style="background:#fff0c9;padding:4px 12px;border-radius:9px">?</span>'):h(w)).join(' ');center=`<button class="korean-prompt" style="width:100%;border:0;cursor:pointer;color:var(--ink)" data-act="train-play">${h(p.ko)} <span style="font-size:12px;color:#688b7e">🔊</span></button><div class="panel" style="margin-top:15px"><div class="big-english" id="cloze-text">${display}</div></div><p class="muted">비어 있는 핵심 단어를 찾아보세요. 정답이면 완성된 문장을 잠깐 보여준 후 자동으로 넘어가요.</p><div class="formrow"><input class="answer-input" id="cloze-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="?에 들어갈 영어" value="" ${u.busy?'disabled':''}>${button('빈칸 확인','cloze-check','gold',u.busy)}</div>`}
else {const words=p.en.trim().split(/\s+/);center=`<button class="korean-prompt" style="width:100%;border:0;cursor:pointer;color:var(--ink)" data-act="train-play" aria-label="한국어 문장을 눌러 영어 듣기">${h(p.ko)} <span style="font-size:12px;color:#688b7e">🔊</span></button><p class="muted small">영어를 보지 않고 낱단어를 하나씩 선택해 문장을 완성해요. 타이핑하지 않아도 돼요!</p><div class="chosen-area" id="selected-words">${u.wordChosen.length?u.wordChosen.map((ix,i)=>`<button class="token chosen" data-act="word-undo:${i}" ${u.busy?'disabled':''}>${h(words[ix])}</button>`).join(''):'<span class="placeholder">아래 낱단어를 순서대로 골라 주세요</span>'}</div><div class="option-bank">${u.wordChoices.map(ix=>`<button class="token" data-act="word:${ix}" ${u.wordChosen.includes(ix)||u.busy?'disabled':''}>${h(words[ix])}</button>`).join('')}</div><div class="small muted" id="word-count">${u.wordChosen.length} / ${words.length} 단어 완성</div><div class="statusline" id="word-status">${h(u.status||'틀려도 괜찮아요. 다시 골라 보세요 🌱')}</div>`}
return `${title('STEP 03 · PRACTICE','조금씩 문장 완성하기 🧩','대표 문장과 모델 예문을 모두 단계별로 익혀요.')}<div class="panel">${lessonSelector()}<div class="listen-route">${ps.map((x,i)=>`<button class="${u.idx===i?'active':''}" data-act="train-select:${i}">${i===0?'대표 문장':'예문 '+i}<span>${rec(x.id).word?'✓ 완성':'연습 중'}</span></button>`).join('')}</div></div><div class="panel"><div class="lesson-top"><div><div class="eyebrow">${h(p.type==='main'?'대표 문장':'MODEL EXAMPLE '+u.idx)}</div><h2>${names[u.stage]}</h2></div><span class="pill gold">${u.idx+1} / ${ps.length} 문장</span></div>${stepDots(u.stage,3)}${center}<div class="btnrow">${button('🔊 문장 다시 듣기','train-play','secondary',u.voiceBusy)}${button('↶ 다시 시작','train-reset','line')}${button('다음 문장 →','train-next','line')}</div></div>`}

function reviewIsRecall(p){return /-(main|ex1)$/.test(p.id)}
function reviewDay(id){return Number(id.match(/^day(\d+)-/)?.[1])||0}
function reviewMeaningChoices(p){
 const day=reviewDay(p.id),candidates=[...phrases(day).filter(x=>x.id!==p.id)];
 for(let offset=1;offset<=3;offset++)for(const n of [day-offset,day+offset])if(n>=1&&n<=DATA.length)candidates.push(...phrases(n));
 const choices=[{id:p.id,ko:p.ko}],seen=new Set([p.ko.trim()]);
 for(const c of shuffle(candidates)){
  const ko=String(c.ko||'').trim();
  if(!ko||seen.has(ko))continue;
  choices.push({id:c.id,ko});seen.add(ko);if(choices.length===3)break;
 }
 return shuffle(choices);
}
function reviewPrepare(){
 u.reviewWords=[];u.reviewOrder=[];u.reviewOptions=[];u.reviewChoice=null;u.reviewWrong=false;u.reviewBusy=false;u.reviewShow=false;u.status='';
 const p=phrase(u.reviewIds[u.reviewIndex]);if(!p)return;
 if(reviewIsRecall(p))u.reviewOrder=shuffle(p.en.trim().split(/\s+/).map((_,i)=>i));
 else u.reviewOptions=reviewMeaningChoices(p);
}
function reviewAttemptFailed(){
 const id=u.reviewIds[u.reviewIndex];if(!id)return;
 const r=rec(id);r.errors=(r.errors||0)+1;r.last=Date.now();save();
 u.reviewIds.push(id);u.reviewIndex++;reviewPrepare();
 toast('오늘 한 번 더 복습해 볼게요. 🌱');draw();
}
function reviewWordPick(index){
 const p=phrase(u.reviewIds[u.reviewIndex]);if(!p||!reviewIsRecall(p)||u.reviewBusy)return;
 const words=p.en.trim().split(/\s+/),next=u.reviewWords.length;
 if(!Number.isInteger(index)||index<0||index>=words.length||u.reviewWords.includes(index))return;
 if(words[index]!==words[next]){
  u.reviewWrong=true;u.status='순서가 달라요. 다른 단어를 골라 보세요.';
  const el=q('#review-status');if(el)el.textContent=u.status;return;
 }
 u.reviewWords.push(index);
 if(u.reviewWords.length>=words.length){
  u.reviewBusy=true;
  if(u.reviewWrong){u.reviewShow=true;draw();}
  else{applyReview('good');toast('정확하게 기억했어요! 🌟');}
 }else draw();
}
function reviewMeaningPick(index){
 const p=phrase(u.reviewIds[u.reviewIndex]);if(!p||reviewIsRecall(p)||u.reviewChoice!==null)return;
 const choice=u.reviewOptions[index];if(!choice)return;u.reviewChoice=index;
 if(choice.id===p.id){applyReview('good');toast('의미를 정확하게 이해했어요! 🌟');}
 else{u.reviewWrong=true;u.reviewShow=true;draw();}
}

function pageReview(){
 const ids=u.reviewIds||[];
 if(u.reviewIndex>=ids.length)return `${title('SPACED REVIEW','오늘의 기억 복습','학습한 문장을 복습합니다.')}<div class="panel empty"><h2>🌷 오늘의 복습을 마쳤어요!</h2><p>새로운 문장은 암기 완료 후 24시간 뒤부터 복습할 수 있어요.</p>${button('오늘 화면으로','nav:home','secondary')}</div>`;
 const p=phrase(ids[u.reviewIndex]);
 if(!p)return `${title('SPACED REVIEW','복습 자료가 없어요','설정에서 개인 교재 데이터를 확인해 주세요.')}${button('돌아가기','nav:home')}`;
 const isRecall=reviewIsRecall(p);
 const label=p.id.replace('day','DAY ').replace('-main',' · 대표').replace('-ex',' · 예문 ');
 let center='';
 if(isRecall){
  const w=p.en.trim().split(/\s+/);
  center=`<div class="review-card"><span class="pill">${h(label)} · 낱단어 암송</span><div class="big-korean">${h(p.ko)}</div><p class="small muted">한국어만 보고 낱단어를 순서대로 골라 문장을 만드세요.</p>
  <div class="chosen-area">${u.reviewWords.length?u.reviewWords.map(i=>`<span class="token chosen">${h(w[i])}</span>`).join(''):'<span class="placeholder">아래 낱단어를 골라 문장을 완성해요</span>'}</div>
  <div class="option-bank">${u.reviewOrder.map(i=>`<button class="token" data-act="review-word:${i}" ${u.reviewWords.includes(i)||u.reviewBusy?'disabled':''}>${h(w[i])}</button>`).join('')}</div>
  <p class="small muted">${u.reviewWords.length} / ${w.length} 단어</p>
  <div class="statusline" id="review-status" role="status">${u.reviewWrong?'틀린 단어가 있었어요. 완성 후 오늘 한 번 더 나옵니다.':h(u.status||'차근차근 순서대로 골라 보세요. 🌱')}</div>
  ${u.reviewBusy&&u.reviewWrong?`<div class="help">정답: <strong>${h(p.en)}</strong><p>이 문장은 오늘 다시 복습합니다.</p></div>${button('다음 문장 →','review-retry-next','gold')}`:''}</div>`;
 }else{
  const right=u.reviewOptions.find(x=>x.id===p.id);
  center=`<div class="review-card"><span class="pill">${h(label)} · 듣기·뜻 이해</span>
   <p class="small muted">영어를 듣고 뜻을 골라요. 아래 선택지는 등록된 교재 한국어 번역입니다.</p>
   <button class="touch-speak" data-act="review-speak" style="width:100%" aria-label="영어 문장 듣기"><div class="en">${h(p.en)}</div><span class="small muted">🔊 문장 듣기</span></button>
   <p class="small muted" style="margin:16px 0 8px">이 영어 문장의 뜻으로 알맞은 것은?</p>
   <div class="stack">${u.reviewOptions.map((opt,i)=>`<button class="btn ${u.reviewChoice!==null?(opt.id===p.id?'secondary':'line'):'line'}" style="text-align:left" data-act="review-meaning:${i}" ${u.reviewChoice!==null?'disabled':''}>${h(opt.ko)} ${u.reviewChoice!==null&&opt.id===p.id?'✓':''}</button>`).join('')}</div>
   ${u.reviewChoice!==null?`<div class="help">정답: <strong>${h(right?.ko||p.ko)}</strong><p>이 문장은 오늘 한 번 더 복습합니다.</p></div>${button('다음 문장 →','review-retry-next','gold')}`:''}</div>`;
 }
 return `${title('SPACED REVIEW','기억 복습 '+(u.reviewIndex+1)+' / '+ids.length,'대표·예문 1은 낱단어 암송, 예문 2~5는 영어 듣기와 뜻 이해.') }<div class="panel">${center}<div class="btnrow">${button('나중에 이어서 복습','nav:home','line')}</div></div>`;
}
function assessmentsList(){
 const arr=Array.from({length:Math.floor(DATA.length/10)},(_,i)=>(i+1)*10).map(n=>({key:'form'+n,name:`${n}강 형성평가`,range:[n-9,n],speech:12,concept:3}));
 if(DATA.length>=50)arr.push({key:'mid50',name:'50강 중간평가',range:[1,50],speech:30,concept:10});
 if(DATA.length===100)arr.push({key:'final100',name:'100강 최종평가',range:[1,100],speech:30,concept:10,pass:95});
 return arr;
}
function pageAssessments(){return `${title('CHECKPOINT EXAMS','형성평가 · 중간평가 · 최종평가','한국어를 보고 영어로 말하는 평가입니다. 음성 인식 미지원 시에는 연습·자가채점 모드로 응시할 수 있어요.')}<div class="panel"><h2>🎓 평가 지도</h2><div class="stack">${assessmentsList().map(a=>{let latest=db.assessments.filter(x=>x.key===a.key).at(-1);const trained=DATA.slice(a.range[0]-1,a.range[1]).reduce((n,d)=>n+d.phrases.filter(x=>rec(x.id).word).length,0),required=DATA.slice(a.range[0]-1,a.range[1]).reduce((n,d)=>n+d.phrases.length,0);return `<div class="lesson-top" style="border-bottom:1px solid var(--edge);padding:12px 0"><div><strong>${h(a.name)}</strong><p class="small muted">범위 ${a.range[0]}~${a.range[1]}강 · 암송 ${a.speech}문항 + 의미 ${a.concept}문항</p><p class="small muted">문장 준비 ${trained}/${required}${latest?` · 최근 ${latest.score}점 (${latest.manual?'자가채점':'음성 인식'})`:''}</p></div>${button('평가 시작','exam-start:'+a.key,'secondary')}</div>`}).join('')}</div></div><div class="panel"><h3>🎓 100강 졸업 기준</h3><p class="muted">100강 최종평가의 합격 기준은 95점입니다. 시험 중 첫 글자·단어 수·문장부호 힌트와 음성 듣기를 사용할 수 있어요.</p></div>`}
const clean=s=>s.toLowerCase().replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim().replace(/’/g,"'");
function accuracy(actual,expected){const a=clean(actual).replace(/\b(i'm|you're|he's|she's|we're|they're|don't|doesn't|can't|i'll)\b/g,m=>({'i\'m':'i am','you\'re':'you are','he\'s':'he is','she\'s':'she is','we\'re':'we are','they\'re':'they are','don\'t':'do not','doesn\'t':'does not','can\'t':'cannot','i\'ll':'i will'}[m]||m)).split(' ');const b=clean(expected).replace(/\b(i'm|you're|he's|she's|we're|they're|don't|doesn't|can't|i'll)\b/g,m=>({'i\'m':'i am','you\'re':'you are','he\'s':'he is','she\'s':'she is','we\'re':'we are','they\'re':'they are','don\'t':'do not','doesn\'t':'does not','can\'t':'cannot','i\'ll':'i will'}[m]||m)).split(' ');let dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)dp[i][0]=i;for(let j=0;j<=b.length;j++)dp[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return Math.max(0,1-dp[a.length][b.length]/Math.max(1,b.length))}

function verbPhraseMarkup(sentence,lessonTitle){
 const lemma=String(lessonTitle||'').match(/^[A-Za-z]+/)?.[0]?.toLowerCase()||'';
 const known={
  have:'have has had having',get:'get gets got gotten getting',make:'make makes made making',take:'take takes took taken taking',
  do:'do does did done doing',see:'see sees saw seen seeing',know:'know knows knew known knowing',go:'go goes went gone going',
  say:'say says said saying',let:'let lets letting',give:'give gives gave given giving',keep:'keep keeps kept keeping',
  leave:'leave leaves left leaving',bring:'bring brings brought bringing',come:'come comes came coming',put:'put puts putting',
  feel:'feel feels felt feeling',run:'run runs ran running',try:'try tries tried trying',stand:'stand stands stood standing',
  break:'break breaks broke broken breaking',hurt:'hurt hurts hurting',lose:'lose loses lost losing',catch:'catch catches caught catching',
  cost:'cost costs costing',sell:'sell sells sold selling',quit:'quit quits quitting',spoil:'spoil spoils spoiled spoiling',
  book:'book books booked booking',arrange:'arrange arranges arranged arranging',skip:'skip skips skipped skipping',
  grab:'grab grabs grabbed grabbing',spare:'spare spares spared sparing',owe:'owe owes owed owing',
  bother:'bother bothers bothered bothering',seem:'seem seems seemed seeming',finish:'finish finishes finished finishing'
 };
 const forms=new Set((known[lemma]||'').split(' ').filter(Boolean));
 forms.add(lemma);forms.add(lemma+'s');forms.add(lemma+'ed');forms.add(lemma+'ing');
 if(lemma.endsWith('e')){forms.add(lemma+'d');forms.add(lemma.slice(0,-1)+'ing');}
 if(lemma.endsWith('y')){forms.add(lemma.slice(0,-1)+'ies');forms.add(lemma.slice(0,-1)+'ied');}
 const words=[...String(sentence||'').matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)].map(m=>({text:m[0],lo:m[0].toLowerCase(),start:m.index,end:m.index+m[0].length}));
 let i=words.findIndex(w=>forms.has(w.lo));if(i<0)return {html:h(sentence),phrase:null};
 let start=i,end=i,auxFound=false;
 const aux=new Set("am is are was were be been being have has had do does did can could will would shall should may might must i'm you're he's she's it's we're they're i've you've we've they've i'd you'd he'd she'd we'd they'd i'll you'll he'll she'll we'll they'll isn't aren't wasn't weren't hasn't haven't hadn't don't doesn't didn't can't couldn't won't wouldn't shouldn't mustn't".split(' '));
 const modifiers=new Set(['not','never','already','just','still','really','always']);
 while(start>0){
  const p=words[start-1].lo;
  if(aux.has(p)){start--;auxFound=true;continue;}
  if(modifiers.has(p)&&start>=2&&aux.has(words[start-2].lo)){start-=2;auxFound=true;continue;}
  break;
 }
 if(['keep','mind','quit','bother'].includes(lemma)&&words[end+1]&&/ing$/.test(words[end+1].lo))end++;
 if(['get','come','go','head','turn','put','run','bring'].includes(lemma)&&words[end+1]&&['back','out','over','in','up','away','down','off','on'].includes(words[end+1].lo))end++;
 const a=words[start].start,b=words[end].end,phrase=sentence.slice(a,b);
 return {html:h(sentence.slice(0,a))+'<u class="exam-target-verb">'+h(phrase)+'</u>'+h(sentence.slice(b)),phrase};
}

function makeExam(key){const spec=assessmentsList().find(a=>a.key===key);if(!spec)return;let all=DATA.slice(spec.range[0]-1,spec.range[1]).flatMap(d=>phrases(d.day));let speech=shuffle(all).slice(0,spec.speech).map(p=>({kind:'speech',id:p.id,ko:p.ko,en:p.en,result:null,manual:false,spoken:null}));let meanings=shuffle(DATA.slice(spec.range[0]-1,spec.range[1])).slice(0,spec.concept).map(d=>{const main=phrases(d.day).find(p=>p.type==='main')||phrases(d.day)[0];if(!main||!main.en?.trim())return null;return {kind:'meaning',day:d.day,question:main.en,sourceId:main.id,choices:shuffleQuizOptions(d.day),result:null}}).filter(Boolean);u.exam={spec,questions:shuffle([...speech,...meanings]),index:0,answered:0,manual:false};u.screen='exam';u.examResult=null;stopVoice();draw()}
// Fixed-width guide: first uppercase letter, one blank per word, original terminal punctuation.
// Does not leak word lengths or the answer before speaking.
function sentenceShape(en){
 const tokens=String(en||'').trim().split(/\s+/).filter(Boolean);
 const initial=(tokens[0]||'').match(/[A-Za-z]/)?.[0]?.toUpperCase()||'';
 const punct=String(en||'').trim().match(/[.!?]+$/)?.[0]||'';
 return initial+'___'+(tokens.length>1?' '+Array(tokens.length-1).fill('____').join(' '):'')+punct;
}
function pageExam(){const e=u.exam;if(!e)return pageAssessments();const item=e.questions[e.index],total=e.questions.length;let feedback='';let contents='';if(item.kind==='speech'){contents=`<span class="pill gold">한국어 → 영어 말하기</span><div class="review-card"><button type="button" class="big-korean exam-ko-audio" data-act="exam-hint-speak" aria-label="한국어를 눌러 영어 문장 듣기">${h(item.ko)} <span class="exam-audio-icon">🔊</span></button><p class="small muted">한글을 누르면 영어 문장을 들려줘요.</p><div class="exam-word-guide" aria-label="첫 글자와 단어 개수, 마지막 문장 부호 힌트">${h(sentenceShape(item.en))}</div><p class="small muted">첫 글자 · 단어 ${item.en.trim().split(/\s+/).length}개 · 문장부호 힌트</p>${item.result!==null?`<div class="exam-answer">${h(item.en)}</div><p class="small muted">${item.spoken?'인식된 문장: '+h(item.spoken):'자가채점'} · 정확도 ${Math.round((item.result||0)*100)}%</p>`:''}</div>${item.result===null?`<div class="btnrow">${button(u.mic?'🎙️ 듣고 있어요…':'🎤 마이크로 영어 말하기','exam-mic','gold',!!u.mic)}${button('정답 확인·자가채점','exam-reveal','line')}</div><p class="small muted">※ 마이크를 사용할 수 없으면 자가채점은 연습 기록으로만 저장하며 공식 음성평가와 구분됩니다.</p>`:`<div class="btnrow">${button('🔊 정답 듣기','exam-speak','secondary')}</div>${item.spoken?`<p class="help">음성 인식이 틀리게 들었다면 아래에서 자가채점으로 정정할 수 있습니다. 이 경우 연습 평가로 기록됩니다.</p>`:''}${['다시(0%)','부분 정답(50%)','정확하게 말했다(100%)'].map((t,i)=>button(t,'exam-manual:'+([0,.5,1][i]),'line')).join('')}`}`}
else{const target=verbPhraseMarkup(item.question,lesson(item.day).title);contents=`<span class="pill gold">동사 핵심 뜻 이해</span><div class="review-card"><div class="big-english">${target.html}</div><p class="small muted">${target.phrase?`밑줄 친 <strong>${h(target.phrase)}</strong>은 이 문장에서 어떤 의미로 쓰였을까요?`:"이 문장에서 학습할 동사는 어떤 의미로 쓰였을까요?"}</p></div><div class="stack">${item.choices.map((ch,i)=>`<button class="btn ${item.result!==null?(ch.ok?'secondary':'line'):'line'}" style="text-align:left" data-act="exam-meaning:${i}" ${item.result!==null?'disabled':''}>${h(ch.text)} ${item.result!==null&&ch.ok?'✓':''}</button>`).join('')}</div>`}
return `${title('EXAM',e.spec.name,'정답을 확인한 뒤 다음 문제로 넘어가세요.')}<div class="panel"><div class="lesson-top"><span class="chip">${e.index+1} / ${total} 문항</span><span class="pill">한글을 누르면 영어 듣기 가능</span></div>${bar(e.index,total)}<div style="margin:18px 0">${contents}</div>${item.result!==null?button(e.index===total-1?'결과 확인':'다음 문제 →','exam-next','gold'):''}</div>`}
function reportExam(){let e=u.exam,score=0,speechQs=e.questions.filter(x=>x.kind==='speech'),meaningQs=e.questions.filter(x=>x.kind==='meaning');const speechScore=speechQs.length?(speechQs.reduce((s,x)=>s+(x.result||0),0)/speechQs.length)*80:0;const meaningScore=meaningQs.length?(meaningQs.filter(x=>x.result===1).length/meaningQs.length)*20:0;score=Math.round(speechScore+meaningScore);let result={key:e.spec.key,name:e.spec.name,score,passed:e.spec.key==='final100'&&score>=95&&!e.manual,speechScore:+speechScore.toFixed(1),meaningScore:+meaningScore.toFixed(1),manual:e.manual,when:Date.now()};db.assessments.push(result);save();u.examResult=result;u.screen='examReport';draw()}
function pageExamReport(){let r=u.examResult;if(!r)return pageAssessments();return `${title('EXAM RESULTS','시험을 마쳤어요! 🎉','부족했던 문장은 다시 복습하면 돼요.')}<div class="panel" style="text-align:center"><div class="eyebrow">${h(r.name)}</div><div style="font-size:64px;font-weight:900;color:var(--teal)">${r.score}<span style="font-size:20px">점</span></div><div class="results"><div class="result"><strong>${r.speechScore}</strong><small>영어 암송 / 80</small></div><div class="result"><strong>${r.meaningScore}</strong><small>의미 이해 / 20</small></div><div class="result"><strong>${r.manual?'연습':'음성 인식'}</strong><small>응시 방식</small></div></div>${r.key==='final100'?`<div class="help" style="margin-top:14px">${r.passed?'🎓 졸업 합격! 100강을 완주했어요.':r.score>=95?'95점 이상이지만 자가채점 결과이므로 연습 합격으로 표시돼요.':'합격 기준 95점에 다시 도전해 보세요.'}</div>`:''}${r.manual?'<div class="help" style="margin-top:14px">자가채점이 포함된 연습 결과입니다. 공식 인증에는 음성 인식 결과가 필요합니다.</div>':''}<div class="btnrow" style="justify-content:center">${button('시험 목록으로','nav:assessments','secondary')}${button('다시 도전','exam-start:'+r.key,'gold')}</div></div>`}
function pageRecords(){const visited=DATA.reduce((n,d)=>n+d.phrases.filter(p=>rec(p.id).stars>0).length,0);const longTerm=DATA.reduce((n,d)=>n+d.phrases.filter(p=>rec(p.id).longTerm).length,0);return `${title('MY RECORDS','차곡차곡 쌓이는 실력 📈','학습 날짜, 단어 퍼즐 성공, 복습 이력과 평가 점수를 확인하세요.')}<div class="grid3">${stat(totalStars()+'/'+maxStars(),'듣기 별')}${stat(studied(),'문장 퍼즐 완료')}${stat(longTerm,'장기 기억 문장')}</div><div class="panel"><h2>챕터별 달성 현황</h2><div class="stack">${DATA.map(d=>{const ps=phrases(d.day),w=ps.filter(p=>rec(p.id).word).length;return `<div class="lesson-top" style="align-items:center"><div><strong>${getTitle(d.day)}</strong><p class="small muted">${w}/${ps.length} 단어 완성 · 듣기 ${ps.reduce((n,p)=>n+rec(p.id).stars,0)} / ${ps.length*7}</p></div>${button('이동','open-day:'+d.day,'line')}</div>${bar(w,ps.length)}`}).join('')}</div></div>`}
function pageSettings(){return `${title('PARENT SETTINGS','설정 · 학습 기록 보호','기기 간 기록 동기화가 없으므로 파일로 백업하고 복원할 수 있습니다.')}<div class="panel" id="progress-reset-panel"><h2>🔄 학습 진도 처음부터 시작</h2><p class="muted">듣기 별, 문장 조립·빈칸·암기 완료, 복습 이력, 평가 결과를 모두 초기화하고 1강부터 다시 시작합니다.</p><p class="small muted">개인 교재 데이터와 직접 수정한 문장, 글씨·음성 설정은 지워지지 않습니다. 초기화한 기록은 되돌릴 수 없으니 위의 <strong>📤 기록 백업</strong>을 먼저 권장합니다.</p><label for="progress-reset-phrase">초기화하려면 아래에 <strong>초기화</strong>라고 입력하세요.</label><div class="formrow" style="margin-top:10px"><input id="progress-reset-phrase" type="text" placeholder="초기화" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="진도 초기화 확인 문구">${button('진도 전체 초기화','progress-reset','line')}</div></div><div class="panel"><h2>학습 설정</h2><p class="small muted">앱 업데이트: 2026.10.20 · 진도 초기화 지원</p><div class="formrow"><label>발음 속도 <select id="settings-speed">${[.7,.75,.85,1].map(v=>`<option value="${v}" ${db.prefs.speed===v?'selected':''}>${v}배속</option>`).join('')}</select></label><label>문장 조립 반복 <select id="settings-repeat">${[1,2,3,4].map(v=>`<option value="${v}" ${db.prefs.puzzleRepeats===v?'selected':''}>${v}번</option>`).join('')}</select></label></div><div class="btnrow">${button('📤 기록 백업','backup-export','secondary')}${button('📥 백업 불러오기','backup-import','line')}${button('🔁 이전 Day 1 기록 가져오기','legacy-day1','line')}</div><input id="file-import" type="file" accept=".json,application/json" style="display:none"><p class="help">PC에서 학습한 기록은 자동으로 태블릿에 나타나지 않습니다. 서로 다른 기기에서는 백업 파일을 옮겨 '불러오기'를 눌러 주세요. 클라우드 동기화는 추후 별도 구현이 필요합니다.</p></div><div class="panel"><h2>📚 개인 학습 데이터 100강 등록</h2><p class="muted">현재 이 기기에는 <strong>${DATA.length}강</strong>이 등록되어 있어요. 1~100강 데이터 JSON을 불러오면 학습 문장이 업데이트되며 <strong>기존 듣기 별·암기·복습·시험 기록은 그대로 유지</strong>됩니다.</p><label class="onboard-upload">개인 학습 데이터 파일 선택<input id="upgrade-lesson-file" type="file" accept=".json,application/json"></label><p class="small muted">교재 데이터는 이 기기 브라우저에 저장되며 공개 GitHub로 업로드되지 않습니다. 재설치나 브라우저 데이터 삭제 전 백업을 권장합니다.</p></div><div class="panel"><h2>교재 데이터 확인·수정</h2><p class="muted">이미지 원문과 다르게 보이는 글자가 있으면 영어·한국어를 직접 수정하고 저장할 수 있습니다. 수정 내용은 이 기기에만 저장됩니다.</p><div class="formrow"><select id="edit-day">${DATA.map(d=>`<option value="${d.day}" ${u.day===d.day?'selected':''}>${h(getTitle(d.day))}</option>`).join('')}</select>${button('문장 열기','edit-open','secondary')}</div><div id="editor-zone"></div></div><div class="panel"><h3>학습 자료 안내</h3><p class="small muted">저작권이 있는 교재에서 사용자가 제공한 사진을 바탕으로 개인 학습용으로 구성했습니다. 공개 배포·상업적 이용 전에는 적절한 이용 권한을 확인해야 합니다. 37강과 39강 모델 예문은 원문에 4개만 확인되었습니다.</p></div>`}
let voiceSeq=0,tts=null,hiTimer=null,playingFollow=false;
function stopVoice(){voiceSeq++;try{speechSynthesis.cancel()}catch(e){}if(hiTimer){clearInterval(hiTimer);hiTimer=null}qa('.audio-word.current').forEach(x=>x.classList.remove('current'));u.voiceBusy=false;u.activeWord=-1}
function setHighlight(n){const els=qa('.listen-focus .audio-word');if(!els.length)return;els.forEach((x,i)=>x.classList.toggle('current',i===n))}
function speak(text,done,highlight){stopVoice();const seq=voiceSeq; if(!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance){toast('이 기기에는 영어 음성 기능이 없어요.');return false;}let started=0,boundary=false;try{const utter=new SpeechSynthesisUtterance(text);utter.lang='en-US';utter.rate=db.prefs.speed||.85;utter.pitch=1;const voices=speechSynthesis.getVoices();const english=voices.filter(x=>x.lang.toLowerCase().startsWith('en-us'));utter.voice=english.find(x=>/google|microsoft|samantha|aria|jenny/i.test(x.name))||english[0]||voices.find(x=>x.lang.toLowerCase().startsWith('en'))||null;tts=utter;u.voiceBusy=true;const all=text.split(/\s+/).filter(Boolean);let estimate=Math.max(800,(text.length*42+all.length*75)/(db.prefs.speed||.85));utter.onstart=()=>{if(seq!==voiceSeq)return;started=performance.now();if(highlight){setHighlight(0);hiTimer=setInterval(()=>{if(seq!==voiceSeq||boundary||!started)return;const fraction=(performance.now()-started+Number(db.prefs.lead||0))/estimate;setHighlight(Math.min(all.length-1,Math.floor(Math.max(0,fraction)*all.length)));},70)}};utter.onboundary=e=>{if(seq!==voiceSeq||!highlight||e.name&&e.name!=='word')return;boundary=true;const words=[...text.matchAll(/\S+/g)];let idx=0;for(let i=0;i<words.length;i++)if(words[i].index<=e.charIndex)idx=i;setHighlight(Math.min(all.length-1,idx+((db.prefs.lead||0)>=350?1:0)))};utter.onend=()=>{if(seq!==voiceSeq)return;u.voiceBusy=false;stopHigh();if(done)done();};utter.onerror=e=>{if(seq!==voiceSeq)return;stopHigh();u.voiceBusy=false;toast('음성 재생이 완료되지 않았습니다. 별은 적립되지 않아요. 음성 설정을 확인해 주세요.');};speechSynthesis.speak(utter);return true;}catch(e){toast('이 브라우저에서 소리 재생을 시작할 수 없어요.');u.voiceBusy=false;return false}}
function stopHigh(){if(hiTimer){clearInterval(hiTimer);hiTimer=null}qa('.audio-word.current').forEach(x=>x.classList.remove('current'))}
function speakPraise(next){speak('Great!',()=>{setTimeout(()=>{if(next)next()},180)},false)}
function refreshStars(){const p=phrases(u.day)[u.idx];if(!p)return;const n=rec(p.id).stars;qa('.listen-focus .star').forEach((el,i)=>el.dataset.filled=i<n?String(i+1):'0');const total=phrases(u.day).reduce((x,p)=>x+rec(p.id).stars,0);const status=q('#listen-status');if(status)status.textContent=n===7?'Great! 모두 들었어요.':`${n} / 7번 끝까지 들었어요!`;const card=q('.listen-focus .pill.gold');if(card)card.textContent=n+' / 7';const navbtn=qa('.listen-route button')[u.idx];if(navbtn&&navbtn.querySelector('span'))navbtn.querySelector('span').textContent=n+' / 7 ★';}
function listenPlay(){if(u.voiceBusy)return;const ps=phrases(u.day);const currentIdx=u.idx,p=ps[currentIdx];const run=speak(p.en,()=>{if(u.screen!=='listen'||u.idx!==currentIdx)return;const r=rec(p.id);if(r.stars<7){r.stars++;r.last=Date.now();save();refreshStars();if(r.stars===7){speakPraise(()=>{if(u.screen!=='listen'||u.idx!==currentIdx)return;if(currentIdx<ps.length-1){u.idx++;draw()}else{toast('모든 문장에 별 7개씩! 참 잘했어요 🎉');draw()}});return}}else{refreshStars()}u.voiceBusy=false;const bt=q('[data-act="listen-play"]');if(bt)bt.disabled=false;},true);if(run){let b=q('[data-act="listen-play"]');if(b)b.disabled=true;}}
function stageAdvance(){if(u.stage<2){setupStage(u.stage+1);draw();return}if(u.idx<phrases(u.day).length-1){u.idx++;setupStage(0);draw()}else{toast('이번 강 문장 퍼즐을 모두 완성했어요! 🌟');nav('chapters')}}
function chunkSelect(i){if(u.busy||u.stage!==0)return;let p=phrases(u.day)[u.idx],cs=chunks(p),target=u.chosen.length;if(cs[i]!==cs[target]||u.chosen.includes(i)){u.status='순서가 달라요. 다른 덩어리를 찾아봐요.';const st=q('.statusline');if(st)st.textContent=u.status;return}u.busy=true;qa('.option-bank .token').forEach(n=>n.disabled=true);const selectedIndex=u.idx,stage=u.stage;speak(cs[i],()=>{if(u.screen!=='train'||u.idx!==selectedIndex||u.stage!==stage)return;u.busy=false;u.chosen.push(i);u.status='좋아요! 다음 덩어리를 골라 봐요.';if(u.chosen.length>=cs.length){const r=rec(p.id);r.chunk++;save();u.status=`${r.chunk} / ${db.prefs.puzzleRepeats}회 완성!`;setTimeout(()=>{if(u.screen!=='train'||u.idx!==selectedIndex||u.stage!==stage)return;if(r.chunk>=db.prefs.puzzleRepeats)stageAdvance();else{u.chosen=[];u.chunkChoices=shuffle(cs.map((_,n)=>n));draw()}},600)}else draw();},false)}
function clozeCheck(){if(u.busy||u.stage!==1)return;let p=phrases(u.day)[u.idx],g=gapWord(p),input=q('#cloze-input');if(!input)return;const val=input.value.toLowerCase().replace(/[^a-z]/g,'');if(!val){toast('빈칸에 영어를 입력해 주세요.');return}if(val!==g.answer.toLowerCase().replace(/[^a-z]/g,'')){u.status='한 번만 더 생각해 볼까요?';toast('조금 달라요. 다시 시도해 봐요 🌱');return}u.busy=true;rec(p.id).cloze=true;save();const el=q('#cloze-text');if(el)el.textContent=p.en;input.disabled=true;const check=q('[data-act="cloze-check"]');if(check)check.disabled=true;setTimeout(()=>{if(u.screen==='train'&&u.stage===1)stageAdvance()},900)}
function wordSelect(i){if(u.busy||u.stage!==2)return;const p=phrases(u.day)[u.idx],words=p.en.trim().split(/\s+/);let next=u.wordChosen.length;if(u.wordChosen.includes(i))return;if(words[i]!==words[next]){rec(p.id).errors++;save();const status=q('#word-status');if(status)status.textContent='순서가 달라요. 다른 단어를 찾아보세요. 🌱';return}u.wordChosen.push(i);const area=q('#selected-words'),fallback=area?.querySelector('.placeholder');if(fallback)fallback.remove();if(area){let b=document.createElement('button');b.className='token chosen';b.dataset.act='word-undo:'+(u.wordChosen.length-1);b.textContent=words[i];area.appendChild(b)}const opt=q(`[data-act="word:${i}"]`);if(opt)opt.disabled=true;const wc=q('#word-count');if(wc)wc.textContent=`${u.wordChosen.length} / ${words.length} 단어 완성`;if(u.wordChosen.length>=words.length){u.busy=true;const r=rec(p.id);r.word=true;if(!r.due){r.interval=1;r.due=Date.now()+86400000}r.last=Date.now();save();const status=q('#word-status');if(status)status.textContent='Great! 문장을 모두 완성했어요! 🎉';setTimeout(()=>{if(u.screen==='train'&&u.stage===2)stageAdvance()},800)}}
function applyReview(grade){let id=u.reviewIds[u.reviewIndex];if(!id)return;const r=rec(id);let days=1;if(grade==='again'){r.streak=0;r.interval=1;days=1}else if(grade==='hard'){r.streak++;days=Math.max(1,Math.ceil((r.interval||1)*1.25))}else if(grade==='good'){r.streak++;days=r.interval<2?3:r.interval<7?7:r.interval<14?14:Math.min(120,Math.ceil(r.interval*1.7))}else {r.streak++;days=r.interval<2?5:r.interval<7?10:Math.min(150,Math.ceil(r.interval*2.4))}r.interval=days;r.due=Date.now()+days*86400000;r.reviewCount++;r.last=Date.now();r.history.push({when:r.last,grade,interval:days});r.longTerm=(grade==='good'||grade==='easy')&&r.reviewCount>=2&&days>=14;save();u.reviewIndex++;u.reviewShow=false;if(u.reviewIndex>=u.reviewIds.length){toast('오늘의 복습 완료! 🎉');u.reviewIds=[]}else reviewPrepare();draw()}
function examMic(){const e=u.exam,item=e?.questions[e.index];if(!item||item.kind!=='speech'||item.result!==null)return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast('자동 음성 인식이 지원되지 않아요. 정답 확인·자가채점으로 연습할 수 있어요.');return;}stopVoice();const r=new SR();u.mic=r;r.lang='en-US';r.interimResults=false;r.continuous=false;try{r.start()}catch(err){u.mic=null;toast('마이크 권한 또는 HTTPS 연결을 확인해 주세요.');return}r.onresult=ev=>{let spoken=ev.results[0][0].transcript;item.spoken=spoken;item.result=accuracy(spoken,item.en);u.mic=null;draw()};r.onerror=()=>{u.mic=null;toast('음성 인식에 실패했어요. 다시 시도하거나 자가채점해 주세요.');draw()};r.onend=()=>{if(u.mic===r){u.mic=null;draw()}};draw()}
function download(name,content){const blob=new Blob([content],{type:'application/json;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
function importLegacy(){try{const old=JSON.parse(localStorage.getItem(OLDKEY)||'null');if(!old||old.app!=='seonyu-day01'||!old.phrases){toast('현재 저장 공간에서 이전 Day 1 기록을 찾지 못했어요.');return}if(!confirm('이전 Day 1 학습 기록을 50강 앱으로 가져올까요? 현재 Day 1 기록은 병합됩니다.'))return;for(let [id,r] of Object.entries(old.phrases)){if(!db.records[id]){db.records[id]=rec(id)}const into=db.records[id];into.stars=Math.max(into.stars,Math.min(7,r.stars||0));into.chunk=Math.max(into.chunk,r.puzzleCount||0);into.cloze=into.cloze||!!r.cloze;into.word=into.word||!!r.wordRecall;into.due=into.due||r.due||null;into.interval=into.interval||r.intervalDays||0;into.reviewCount=Math.max(into.reviewCount,r.reviewCount||0)}db.read[1]=db.read[1]||!!old.conceptRead;db.quiz[1]=db.quiz[1]||(old.quiz||[]).filter(Boolean).length>=2;save();toast('Day 1 기록을 병합했습니다.');draw()}catch(err){toast('가져오기에 실패했습니다.')}}
function renderEditor(){let day=Number(q('#edit-day')?.value)||u.day;const ps=phrases(day);const zone=q('#editor-zone');if(!zone)return;zone.innerHTML=`<p class="small muted">오류가 있을 때만 편집하세요. 저장하면 해당 기기의 학습·음성·평가 모두에 적용됩니다.</p>${ps.map(p=>`<div class="editor-entry"><strong>${p.type==='main'?'대표 문장':'예문 '+p.id.split('-ex')[1]}</strong><label>영어</label><input data-edit-en="${p.id}" value="${h(p.en)}"><label>한국어</label><input data-edit-ko="${p.id}" value="${h(p.ko)}"><label>의미 덩어리 ( | 로 구분 · 선택 사항)</label><input data-edit-chunks="${p.id}" value="${h(chunks(p).join(' | '))}"></div>`).join('')}<div class="btnrow">${button('수정 내용 저장','edit-save','gold')}${button('해당 강 원문으로 되돌리기','edit-reset','line')}</div>`}
function handle(action,e){if(!action)return;const [kind,param]=action.split(':');if(kind==='font-level'){db.prefs.fontLevel=Math.max(1,Math.min(5,Number(param)||3));save();draw();return}if(kind==='nav'){nav(param);return}if(kind==='open-day'){nav('reader',Number(param));return}if(kind==='reader-choice'){u.readerAnswer=Number(param);let options=shuffleQuizOptions(u.day);if(options[u.readerAnswer]?.ok){db.quiz[u.day]=true;save()}draw();return}if(kind==='read-done'){db.read[u.day]=true;save();nav('listen');return}
if(kind==='listen-select'){stopVoice();u.idx=Number(param);u.status='';draw();return}if(kind==='listen-next'){stopVoice();u.idx=Math.min(phrases(u.day).length-1,u.idx+1);draw();return}if(kind==='listen-play'){listenPlay();return}if(kind==='stop-voice'){stopVoice();draw();return}
if(kind==='train-select'){stopVoice();u.idx=Number(param);setupStage(0);draw();return}if(kind==='train-next'){stopVoice();if(u.idx<phrases(u.day).length-1){u.idx++;setupStage(0);draw()}else{nav('chapters')}return}if(kind==='train-play'){const p=phrases(u.day)[u.idx];speak(p.en,()=>{u.voiceBusy=false},false);return}if(kind==='train-reset'){stopVoice();setupStage(u.stage);draw();return}if(kind==='chunk'){chunkSelect(Number(param));return}if(kind==='cloze-check'){clozeCheck();return}if(kind==='word'){wordSelect(Number(param));return}if(kind==='word-undo'){if(u.busy)return;u.wordChosen=u.wordChosen.slice(0,Number(param));draw();return}
if(kind==='review-word'){reviewWordPick(Number(param));return}if(kind==='review-meaning'){reviewMeaningPick(Number(param));return}if(kind==='review-retry-next'){if(u.reviewWrong)reviewAttemptFailed();return}if(kind==='review-speak'){const p=phrase(u.reviewIds[u.reviewIndex]);if(p)speak(p.en,()=>{},false);return}
if(kind==='exam-start'){makeExam(param);return}if(kind==='exam-hint-speak'){const x=u.exam?.questions[u.exam.index];if(x&&x.kind==='speech')speak(x.en,()=>{},false);return}if(kind==='exam-mic'){examMic();return}if(kind==='exam-reveal'){const item=u.exam.questions[u.exam.index];item.result=0;item.manual=true;u.exam.manual=true;draw();return}if(kind==='exam-manual'){const item=u.exam.questions[u.exam.index];item.result=Number(param);item.manual=true;u.exam.manual=true;draw();return}if(kind==='exam-speak'){speak(u.exam.questions[u.exam.index].en,()=>{},false);return}if(kind==='exam-meaning'){const item=u.exam.questions[u.exam.index];if(item.result===null){item.result=item.choices[Number(param)]?.ok?1:0;draw()}return}if(kind==='exam-next'){const exam=u.exam;if(exam.index+1<exam.questions.length){exam.index++;stopVoice();draw()}else reportExam();return}
if(kind==='progress-reset'){
 const word=q('#progress-reset-phrase')?.value.trim();
 if(word!=='초기화'){toast('안전을 위해 확인 칸에 초기화를 정확히 입력해 주세요.');return;}
 if(!window.confirm('정말 모든 학습 진도를 초기화하고 1강부터 다시 시작할까요?\n\n듣기 별·암기·복습·평가 기록은 삭제됩니다.\n개인 교재 데이터, 문장 수정, 글씨·음성 설정은 유지됩니다.\n\n이 작업은 되돌릴 수 없습니다.'))return;
 stopVoice();try{u.mic?.abort?.()}catch(e){}u.mic=null;
 db.records={};db.read={};db.quiz={};db.assessments=[];db.currentDay=1;
 save();
 Object.assign(u,{screen:'home',day:1,idx:0,stage:0,chunkChoices:[],chosen:[],wordChoices:[],wordChosen:[],gapIndex:0,clozeShown:false,busy:false,status:'',readerAnswer:null,reviewIds:[],reviewIndex:0,reviewShow:false,reviewWords:[],reviewOrder:[],reviewOptions:[],reviewChoice:null,reviewWrong:false,reviewBusy:false,exam:null,examResult:null,activeWord:-1,voiceBusy:false});
 draw();window.scrollTo({top:0,behavior:'instant'});toast('학습 진도를 초기화했어요. 1강부터 새롭게 시작해요!');return;
}
if(kind==='backup-export'){download('Seonyu_EnglishMaster_100_backup_'+today()+'.json',JSON.stringify(db,null,2));return}if(kind==='backup-import'){q('#file-import')?.click();return}if(kind==='legacy-day1'){importLegacy();return}if(kind==='edit-open'){renderEditor();return}if(kind==='edit-save'){let day=Number(q('#edit-day')?.value)||u.day;for(let p of phrases(day)){const en=q(`[data-edit-en="${p.id}"]`),ko=q(`[data-edit-ko="${p.id}"]`);if(en&&ko&&en.value.trim()&&ko.value.trim()){
 const raw=q(`[data-edit-chunks="${p.id}"]`)?.value||'';
 const c=raw.split('|').map(v=>v.trim()).filter(Boolean);
 const edit={en:en.value.trim(),ko:ko.value.trim()};
 if(c.length>1){if(c.join(' ')!==edit.en){toast('의미 덩어리를 합치면 영어 문장과 같아야 합니다: '+p.id);return;}edit.chunks=c;}
 db.edits[p.id]=edit;
}}save();toast('교재 수정 내용을 저장했어요.');renderEditor();return}if(kind==='edit-reset'){let day=Number(q('#edit-day')?.value)||u.day;if(confirm('이 강의 문장 수정 사항만 초기화할까요? 학습 기록은 유지됩니다.')){for(const p of phrases(day))delete db.edits[p.id];save();renderEditor()}return}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;handle(b.dataset.act,e)});
document.addEventListener('change',async e=>{let t=e.target;if(['speech-speed','settings-speed'].includes(t.id)){db.prefs.speed=Number(t.value);save()}if(t.id==='speech-lead'){db.prefs.lead=Number(t.value);save()}if(t.id==='settings-repeat'){db.prefs.puzzleRepeats=Number(t.value);save()}if(t.id==='upgrade-lesson-file'){const f=t.files?.[0];if(f&&window.SEONYU_IMPORT_PRIVATE_FILE)window.SEONYU_IMPORT_PRIVATE_FILE(f);return}if(t.id==='file-import'){const file=t.files?.[0];if(!file)return;try{const incoming=JSON.parse(await file.text());if(incoming.schema!==1)throw Error('학습 기록 형식이 다릅니다.');if(incoming.app==='seonyu-day01'){if(!confirm('Day 1 백업 파일을 현재 50강 기록에 병합할까요?'))return;for(const [id,r] of Object.entries(incoming.phrases||{})){const dst=rec(id);dst.stars=Math.max(dst.stars,Math.min(7,r.stars||0));dst.chunk=Math.max(dst.chunk,r.puzzleCount||0);dst.cloze=dst.cloze||!!r.cloze;dst.word=dst.word||!!r.wordRecall;dst.due=dst.due||r.due||null;dst.interval=dst.interval||r.intervalDays||0;dst.reviewCount=Math.max(dst.reviewCount,r.reviewCount||0)}db.read[1]=db.read[1]||!!incoming.conceptRead;db.quiz[1]=db.quiz[1]||(incoming.quiz||[]).filter(Boolean).length>=2;}else if(incoming.app==='seonyu-master-50'){if(!confirm('현재 기록을 백업 파일로 교체할까요?'))return;db={...makeDB(),...incoming}}else throw Error('선유 영어 마스터 백업이 아닙니다.');save();u.day=db.currentDay||1;toast('백업을 복원했어요.');nav('home')}catch(err){toast('불러오기 실패: '+err.message)}}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.id==='cloze-input')clozeCheck()});
// Audio start requires a user gesture on Android; synthetic voices can appear after voiceschanged.
try{speechSynthesis?.addEventListener?.('voiceschanged',()=>{})}catch(e){}
// Keep original Day 1 records intact: import is opt-in and never writes to OLDKEY.
draw();
})();

}