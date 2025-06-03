// =============================
// トップバー・サイドバー制御JS（共通）
// =============================
// - サイドバーの開閉
// - 作成メニューの開閉
// =============================

document.addEventListener('DOMContentLoaded', function () {
  setupSidebarToggle();
  setupCreateMenuToggle();
});

// サイドバーの開閉ボタンの初期化
function setupSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('topbar-toggle');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
    });
  }
}

// 作成メニュー（ドロップダウン）の初期化
function setupCreateMenuToggle() {
  const createBtn = document.getElementById('topbar-create-btn');
  const createMenu = document.getElementById('topbar-create-menu');
  if (createBtn && createMenu) {
    // メニュー開閉
    createBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      createMenu.classList.toggle('open');
    });
    // メニュー外クリックで閉じる
    document.addEventListener('click', function (e) {
      if (!createMenu.contains(e.target) && !createBtn.contains(e.target)) {
        createMenu.classList.remove('open');
      }
    });
  }
}
