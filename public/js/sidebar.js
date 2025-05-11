document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('sidebar-create-btn');
  const menu = document.getElementById('sidebar-create-menu');
  if (btn && menu) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.classList.toggle('active');
    });
    document.addEventListener('click', function(e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('active');
      }
    });
  }
});
