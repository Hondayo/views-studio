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
