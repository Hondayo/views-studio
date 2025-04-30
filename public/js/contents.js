// public/js/contents.js
// 3‑dot card menu: toggle + delete action
//   - カード右上の ⋮ ボタンでメニューを開閉
//   - 「削除」を押すと confirm 後 POST(DELETE) してリロード
//   - 他のカードメニューは同時に開かないよう排他制御

(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.works-grid');
    if (!grid) return;

    // ----------------------------------------------------
    // ① 3‑dot ボタン（.menu-btn）クリック → メニュー開閉
    // ----------------------------------------------------
    grid.addEventListener('click', evt => {
      const btn = evt.target.closest('.menu-btn');
      if (!btn) return;

      const menu = btn.nextElementSibling;
      if (!menu) return;

      // 他メニューを閉じる
      document.querySelectorAll('.card-menu.open').forEach(m => {
        if (m !== menu) m.classList.remove('open');
      });
      menu.classList.toggle('open');
    });

    // ----------------------------------------------------
    // ② メニュー内「削除」クリック
    // ----------------------------------------------------
    grid.addEventListener('click', async evt => {
      const del = evt.target.closest('.menu-delete');
      if (!del) return;

      const card   = del.closest('.work-card');
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

    // ----------------------------------------------------
    // ③ カード外クリックでメニューを閉じる
    // ----------------------------------------------------
    document.addEventListener('click', e => {
      if (!e.target.closest('.work-card')) {
        document.querySelectorAll('.card-menu.open').forEach(m => m.classList.remove('open'));
      }
    });
  });
})();
