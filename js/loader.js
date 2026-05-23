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
          iframe.src = `https://player.vimeo.com/video/${c.hero.vimeoId}?background=1&autoplay=1&loop=1&muted=1&byline=0&title=0&portrait=0&controls=0&badge=0&autopause=0&player_id=0&app_id=58479`;
          iframe.setAttribute('frameborder', '0');
          iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
          iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
          iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;';
          videoWrap.setAttribute('data-video-aspect', '16/9');
          videoWrap.insertBefore(iframe, videoWrap.firstChild);
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
        // Vimeo 영상 슬롯 (시그니처 01: 가로 16:9)
        if (item.vimeoId) {
          injectVimeo(`[data-vimeo-slot="signature-${i}"]`, item.vimeoId, '16/9');
        }
      });
    }

    // === INGREDIENT VIMEO (셀별로 - 세로 9:16) ===
    if (Array.isArray(c.ingredient)) {
      c.ingredient.forEach((item, i) => {
        if (item.vimeoId) {
          injectVimeo(`[data-vimeo-slot="ingredient-${i}"]`, item.vimeoId, '9/16');
        }
      });
    }

    // === STRIP VIDEO (세로 9:16) ===
    if (c.stripVideo) {
      // poster image
      const poster = document.querySelector('.strip-video__poster');
      if (poster && c.stripVideo.fallbackImage) poster.src = c.stripVideo.fallbackImage;
      // line text
      const line = document.querySelector('.strip-video__line');
      if (line && c.stripVideo.lineText) line.textContent = c.stripVideo.lineText;
      // title
      const sh = document.querySelector('.strip-video__media + .strip-video__text h3, .strip-video__text h3');
      if (sh && c.stripVideo.titleLine1) {
        sh.innerHTML = `${esc(c.stripVideo.titleLine1)}<br><em>${esc(c.stripVideo.titleLine2)}</em>`;
      }
      if (c.stripVideo.vimeoId) {
        injectVimeo('[data-vimeo-slot="stripVideo"]', c.stripVideo.vimeoId, '9/16');
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
  const today = new Date().toISOString().slice(0, 10);

  let visibleCount = 0;
  const allPopups = container.querySelectorAll('.popup');
  allPopups.forEach((el, i) => {
    const data = popups[i] || {enabled: true};
    if (data.enabled === false) return;

    const hideKey = `hwamiok-popup-hide-${i}`;
    if (localStorage.getItem(hideKey) === today) return;

    // 이미지 src 적용 (content.json에서 교체 가능)
    if (data.image) {
      const img = el.querySelector('.popup__image');
      if (img) img.src = data.image;
    }
    // 링크 적용
    if (data.ctaLink) {
      const link = el.querySelector('.popup__image-link');
      if (link) link.href = data.ctaLink;
    }

    // X / 닫기 버튼
    el.querySelectorAll('.popup__close, .popup__close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closePopup(el);
      });
    });
    // 24시간 닫기
    el.querySelectorAll('.popup__hide-today').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.setItem(hideKey, today);
        closePopup(el);
      });
    });

    el.style.display = 'flex';
    visibleCount++;
  });

  if (visibleCount > 0) {
    container.classList.add('show');
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
  const isCenter = el.dataset.popupIndex === '1';
  el.style.transform = (isCenter ? 'translateX(-50%) ' : '') + 'translateY(20px) scale(.95)';
  setTimeout(() => {
    el.style.display = 'none';
    const container = document.getElementById('popups');
    let hasVisible = false;
    container.querySelectorAll('.popup').forEach(p => {
      if (p.style.display !== 'none' && p !== el) hasVisible = true;
    });
    if (!hasVisible) container.classList.remove('show');
  }, 250);
}

// ===== Helpers =====
function injectVimeo(selector, vimeoId, aspect) {
  if (!vimeoId) return;
  document.querySelectorAll(selector).forEach(container => {
    // 기존 iframe 있으면 제거
    const old = container.querySelector('iframe.vimeo-bg');
    if (old) old.remove();
    // 컨테이너에 video aspect 부여 (CSS가 받아서 비율 맞춤)
    if (aspect) container.setAttribute('data-video-aspect', aspect);
    const iframe = document.createElement('iframe');
    iframe.className = 'vimeo-bg';
    iframe.src = `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1&byline=0&title=0&portrait=0&controls=0&badge=0&autopause=0&player_id=0&app_id=58479`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
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
