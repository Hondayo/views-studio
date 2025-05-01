document.addEventListener('DOMContentLoaded', () => {
  // 1) 「詳細を見る」ボタンのトグル
  const detailBtn  = document.getElementById('toggleDetailBtn');
  const detailArea = document.getElementById('detailArea');
  
  if (detailBtn && detailArea) {
    detailBtn.addEventListener('click', () => {
      detailArea.classList.toggle('hidden');
      // ボタンの表示切り替え例
      if (detailArea.classList.contains('hidden')) {
        detailBtn.textContent = '詳細を見る';
      } else {
        detailBtn.textContent = '詳細を閉じる';
      }
    });
  }

  // 2) サムネイル画像 → 動画切り替え (ホバー再生)
  const cards = document.querySelectorAll('.work-card');
  cards.forEach(card => {
    const img = card.querySelector('.static-image');
    const vid = card.querySelector('.hover-video');
    if (!vid) return; // 動画が無い作品はスキップ

    card.addEventListener('mouseenter', () => {
      img.classList.add('hidden');
      vid.classList.remove('hidden');
      vid.currentTime = 0;
      vid.play();
    });
    card.addEventListener('mouseleave', () => {
      vid.pause();
      vid.currentTime = 0;
      vid.classList.add('hidden');
      img.classList.remove('hidden');
    });
  });
});
