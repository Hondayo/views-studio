document.addEventListener('DOMContentLoaded', () => {
  const sidebar   = document.getElementById('sidebar'); // ← IDで確実に取得
  const toggleBtn = document.getElementById('topbar-toggle');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }
});
