// ═══════════════════════════════════════════════════════════
//  VISUAL EFFECTS — Scroll Reveal + Particles + Ripple
// ═══════════════════════════════════════════════════════════

/* ── Detect performance tier ──
   Low-end: navigator.hardwareConcurrency <= 2 or deviceMemory <= 1
   We disable heavy effects on low-end devices automatically. */
(function setupEffects(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const lowEnd = (navigator.hardwareConcurrency||4) <= 2 || (navigator.deviceMemory||4) <= 1;
  const isLow = prefersReduced || lowEnd;

  /* ── Particles background ── */
  if(!isLow){
    const container = document.getElementById('bgParticles');
    if(container){
      const count = (navigator.hardwareConcurrency||4) >= 6 ? 18 : 10;
      for(let i=0;i<count;i++){
        const p = document.createElement('span');
        p.className='particle';
        const size = 2 + Math.random()*3;
        const left = Math.random()*100;
        const delay = Math.random()*12;
        const dur = 8 + Math.random()*10;
        p.style.cssText=`width:${size}px;height:${size}px;left:${left}%;bottom:${-size}px;animation-delay:${delay}s;animation-duration:${dur}s;opacity:${0.2+Math.random()*0.4}`;
        container.appendChild(p);
      }
    }
  }

  /* ── Scroll Reveal (Intersection Observer) ──
     Attach .sr class to key elements after render, then observe. */
  const srObserver = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('visible');
        srObserver.unobserve(e.target);
      }
    });
  },{threshold:0.08,rootMargin:'0px 0px -30px 0px'});

  /* Public helper: attach scroll reveal to elements in a container */
  window.applyScrollReveal = function(container){
    if(isLow) return;
    // Cards
    container.querySelectorAll('.card:not(.sr),.stat-card:not(.sr)').forEach((el,i)=>{
      el.classList.add('sr','sr-delay-'+(Math.min(i%5+1,5)));
      srObserver.observe(el);
    });
    // Player grid cards
    container.querySelectorAll('.player-card:not(.sr)').forEach((el,i)=>{
      el.classList.add('sr','sr-scale','sr-delay-'+(Math.min(i%5+1,5)));
      srObserver.observe(el);
    });
    // Tier rows
    container.querySelectorAll('.tier-row:not(.sr)').forEach((el,i)=>{
      el.classList.add('sr','sr-left','sr-delay-'+(Math.min(i%4+1,5)));
      srObserver.observe(el);
    });
    // lb-card-rest (leaderboard rows)
    container.querySelectorAll('.lb-card-rest:not(.sr)').forEach((el,i)=>{
      el.classList.add('sr','sr-delay-'+(Math.min(i%5+1,5)));
      srObserver.observe(el);
    });
    // Page title / headers
    container.querySelectorAll('.page-title:not(.sr),.page-label:not(.sr)').forEach((el)=>{
      el.classList.add('sr');
      srObserver.observe(el);
    });
  };

  /* ── Ripple effect on buttons ── */
  if(!isLow){
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent=`
      .ripple-host{position:relative;overflow:hidden}
      .ripple-wave{
        position:absolute;border-radius:50%;
        background:rgba(255,255,255,0.18);
        transform:scale(0);animation:ripple .5s linear;
        pointer-events:none;
      }
      @keyframes ripple{from{transform:scale(0);opacity:.6}to{transform:scale(2.8);opacity:0}}
    `;
    document.head.appendChild(rippleStyle);

    document.addEventListener('click',function(e){
      const btn = e.target.closest('.btn-gold,.btn-login,.btn-discord,.btn-authorize,.tag-btn,.pill-btn,.nav-btn,.lb-card');
      if(!btn) return;
      if(!btn.classList.contains('ripple-host')) btn.classList.add('ripple-host');
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width,r.height)*1.4;
      const wave = document.createElement('span');
      wave.className='ripple-wave';
      wave.style.cssText=`width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px`;
      btn.appendChild(wave);
      wave.addEventListener('animationend',()=>wave.remove(),{once:true});
    });
  }

  /* ── Page transition ── */
  const origNavigate = window.navigate;
  if(typeof origNavigate==='function'){
    window.navigate = function(page, data){
      // briefly fade out current active page
      const active = document.querySelector('.page.active');
      if(active && !isLow){
        active.style.transition='opacity .15s ease';
        active.style.opacity='0';
        setTimeout(()=>{
          active.style.opacity='';
          active.style.transition='';
          origNavigate(page,data);
          // After render, apply scroll reveal to new page
          setTimeout(()=>{
            const newPage = document.getElementById('page-'+page);
            if(newPage) applyScrollReveal(newPage);
          },50);
        },120);
      } else {
        origNavigate(page,data);
        setTimeout(()=>{
          const newPage = document.getElementById('page-'+page);
          if(newPage) applyScrollReveal(newPage);
        },50);
      }
    };
  }

  /* ── Stat counter animation ── */
  window.animateCount = function(el, target, duration){
    if(isLow){ el.textContent=target; return; }
    const start = performance.now();
    const from = 0;
    function tick(now){
      const t = Math.min((now-start)/duration,1);
      const ease = t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
      el.textContent = Math.round(from+(target-from)*ease);
      if(t<1) requestAnimationFrame(tick);
      else el.textContent=target;
    }
    requestAnimationFrame(tick);
  };

  /* ── Nav logo floating ── */
  if(!isLow){
    const logo = document.querySelector('.nav-logo-icon');
    if(logo){
      logo.style.animation='floatY 3s ease-in-out infinite';
    }
  }

  /* ── Initial page reveal ── */
  setTimeout(()=>{
    const homePage = document.getElementById('page-home');
    if(homePage) applyScrollReveal(homePage);
  },300);

})();
