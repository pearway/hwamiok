// content.json 로더 — 페이지 진입 시 콘텐츠 채워넣음
(async function() {
  try {
    const res = await fetch('content.json?t=' + Date.now()); // 캐시 방지
    if (!res.ok) throw new Error('content.json fetch failed');
    const c = await res.json();
    window.__hwamiokContent = c;

    // === HERO ===
    // 비메오 영상 또는 fallback 이미지
    const videoWrap = document.querySelector('.hero__video-wrap');
    if (videoWrap) {
      const placeholder = videoWrap.querySelector('.placeholder-video');
      if (c.hero.vimeoId) {
        // Vimeo 영상 삽입
        if (placeholder) placeholder.remove();
        const existingVideo = videoWrap.querySelector('iframe.hero__video');
        if (!existingVideo) {
          const iframe = document.createElement('iframe');
          iframe.className = 'hero__video';
          iframe.src = `https://player.vimeo.com/video/${c.hero.vimeoId}?background=1&autoplay=1&loop=1&muted=1&byline=0&title=0&portrait=0`;
          iframe.setAttribute('frameborder', '0');
          iframe.setAttribute('allow', 'autoplay; fullscreen');
          iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;';
          videoWrap.insertBefore(iframe, videoWrap.firstChild);
        }
      } else if (placeholder && c.hero.fallbackImage) {
        // Vimeo 미설정 시 fallback 이미지
        placeholder.style.background =
          `linear-gradient(135deg, rgba(10,8,7,.4) 0%, rgba(10,8,7,.2) 50%, rgba(10,8,7,.7) 100%), url('${c.hero.fallbackImage}') center/cover no-repeat`;
      }
    }

    // 사이드 라벨
    setText('.hero__side-since', c.hero.sideSince);
    setText('.hero__side-label', c.hero.sideLabel);
    // 캡션
    const cap = document.querySelector('.hero__caption-l');
    if (cap && c.hero.captionTop) {
      cap.innerHTML = `${esc(c.hero.captionTop)}<br><em>${esc(c.hero.captionBottom)}</em>`;
    }
    // 타이틀 (화미옥·味 / 김치찌개)
    const titleInners = document.querySelectorAll('.hero__title .t-mask__inner');
    if (titleInners.length >= 2 && c.hero.title) {
      titleInners[0].innerHTML = `${esc(c.hero.title)}<span class="hero__title-han">${esc(c.hero.titleHan)}</span>`;
      titleInners[1].innerHTML = `<em>${esc(c.hero.titleSub)}</em>`;
    }
    // 서브
    const sub = document.querySelector('.hero__sub');
    if (sub) sub.innerHTML = nl2br(c.hero.subText);

    // === STORY ===
    setImg('[data-img="story"]', c.story.image);
    setText('[data-text="story.tag"]', c.story.tag);
    const storyH2 = document.querySelector('[data-text="story.title"]');
    if (storyH2) storyH2.innerHTML = `${esc(c.story.titleLine1)}<br><em>${esc(c.story.titleLine2)}</em>`;
    setText('[data-text="story.body"]', c.story.body);
    setText('[data-text="story.sign"]', c.story.sign);

    // === MENU HERO ===
    setImg('[data-img="menuHero"]', c.menuHero.image);
    const mh = document.querySelector('[data-text="menuHero.title"]');
    if (mh) mh.innerHTML = `${esc(c.menuHero.titleLine1)} <em>${esc(c.menuHero.titleLine2)}</em>`;
    const mhBody = document.querySelector('[data-text="menuHero.body"]');
    if (mhBody) mhBody.innerHTML = nl2br(c.menuHero.body);

    // === MENU CAROUSEL ===
    if (Array.isArray(c.menuCarousel)) {
      const cards = document.querySelectorAll('.menu-carousel__card');
      c.menuCarousel.forEach((item, i) => {
        const card = cards[i];
        if (!card) return;
        const img = card.querySelector('img');
        const name = card.querySelector('.menu-carousel__name');
        if (img) img.src = item.image;
        if (name) name.textContent = item.name;
      });
    }

    // === INGREDIENT ===
    if (Array.isArray(c.ingredient)) {
      c.ingredient.forEach((item, i) => {
        const cell = document.querySelector(`[data-cell="ingredient-${i}"]`);
        if (!cell) return;
        const img = cell.querySelector('img');
        const name = cell.querySelector('.ingredient__cell-name');
        if (img) img.src = item.image;
        if (name) name.textContent = item.name;
      });
    }

    // === SIGNATURE ===
    if (Array.isArray(c.signature)) {
      c.signature.forEach((item, i) => {
        const img = document.querySelector(`[data-img="signature-${i}"]`);
        if (img) img.src = item.image;
        // Vimeo 영상 슬롯
        if (item.vimeoId) {
          injectVimeo(`[data-vimeo-slot="signature-${i}"]`, item.vimeoId);
        }
      });
    }

    // === INGREDIENT VIMEO (셀별로) ===
    if (Array.isArray(c.ingredient)) {
      c.ingredient.forEach((item, i) => {
        if (item.vimeoId) {
          injectVimeo(`[data-vimeo-slot="ingredient-${i}"]`, item.vimeoId);
        }
      });
    }

    // === STRIP VIDEO (full-bleed) ===
    if (c.stripVideo) {
      // poster image
      const poster = document.querySelector('.strip-video__poster');
      if (poster && c.stripVideo.fallbackImage) poster.src = c.stripVideo.fallbackImage;
      // line text
      const line = document.querySelector('.strip-video__line');
      if (line && c.stripVideo.lineText) line.textContent = c.stripVideo.lineText;
      // title
      const sh = document.querySelector('.strip-video__caption h3');
      if (sh && c.stripVideo.titleLine1) {
        sh.innerHTML = `${esc(c.stripVideo.titleLine1)}<br><em>${esc(c.stripVideo.titleLine2)}</em>`;
      }
      // Vimeo iframe
      if (c.stripVideo.vimeoId) {
        injectVimeo('[data-vimeo-slot="stripVideo"]', c.stripVideo.vimeoId);
      }
    }

    // === ATMOSPHERE ===
    setImg('[data-img="atmosphere1"]', c.atmosphere.image1);
    setImg('[data-img="atmosphere2"]', c.atmosphere.image2);
    setImg('[data-img="atmosphere3"]', c.atmosphere.image3);

    // === BACKGROUND IMAGES (Countdown / Profit / Process / Contact) ===
    if (c.backgrounds) {
      setBg('.countdown::before-bg', c.backgrounds.countdown, '.countdown');
      setBg('.profit-chart::before-bg', c.backgrounds.profitChart, '.profit-chart');
      setBg('.process::before-bg', c.backgrounds.process, '.process');
      setBg('.contact::before-bg', c.backgrounds.contact, '.contact');
    }

    // === COUNTDOWN deadline ===
    if (c.countdown && c.countdown.deadline) {
      window.__countdownDeadline = new Date(c.countdown.deadline).getTime();
    }

    // === CONTACT ===
    setText('[data-text="contact.phone"]', c.contact.phone);
    setText('[data-text="contact.hours"]', c.contact.hours);
    setText('[data-text="contact.addressMain"]', c.contact.addressMain);
    setText('[data-text="contact.addressRD"]', c.contact.addressRD);

    // === POPUPS ===
    if (Array.isArray(c.popups) && c.popups.length > 0) {
      initPopups(c.popups);
    }

    document.body.classList.add('content-loaded');
  } catch (e) {
    console.warn('[content loader] failed:', e);
    document.body.classList.add('content-loaded'); // 실패해도 페이지는 보이게
  }
})();

