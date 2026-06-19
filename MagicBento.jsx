// MagicBento — adapted from React Bits (github.com/DavidHDev/react-bits)
// JS + CSS variant. Uses window.gsap (loaded via CDN) and React globals.
// Tuned for the LIU CHEN portfolio: brand glow, fonts, and the six capability cards.

const { useRef, useEffect, useCallback, useState } = React;

const DEFAULT_PARTICLE_COUNT = 10;
const DEFAULT_SPOTLIGHT_RADIUS = 320;
const DEFAULT_GLOW_COLOR = '138, 160, 255';
const MOBILE_BREAKPOINT = 768;

const DEFAULT_CARDS = [
  { label: '01', title: '规则拆解与标准化', description: '把模糊需求转化为可执行字段与口径，输出规则文档、正例、反例与边界 case。' },
  { label: '02', title: '多模态质检体系', description: '围绕幻觉、客观性、OCR、ASR、动作时序、安全隐私等维度设计分层质检口径。' },
  { label: '03', title: '团队管理与排期', description: '按真实人效反推排期与质检配比，组织试标、培训、返工与交付的完整闭环。' },
  { label: '04', title: '自动化提效', description: '推动 Python 脚本与自动化工作流辅助预标，让人工专注机器做不了的判断。' },
  { label: '05', title: '评测体系设计', description: '将主观体验拆解为多维评分卡，建立盲评、一票否决与 hard prompt 回归集。' },
  { label: '06', title: '案例库沉淀', description: '建设 badcase / goodcase 案例库、QA 答疑库与培训视频，稳定团队口径。' },
];

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'mb-particle';
  el.style.cssText = `position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(${color},1);box-shadow:0 0 6px rgba(${color},0.6);pointer-events:none;z-index:100;left:${x}px;top:${y}px;`;
  return el;
};

const calculateSpotlightValues = radius => ({ proximity: radius * 0.5, fadeDistance: radius * 0.75 });

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const ParticleCard = ({
  children, className = '', disableAnimations = false, style,
  particleCount = DEFAULT_PARTICLE_COUNT, glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true, clickEffect = false, enableMagnetism = false
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    const gsap = window.gsap;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();
    particlesRef.current.forEach(particle => {
      if (!gsap) { particle.parentNode?.removeChild(particle); return; }
      gsap.to(particle, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => particle.parentNode?.removeChild(particle) });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    const gsap = window.gsap;
    if (!cardRef.current || !isHoveredRef.current || !gsap) return;
    if (!particlesInitialized.current) initializeParticles();
    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);
        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
        gsap.to(clone, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true });
        gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
      }, index * 100);
      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      const gsap = window.gsap;
      isHoveredRef.current = true;
      animateParticles();
      if (enableTilt && gsap) gsap.to(element, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
    };
    const handleMouseLeave = () => {
      const gsap = window.gsap;
      isHoveredRef.current = false;
      clearAllParticles();
      if (gsap && enableTilt) gsap.to(element, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
      if (gsap && enableMagnetism) gsap.to(element, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    };
    const handleMouseMove = e => {
      const gsap = window.gsap;
      if ((!enableTilt && !enableMagnetism) || !gsap) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const centerX = rect.width / 2, centerY = rect.height / 2;
      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        gsap.to(element, { rotateX, rotateY, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
      }
      if (enableMagnetism) {
        magnetismAnimationRef.current = gsap.to(element, { x: (x - centerX) * 0.05, y: (y - centerY) * 0.05, duration: 0.3, ease: 'power2.out' });
      }
    };
    const handleClick = e => {
      const gsap = window.gsap;
      if (!clickEffect || !gsap) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height));
      const ripple = document.createElement('div');
      ripple.style.cssText = `position:absolute;width:${maxDistance * 2}px;height:${maxDistance * 2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.2) 30%,transparent 70%);left:${x - maxDistance}px;top:${y - maxDistance}px;pointer-events:none;z-index:1000;`;
      element.appendChild(ripple);
      gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);
    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return React.createElement('div', { ref: cardRef, className: `${className} mb-particle-container`, style: { ...style, position: 'relative', overflow: 'hidden' } }, children);
};

