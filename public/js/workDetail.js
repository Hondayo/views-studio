// 共通のトグル処理関数
function setupToggleButton(btnId, panelId, iconId) {
  const btn = document.getElementById(btnId);
  const panel = document.getElementById(panelId);
  const icon = iconId ? document.getElementById(iconId) : null;
  if (btn && panel) {
    btn.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      if (icon) {
        icon.style.transform = panel.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
      }
      if (panel.classList.contains('hidden')) {
        btn.textContent = '詳細を見る';
      } else {
        btn.textContent = '詳細を閉じる';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  setupToggleButton('toggleDetailBtn', 'workDetailPanel', 'toggleDetailIcon');
  setupToggleButton('toggleAnalysisBtn', 'analysisPanel');
  setupToggleButton('toggleDetailAreaBtn', 'detailArea');

  // サムネイル画像 → 動画切り替え (ホバー再生)
  const cards = document.querySelectorAll('.work-card');
  cards.forEach(card => {
    const img = card.querySelector('.static-image');
    const vid = card.querySelector('.hover-video');
    if (!vid) return;

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

  // 3) エピソード説明欄の高さが変動した場合の「続きを見る」ボタンの表示/非表示を判定し直す
  function updateEpisodeToggleButtons() {
    document.querySelectorAll('.epcard-desc-wrapper').forEach(function(wrapper) {
      const descText = wrapper.querySelector('.epcard-desc-text');
      const toggleBtn = wrapper.querySelector('.epcard-toggle-desc');
      if (!descText || !toggleBtn) return;
      // 一旦展開状態を解除し、max-heightを元に戻す
      descText.classList.remove('expanded');
      toggleBtn.textContent = '---続きを見る---';
      // ボタンの表示判定
      if (descText.scrollHeight > descText.offsetHeight + 1) {
        toggleBtn.style.display = 'inline-block';
      } else {
        toggleBtn.style.display = 'none';
      }
    });
  }

  updateEpisodeToggleButtons();
  document.querySelectorAll('.epcard-desc-wrapper').forEach(function(wrapper) {
    const descText = wrapper.querySelector('.epcard-desc-text');
    const toggleBtn = wrapper.querySelector('.epcard-toggle-desc');
    if (!descText || !toggleBtn) return;
    toggleBtn.addEventListener('click', function() {
      const expanded = descText.classList.toggle('expanded');
      toggleBtn.textContent = expanded ? '---閉じる---' : '---続きを見る---';
      if (!expanded) updateEpisodeToggleButtons();
    });
  });
  window.addEventListener('resize', updateEpisodeToggleButtons);
});
