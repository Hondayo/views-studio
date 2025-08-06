// public/js/contents.js
// コンテンツページ UI制御まとめ
// - 3ドットメニュー（開閉・削除）
// - タブ切替（有料コンテンツ／切り抜き）

document.addEventListener('DOMContentLoaded', () => {
  console.log('コンテンツページの初期化を開始します');
  
  setupCardMenu();
  setupDeleteAction();
  setupTabSwitch();
  setupCardLinks();
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
    
    // メニューボタンクリック時はイベント伝播を停止して作品詳細画面への遷移を防止
    evt.preventDefault();
    evt.stopPropagation();
    
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
    
    // 削除ボタンクリック時はイベント伝播を停止
    evt.preventDefault();
    evt.stopPropagation();
    
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
  
  if (!(tabWorks && tabShorts && worksSection && shortsSection)) {
    console.error('タブ要素が見つかりません');
    return;
  }

  tabWorks.addEventListener('click', (e) => {
    e.preventDefault();
    tabWorks.classList.add('active');
    tabShorts.classList.remove('active');
    worksSection.style.display = 'block';
    shortsSection.style.display = 'none';
  });
  
  tabShorts.addEventListener('click', (e) => {
    e.preventDefault();
    tabShorts.classList.add('active');
    tabWorks.classList.remove('active');
    worksSection.style.display = 'none';
    shortsSection.style.display = 'block';
  });
}

// =============================
// ④ 作品カードのリンク処理の改善
// =============================
function setupCardLinks() {
  const cards = document.querySelectorAll('.work-card');
  
  cards.forEach(card => {
    const link = card.querySelector('.card-link');
    
    if (link) {
      // カード全体のクリックでリンク先に移動（メニューボタンとメニュー除く）
      card.addEventListener('click', (e) => {
        // メニューボタンまたはメニュー内の要素がクリックされた場合は何もしない
        if (e.target.closest('.menu-btn') || e.target.closest('.card-menu')) {
          return;
        }
        
        // リンク先へ遷移
        link.click();
      });
    }
  });
}