const GlobalSpotlight = ({ gridRef, disableAnimations = false, enabled = true, spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS, glowColor = DEFAULT_GLOW_COLOR }) => {
  const spotlightRef = useRef(null);
  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;
    const spotlight = document.createElement('div');
    spotlight.className = 'mb-global-spotlight';
    spotlight.style.cssText = `position:fixed;width:800px;height:800px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(${glowColor},0.15) 0%,rgba(${glowColor},0.08) 15%,rgba(${glowColor},0.04) 25%,rgba(${glowColor},0.02) 40%,rgba(${glowColor},0.01) 65%,transparent 70%);z-index:200;opacity:0;transform:translate(-50%,-50%);mix-blend-mode:screen;`;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = e => {
      const gsap = window.gsap;
      if (!spotlightRef.current || !gridRef.current || !gsap) return;
      const section = gridRef.current.closest('.mb-bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      const cards = gridRef.current.querySelectorAll('.mb-card');
      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
        return;
      }
      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;
      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);
        minDistance = Math.min(minDistance, effectiveDistance);
        let glowIntensity = 0;
        if (effectiveDistance <= proximity) glowIntensity = 1;
        else if (effectiveDistance <= fadeDistance) glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });
      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' });
      const targetOpacity = minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
      gsap.to(spotlightRef.current, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.2 : 0.5, ease: 'power2.out' });
    };
    const handleMouseLeave = () => {
      const gsap = window.gsap;
      gridRef.current?.querySelectorAll('.mb-card').forEach(card => card.style.setProperty('--glow-intensity', '0'));
      if (spotlightRef.current && gsap) gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);
  return null;
};

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const MB_DECORATIONS = [
  '<svg viewBox="0 0 160 160" fill="none"><rect x="22" y="22" width="116" height="116" rx="8" stroke="rgba(138,160,255,.22)" stroke-width="2"/><path d="M22 61h116M22 100h116M61 22v116M100 22v116" stroke="rgba(138,160,255,.13)" stroke-width="1.4"/><rect x="61" y="61" width="39" height="39" fill="rgba(138,160,255,.08)" stroke="rgba(138,160,255,.45)" stroke-width="2"/></svg>',
  '<svg viewBox="0 0 160 160" fill="none"><circle cx="80" cy="80" r="58" stroke="rgba(138,160,255,.12)" stroke-width="2"/><circle cx="80" cy="80" r="40" stroke="rgba(138,160,255,.2)" stroke-width="2"/><circle cx="80" cy="80" r="22" stroke="rgba(138,160,255,.32)" stroke-width="2"/><path d="M68 80l9 9 18-22" stroke="rgba(138,160,255,.6)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 160 160" fill="none"><path d="M28 30v104" stroke="rgba(138,160,255,.18)" stroke-width="1.6"/><rect x="34" y="44" width="74" height="13" rx="6.5" fill="rgba(138,160,255,.1)" stroke="rgba(138,160,255,.32)" stroke-width="1.6"/><rect x="52" y="70" width="86" height="13" rx="6.5" fill="rgba(138,160,255,.08)" stroke="rgba(138,160,255,.26)" stroke-width="1.6"/><rect x="40" y="96" width="58" height="13" rx="6.5" fill="rgba(138,160,255,.1)" stroke="rgba(138,160,255,.32)" stroke-width="1.6"/><rect x="64" y="122" width="68" height="13" rx="6.5" fill="rgba(138,160,255,.06)" stroke="rgba(138,160,255,.24)" stroke-width="1.6"/></svg>',
  '<svg viewBox="0 0 160 160" fill="none"><path d="M36 124V72h40V40h48" stroke="rgba(138,160,255,.22)" stroke-width="2"/><path d="M36 96h44M124 72v52" stroke="rgba(138,160,255,.16)" stroke-width="1.6"/><circle cx="36" cy="124" r="6" fill="rgba(138,160,255,.12)" stroke="rgba(138,160,255,.5)" stroke-width="2"/><circle cx="76" cy="72" r="6" fill="rgba(138,160,255,.12)" stroke="rgba(138,160,255,.5)" stroke-width="2"/><circle cx="124" cy="40" r="6" fill="rgba(138,160,255,.12)" stroke="rgba(138,160,255,.5)" stroke-width="2"/><circle cx="124" cy="124" r="6" fill="rgba(138,160,255,.12)" stroke="rgba(138,160,255,.5)" stroke-width="2"/></svg>',
  '<svg viewBox="0 0 160 160" fill="none"><path d="M80 24L128.5 52V108L80 136L31.5 108V52Z" stroke="rgba(138,160,255,.18)" stroke-width="2" stroke-linejoin="round"/><path d="M80 52L112 68V100L80 112L52 96V66Z" stroke="rgba(138,160,255,.14)" stroke-width="1.5" stroke-linejoin="round"/><path d="M80 44L116 64L106 106L78 116L48 92L56 60Z" fill="rgba(138,160,255,.1)" stroke="rgba(138,160,255,.45)" stroke-width="2" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 160 160" fill="none"><rect x="40" y="44" width="84" height="40" rx="8" fill="rgba(138,160,255,.06)" stroke="rgba(138,160,255,.2)" stroke-width="2"/><rect x="32" y="62" width="84" height="40" rx="8" fill="rgba(138,160,255,.08)" stroke="rgba(138,160,255,.3)" stroke-width="2"/><rect x="24" y="80" width="84" height="40" rx="8" fill="rgba(138,160,255,.1)" stroke="rgba(138,160,255,.45)" stroke-width="2"/></svg>'
];

