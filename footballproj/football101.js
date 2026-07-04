// scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); }
  });
}, {threshold:0.15});
revealEls.forEach(el=>io.observe(el));

// animate world cup bars when visible
const bars = document.querySelectorAll('.wc-bar-fill');
const barIo = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const el = e.target;
      el.style.width = el.dataset.pct + '%';
      barIo.unobserve(el);
    }
  });
}, {threshold:0.3});
bars.forEach(b=>barIo.observe(b));