// ===== POPUPS =====
function initPopups(popups) {
  const container = document.getElementById('popups');
  if (!container) return;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  let visibleCount = 0;
  popups.forEach((data, i) => {
    if (!data || data.enabled === false) return;
    // "오늘 하루 열지 않기" 체크
    const hideKey = `hwamiok-popup-hide-${i}`;
    if (localStorage.getItem(hideKey) === today) return;

    const el = container.querySelector(`.popup[data-popup-index="${i}"]`);
    if (!el) return;

    // 콘텐츠 채우기
    const img = el.querySelector('.popup__image img');
    if (img && data.image) { img.src = data.image; img.alt = data.title || ''; }
    setIfExists(el, '.popup__eyebrow', data.eyebrow);
    setIfExists(el, '.popup__title', data.title, true);
    setIfExists(el, '.popup__text', data.body, true);
    const cta = el.querySelector('.popup__cta');
    if (cta) {
      if (data.ctaText) {
        cta.textContent = data.ctaText;
        cta.href = data.ctaLink || '#';
      } else {
        cta.style.display = 'none';
      }
    }

    // 닫기 버튼 이벤트
    el.querySelectorAll('.popup__close, .popup__close-btn').forEach(btn => {
      btn.addEventListener('click', () => closePopup(el));
    });
    // 오늘 하루 열지 않기
    el.querySelector('.popup__hide-today').addEventListener('click', () => {
      localStorage.setItem(hideKey, today);
      closePopup(el);
    });

    el.style.display = 'block';
    visibleCount++;
  });

  if (visibleCount > 0) {
    container.classList.add('show');
    // 백드롭 클릭 시 모든 팝업 닫기 (선택사항)
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        container.querySelectorAll('.popup').forEach(p => closePopup(p));
      }
    });
  }
}
function closePopup(el) {
  el.style.transition = 'opacity .25s, transform .25s';
  el.style.opacity = '0';
  el.style.transform = (el.dataset.popupIndex === '1' ? 'translateX(-50%) ' : '') + 'translateY(20px)';
  setTimeout(() => {
    el.style.display = 'none';
    const container = document.getElementById('popups');
    const remaining = container.querySelectorAll('.popup[style*="display: block"], .popup:not([style*="display: none"])');
    let hasVisible = false;
    container.querySelectorAll('.popup').forEach(p => {
      if (p.style.display !== 'none' && p !== el) hasVisible = true;
    });
    if (!hasVisible) container.classList.remove('show');
  }, 250);
}
function setIfExists(root, sel, val, preserveNewlines) {
  const el = root.querySelector(sel);
  if (!el || val == null) return;
  if (preserveNewlines) el.textContent = val;
  else el.textContent = val;
}

// ===== Helpers =====
function injectVimeo(selector, vimeoId) {
  if (!vimeoId) return;
  document.querySelectorAll(selector).forEach(container => {
    // 기존 iframe 있으면 제거
    const old = container.querySelector('iframe.vimeo-bg');
    if (old) old.remove();
    const iframe = document.createElement('iframe');
    iframe.className = 'vimeo-bg';
    iframe.src = `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1&byline=0&title=0&portrait=0&controls=0`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen');
    iframe.setAttribute('loading', 'lazy');
    container.appendChild(iframe);
  });
}
function setText(selector, value) {
  if (!value) return;
  document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
}
function setImg(selector, src) {
  if (!src) return;
  document.querySelectorAll(selector).forEach(el => { el.src = src; });
}
function setBg(_unused, src, targetSelector) {
  if (!src || !targetSelector) return;
  // CSS custom property로 배경 이미지 전달 → CSS에서 var(--bg-image) 사용
  document.querySelectorAll(targetSelector).forEach(el => {
    el.style.setProperty('--bg-image', `url('${src}')`);
  });
}
function nl2br(s) { return s ? esc(s).replace(/\n/g, '<br>') : ''; }
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
