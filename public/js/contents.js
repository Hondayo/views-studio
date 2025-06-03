// public/js/contents.js
// 3‑dot card menu: toggle + delete action
//   - カード右上の ⋮ ボタンでメニューを開閉
//   - 「削除」を押すと confirm 後 POST(DELETE) してリロード
//   - 他のカードメニューは同時に開かないよう排他制御

// public/js/contents.js
// コンテンツページのUI制御・イベントまとめ
// - 3ドットメニューの開閉・削除
// - タブ切替UI
// public/js/contents.js
// コンテンツページ UI制御まとめ
// - 3ドットメニュー（開閉・削除）
// - タブ切替（有料コンテンツ／切り抜き）

document.addEventListener('DOMContentLoaded', () => {
  setupCardMenu();
  setupDeleteAction();
  setupTabSwitch();
});

// =============================
// ① 3ドットメニュー（⋮）の開閉
// =============================
function setupCardMenu() {
  const grid = document.querySelector('.works-grid');
  if (!grid) return;

  // ⋮ボタンクリックでメニュー開閉（他を閉じる）
  grid.addEventListener('click', evt => {
    const btn = evt.target.closest('.menu-btn');
    if (!btn) return;
    const menu = btn.nextElementSibling;
    if (!menu) return;
    document.querySelectorAll('.card-menu.open').forEach(m => {
      if (m !== menu) m.classList.remove('open');
    });
    menu.classList.toggle('open');
  });

  // カード外クリックで全メニューを閉じる
  document.addEventListener('click', e => {
    if (!e.target.closest('.work-card')) {
      document.querySelectorAll('.card-menu.open').forEach(m => m.classList.remove('open'));
    }
  });
}

// =============================
// ② メニュー内「削除」ボタン処理
// =============================
function setupDeleteAction() {
  const grid = document.querySelector('.works-grid');
  if (!grid) return;

  grid.addEventListener('click', async evt => {
    const del = evt.target.closest('.menu-delete');
    if (!del) return;
    const card = del.closest('.work-card');
    const workId = card?.dataset.workId;
    if (!workId) return;

    if (!confirm('この作品と関連エピソードをすべて削除しますか？')) return;

    try {
      const res = await fetch(`/works/${workId}?_method=DELETE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (res.ok) {
        location.reload();
      } else {
        alert('削除に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました');
    }
  });
}

// =============================
// ③ タブ切替UI（有料コンテンツ／切り抜き）
// =============================
function setupTabSwitch() {
  const tabWorks = document.getElementById('tab-works');
  const tabShorts = document.getElementById('tab-shorts');
  const worksSection = document.getElementById('works-section');
  const shortsSection = document.getElementById('shorts-section');
  if (!(tabWorks && tabShorts && worksSection && shortsSection)) return;

  tabWorks.addEventListener('click', () => {
    tabWorks.classList.add('active');
    tabShorts.classList.remove('active');
    worksSection.style.display = '';
    shortsSection.style.display = 'none';
  });
  tabShorts.addEventListener('click', () => {
    tabShorts.classList.add('active');
    tabWorks.classList.remove('active');
    worksSection.style.display = 'none';
    shortsSection.style.display = '';
  });
}
