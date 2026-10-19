(function(){
  'use strict';
  const LESSON_KEY='seonyu.private.lessons.v1';
  const notice=document.getElementById('onboard');
  const status=document.getElementById('onboard-status');
  function valid(v){
    return !!v && v.format==='seonyu-lessons-v1' && Array.isArray(v.lessons) && (v.lessons.length===50 || v.lessons.length===100) &&
      v.lessons.every((d,i)=>d.day===i+1 && typeof d.meaning==='string' &&
        Array.isArray(d.phrases) && d.phrases.length>=5 && d.phrases.length<=6 &&
        d.phrases.every(p=>typeof p.en==='string' && typeof p.ko==='string' &&
          /^day\d{2,3}-(main|ex\d+)$/.test(p.id)));
  }
  let loaded=null;
  try {loaded=JSON.parse(localStorage.getItem(LESSON_KEY)||'null');}catch(e){}
  if(valid(loaded)){
    window.SEONYU_DATA=loaded.lessons;
    notice.hidden=true;
  }else{
    window.SEONYU_DATA=null;
    notice.hidden=false;
  }
  function importData(file){
    if(!file)return;
    status.textContent='파일을 확인하고 있어요…';
    file.text().then(raw=>{
      const value=JSON.parse(raw);
      if(!valid(value)) throw new Error('1~100강 개인 학습 데이터 파일을 선택해 주세요.');
      const stripped={format:'seonyu-lessons-v1',lessons:value.lessons.map(d=>{
        const {diaryImage, ...rest}=d;
        return rest;
      })};
      localStorage.setItem(LESSON_KEY,JSON.stringify(stripped));
      status.textContent='등록 완료! 학습실로 이동합니다.';
      window.location.reload();
    }).catch(e=>{status.textContent='파일 확인 실패: '+e.message;});
  }
  window.SEONYU_IMPORT_PRIVATE_FILE=importData;
  window.SEONYU_LESSON_COUNT=valid(loaded)?loaded.lessons.length:0;
  const input=document.getElementById('private-data-file');
  input?.addEventListener('change',ev=>importData(ev.target.files[0]));
  if('serviceWorker' in navigator && location.protocol==='https:'){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();