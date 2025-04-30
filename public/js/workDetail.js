document.addEventListener('DOMContentLoaded', () => {
  // 1) デバイス切り替え (PC <-> モバイル)
  const deviceBtn   = document.getElementById('toggleDeviceBtn');
  const desktopView = document.getElementById('desktopView');
  const mobileView  = document.getElementById('mobileView');

  if (deviceBtn && desktopView && mobileView) {
    deviceBtn.addEventListener('click', () => {
      desktopView.classList.toggle('hidden');
      mobileView.classList.toggle('hidden');
    });
  }

  // 2) 「詳細」ボタンのトグル
  const detailBtn  = document.getElementById('toggleDetailBtn');
  const detailArea = document.getElementById('detailArea');

  if (detailBtn && detailArea) {
    detailBtn.addEventListener('click', () => {
      detailArea.classList.toggle('hidden');
      // ボタンの表示名を変える例
      if (detailArea.classList.contains('hidden')) {
        detailBtn.textContent = '詳細';
      } else {
        detailBtn.textContent = '詳細を閉じる';
      }
    });
  }
});

const cards = document.querySelectorAll('.work-card');
cards.forEach(card => {
  const img = card.querySelector('.static-image');
  const vid = card.querySelector('.hover-video');
  if (!vid) return; // 動画がない場合

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
