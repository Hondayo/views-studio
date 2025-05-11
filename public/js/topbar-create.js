document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('topbar-create-btn');
  const menu = document.getElementById('topbar-create-menu');
  if (btn && menu) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('open');
      }
    });
  }
});