function MagicBento(props) {
  const {
    cards, textAutoHide = false, enableStars = true, enableSpotlight = true,
    enableBorderGlow = true, disableAnimations = false, spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
    particleCount = DEFAULT_PARTICLE_COUNT, enableTilt = true, glowColor = DEFAULT_GLOW_COLOR,
    clickEffect = true, enableMagnetism = true
  } = props;
  const data = Array.isArray(cards) && cards.length ? cards : DEFAULT_CARDS;
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const shouldDisable = disableAnimations || isMobile;

  const h = React.createElement;
  const cardInner = (card, index) => [
    h('div', { key: 'hd', className: 'mb-card__header' }, h('div', { className: 'mb-card__label' }, card.label)),
    h('div', { key: 'ct', className: 'mb-card__content' },
      h('h3', { className: 'mb-card__title' }, card.title),
      h('p', { className: 'mb-card__description' }, card.description)
    )
  ];

  return h(React.Fragment, null,
    enableSpotlight && h(GlobalSpotlight, { gridRef, disableAnimations: shouldDisable, enabled: enableSpotlight, spotlightRadius, glowColor }),
    h('div', { className: 'mb-card-grid mb-bento-section', ref: gridRef },
      data.map((card, index) => {
        const baseClassName = `mb-card ${textAutoHide ? 'mb-card--text-autohide' : ''} ${enableBorderGlow ? 'mb-card--border-glow' : ''}`;
        const cardProps = { className: baseClassName, style: { '--glow-color': glowColor } };
        if (enableStars) {
          return h(ParticleCard, { key: index, ...cardProps, disableAnimations: shouldDisable, particleCount, glowColor, enableTilt, clickEffect, enableMagnetism }, cardInner(card, index));
        }
        return h('div', { key: index, ...cardProps }, cardInner(card, index));
      })
    )
  );
}

// ---- styles ----
(function injectStyles() {
  if (typeof document === 'undefined') return;
  const id = 'magic-bento-styles';
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = `
  .mb-card-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;width:100%;}
  @media (min-width:1024px){
    .mb-card-grid{grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(220px,auto);}
    .mb-card:nth-child(3){grid-column:span 2;grid-row:span 2;}
    .mb-card:nth-child(4){grid-column:1/span 2;grid-row:2/span 2;}
    .mb-card:nth-child(6){grid-column:4;grid-row:3;}
  }
  @media (max-width:599px){ .mb-card-grid{grid-template-columns:1fr;} }
  .mb-card{display:flex;flex-direction:column;justify-content:space-between;position:relative;min-height:220px;padding:38px 34px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:#0C0E15;overflow:hidden;transition:border-color .3s,background .3s,transform .3s,box-shadow .3s;transform-style:preserve-3d;will-change:transform;
    --glow-x:50%;--glow-y:50%;--glow-intensity:0;--glow-radius:260px;}
  .mb-card:hover{border-color:rgba(138,160,255,.35);background:#0E1119;}
  .mb-card__header,.mb-card__content{position:relative;z-index:2;}
  .mb-card__label{font-family:'Space Grotesk',sans-serif;font-weight:500;font-size:15px;color:#8AA0FF;letter-spacing:1px;margin-bottom:24px;}
  .mb-card__title{font-family:'Space Grotesk','Noto Sans SC',sans-serif;font-weight:600;font-size:22px;line-height:1.3;margin:0 0 14px;color:#EAECF2;}
  .mb-card__description{font-family:'Noto Sans SC',sans-serif;font-size:15px;line-height:1.8;color:#9298AB;font-weight:300;margin:0;}
  .mb-card--text-autohide .mb-card__title{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1;line-clamp:1;overflow:hidden;}
  .mb-card--text-autohide .mb-card__description{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;}
  .mb-card--border-glow::after{content:'';position:absolute;inset:0;padding:1.5px;background:radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),rgba(138,160,255,calc(var(--glow-intensity)*0.9)) 0%,rgba(138,160,255,calc(var(--glow-intensity)*0.45)) 30%,transparent 60%);border-radius:inherit;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;pointer-events:none;z-index:1;transition:opacity .3s ease;}
  .mb-card--border-glow:hover{box-shadow:0 8px 30px -8px rgba(20,24,40,.6),0 0 26px rgba(138,160,255,.18);}
  .mb-particle-container:hover{box-shadow:0 8px 30px -10px rgba(20,24,40,.5),0 0 26px rgba(138,160,255,.16);}
  .mb-particle::before{content:'';position:absolute;inset:-2px;background:rgba(138,160,255,.2);border-radius:50%;z-index:-1;}
  .mb-global-spotlight{mix-blend-mode:screen;will-change:transform,opacity;z-index:200!important;pointer-events:none;}
  .mb-bento-section{position:relative;user-select:none;}`;
  document.head.appendChild(s);
})();

window.MagicBento = MagicBento;
if (typeof module !== 'undefined') { module.exports = { MagicBento }; }
