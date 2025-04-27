document.addEventListener('DOMContentLoaded', () => {
  /* ---------- DOM 取得 ---------- */
  const page      = document.querySelector('.viewer-page');
  const preview   = document.getElementById('previewPane');
  const editBtn   = document.getElementById('editBtn');
  const deviceBtn = document.getElementById('deviceBtn');

  /* ---------- 1) 編集モード切替 ---------- */
  editBtn.addEventListener('click', () => {
    page.classList.toggle('edit-mode');
  });

  /* ---------- 2) モバイル幅切替 ---------- */
  deviceBtn.addEventListener('click', () => {
    preview.classList.toggle('mobile');
  });

  /* ---------- 3) スマホフレームへ DOM を複製 ---------- */
  const src  = document.getElementById('viewerInner');   // PC 用プレビュー
  const dest = document.getElementById('phoneScreen');   // スマホ画面
  if (src && dest) {
    const clone = src.cloneNode(true);       // 深いコピー
    // ルート要素(クローン)のidが"viewerInner"と被るのでリネームし、子要素のIDは維持
    if (clone.hasAttribute('id')) {
      clone.setAttribute('id', 'viewerInnerPhone');
    }
    // ※ 下記の「子要素のid除去」は削除し、あえて子要素の #previewTitle 等を重複保持
    //    そうすると querySelectorAll('#previewTitle') が PC,phone 両方ヒットし
    //    ライブ更新が同期されるようになる
    //
    //  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    dest.appendChild(clone);
  }

  /* ---------- 4) ライブ反映 (PC + phone) ---------- */
  // 同じIDを持つ要素がPCプレビュー側 + スマホクローン側にそれぞれ存在するので
  // querySelectorAll(...) を使えば、両方まとめて一度に反映できる

  const bind = (srcId, dstSel, transform = v => v) => {
    const src  = document.getElementById(srcId);
    const dsts = document.querySelectorAll(dstSel); // PC + phone
    if (!src) return;
    const apply = () => dsts.forEach(d => d.textContent = transform(src.value));
    src.addEventListener('input', apply);
    apply(); // 初期値反映
  };

  // タイトル, 説明, タグ
  bind('titleInput', '#previewTitle', v => v || 'タイトル');
  bind('descInput',  '#previewDesc',  v => v || '説明…');
  bind('tagsInput',  '#previewTags',
       v => v.split(',').map(t=>t.trim()).filter(Boolean).join(' / ') || 'タグなし');

  /* 部門セレクト */
  const catSel = document.getElementById('catSelect');
  const catDsts= document.querySelectorAll('#previewCat');
  if (catSel) {
    catSel.addEventListener('change', () => {
      const txt = (catSel.value === 'story') ? 'ストーリー' : '映画';
      catDsts.forEach(d => d.textContent = txt);
    });
  }

  /* サムネイル画像プレビュー */
  const thumbIn = document.getElementById('thumbInput');
  const thumbDsts= document.querySelectorAll('#previewThumb');
  if (thumbIn) {
    thumbIn.addEventListener('change', () => {
      const f = thumbIn.files[0];
      if (!f) return;
      const rdr = new FileReader();
      rdr.onload = e => {
        thumbDsts.forEach(d => d.src = e.target.result);
      };
      rdr.readAsDataURL(f);
    });
  }
});

