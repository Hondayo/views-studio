// (A) 動画削除
async function deleteVideo(videoId, publicId) {
    if (!confirm('本当にこの動画を削除しますか？')) return;
    try {
      // クエリパラメータ publicId 付きで削除API呼び出し
      const res = await fetch(`/api/video/${videoId}?publicId=${publicId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('動画を削除しました');
        // 一覧を更新
        window.location.reload();
      } else {
        alert('動画削除失敗: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました (動画削除)');
    }
  }
  
  // (B) 画像削除
  async function deleteImage(imageId, publicId) {
    if (!confirm('本当にこの画像を削除しますか？')) return;
    try {
      const res = await fetch(`/api/image/${imageId}?publicId=${publicId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('画像を削除しました');
        window.location.reload();
      } else {
        alert('画像削除失敗: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました (画像削除)');
    }
  }
  