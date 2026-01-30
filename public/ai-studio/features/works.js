/**
 * AI创作工坊 - 作品管理（优化布局版本）
 */
(function () {
  var id = 'works';
  var name = '作品管理';
  var icon = '📁';
  var workPollingIntervals = {};
  var TYPE_NAMES = { text2img: '图片生成', img2video: '图生视频', lipsync: '对口型', text2audio: '文生音效', tts: '语音合成', dubbing: '视频生音效', editimg: '多图参考生图' };
  
  // 下载管理器
  var downloadManager = {
    downloadFile: function(url, fileName, onProgress) {
      return new Promise((resolve, reject) => {
        try {
          if (!url) throw new Error('缺少下载链接');

          // data: / blob: 直接下载（无需 fetch）
          if (/^(data:|blob:)/i.test(url)) {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'download.file';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            resolve();
            return;
          }

          fetch(url)
            .then(response => {
              if (!response.ok) throw new Error('下载失败');
              return response.blob().then(blob => ({ blob, response }));
            })
            .then(({ blob, response }) => {
              let finalName = fileName || this.getFileNameFromUrl(url);
              // 如果文件名没有后缀，尝试用 Content-Type 推断
              if (!/\.[a-z0-9]{2,5}$/i.test(finalName)) {
                const ct = (response.headers && response.headers.get && response.headers.get('content-type')) || blob.type || '';
                const ext = this.getExtFromContentType(ct);
                if (ext) finalName = finalName + ext;
              }

              const downloadUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.download = finalName || 'download.file';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(downloadUrl);
              resolve();
            })
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      });
    },
    
    getExtFromContentType: function(contentType) {
      const ct = String(contentType || '').toLowerCase();
      if (!ct) return '';
      if (ct.includes('image/png')) return '.png';
      if (ct.includes('image/jpeg')) return '.jpg';
      if (ct.includes('image/webp')) return '.webp';
      if (ct.includes('image/gif')) return '.gif';
      if (ct.includes('video/mp4')) return '.mp4';
      if (ct.includes('video/webm')) return '.webm';
      if (ct.includes('audio/mpeg')) return '.mp3';
      if (ct.includes('audio/wav')) return '.wav';
      if (ct.includes('application/json')) return '.json';
      if (ct.includes('text/plain')) return '.txt';
      return '';
    },

    sanitizeFileName: function(name) {
      return String(name || 'download')
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120) || 'download';
    },

    getFileNameFromUrl: function(url) {
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        const extension = filename.includes('.') ? '' : '.file';
        return filename || 'download' + extension;
      } catch {
        return 'download.file';
      }
    }
  };

  function getPanel() {
    return [
      // 主容器（样式在 media-studio.css 中定义）
      '<div class="works-container">',
      '  <div class="works-header">',
      '    <h2 class="panel-title">🎨 作品管理</h2>',
      '    <button type="button" class="works-search-btn" id="works-search-by-taskid">',
      '      <span>🔍</span>',
      '      通过任务ID搜索',
      '    </button>',
      '  </div>',
      '  <div class="works-filter-row">',
      '    <label class="works-filter-label">分类筛选：</label>',
      '    <select id="works-filter-type" class="ms-select works-filter-select">',
      '      <option value="">全部</option>',
      '      <option value="text2img">图片生成</option>',
      '      <option value="img2video">图生视频</option>',
      '      <option value="lipsync">对口型</option>',
      '      <option value="text2audio">文生音效</option>',
      '      <option value="tts">语音合成</option>',
      '      <option value="dubbing">视频生音效</option>',
      '      <option value="editimg">多图参考生图</option>',
      '    </select>',
      '  </div>',
      '',
      // 作品列表
      '<div class="works-grid" id="worksList">加载中...</div>',
      '<div class="works-empty" id="worksEmpty" style="display:none;">',
      '  <div style="font-size: 3rem; margin-bottom: 20px;">📁</div>',
      '  <div style="font-size: 1.1rem; margin-bottom: 10px;">暂无作品</div>',
      '  <div style="font-size: 0.9rem;">请在图片生成、图生视频等功能中生成作品</div>',
      '</div>',
      
      // 搜索弹窗
      '<div class="modal-overlay" id="searchModal">',
      '  <div class="modal-content">',
      '    <div class="modal-header">',
      '      <h3 class="modal-title">通过任务ID搜索作品</h3>',
      '      <button class="modal-close" id="closeSearchModal">&times;</button>',
      '    </div>',
      '    <div class="modal-body">',
      '      <div class="form-row">',
      '        <label>任务ID</label>',
      '        <input type="text" id="search-taskid-input" placeholder="请输入完整的任务ID" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:rgba(0,0,0,0.3);color:var(--text);">',
      '      </div>',
      '      <div class="form-row">',
      '        <label>作品类型</label>',
      '        <select id="search-task-type" class="ms-select" style="width:100%;">',
      '          <option value="text2img">图片生成</option>',
      '          <option value="img2video">图生视频</option>',
      '          <option value="lipsync">对口型</option>',
      '          <option value="text2audio">文生音效</option>',
      '          <option value="tts">语音合成</option>',
      '          <option value="dubbing">视频生音效</option>',
      '          <option value="editimg">多图参考生图</option>',
      '        </select>',
      '      </div>',
      '    </div>',
      '    <div class="modal-actions">',
      '      <button type="button" class="btn-secondary" id="cancelSearch">取消</button>',
      '      <button type="button" class="btn-primary" id="searchTaskById">搜索</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '  <div class="work-preview-overlay" id="workPreviewOverlay">',
      '    <button type="button" class="work-preview-close" id="workPreviewClose" aria-label="关闭">&times;</button>',
      '    <div class="work-preview-inner" id="workPreviewInner"></div>',
      '  </div>',
      '  <div class="modal-overlay" id="workTitleModal">',
      '    <div class="modal-content" style="max-width: 480px;">',
      '      <div class="modal-header">',
      '        <h3 class="modal-title">完整介绍</h3>',
      '        <button class="modal-close" id="closeWorkTitleModal" aria-label="关闭">&times;</button>',
      '      </div>',
      '      <div class="modal-body" id="workTitleModalBody" style="white-space: pre-wrap; word-break: break-word; max-height: 60vh; overflow-y: auto;"></div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  // 辅助函数
  function isProcessing(w) {
    return w.status === 'processing' || (w.taskId && (!w.images || !w.images.length) && (!w.videos || !w.videos.length) && (!w.audios || !w.audios.length) && w.status !== 'failed');
  }

  function apiOrigin() {
    var o = (typeof window !== 'undefined' && window.location && window.location.origin) || '';
    return o.replace(/\/+$/, '') || (window.location.protocol + '//' + (window.location.hostname || 'localhost') + (window.location.port ? ':' + window.location.port : ''));
  }

  // 按任务类型获取查询路径（与 server 端 /api/yunwu 一致）
  function getTaskQueryPath(type) {
    var pathMap = {
      text2img: '/api/yunwu/images/generations/',
      editimg: '/api/yunwu/images/generations/',
      img2video: '/api/yunwu/videos/image2video/',
      lipsync: '/api/yunwu/videos/advanced-lip-sync/',
      text2audio: '/api/yunwu/audio/text-to-audio/',
      tts: '/api/yunwu/audio/tts/',
      dubbing: '/api/yunwu/audio/video-to-audio/'
    };
    return pathMap[type] || '/api/yunwu/images/generations/';
  }

  // 校验 API 返回的资源类型是否与用户选择的类型一致（选错类型则拒绝）
  function resultMatchesType(result, selectedType) {
    // 判断 result_url 的类型（根据URL扩展名或实际资源数组）
    var resultUrlType = null; // 'image', 'video', 'audio', null
    if (result.result_url && typeof result.result_url === 'string') {
      var url = result.result_url.toLowerCase();
      if (/\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(url)) resultUrlType = 'image';
      else if (/\.(mp4|webm|mov|avi)(\?|#|$)/i.test(url)) resultUrlType = 'video';
      else if (/\.(mp3|wav|m4a|aac)(\?|#|$)/i.test(url)) resultUrlType = 'audio';
      // 如果没有扩展名，根据实际资源数组推断
      else if (result.images && result.images.length) resultUrlType = 'image';
      else if (result.videos && result.videos.length) resultUrlType = 'video';
      else if (result.audios && result.audios.length) resultUrlType = 'audio';
    }
    
    var hasImages = (result.images && result.images.length) || result.image_url || (resultUrlType === 'image' && result.result_url);
    var hasVideos = (result.videos && result.videos.length) || result.video_url || result.video || (resultUrlType === 'video' && result.result_url);
    var hasAudios = (result.audios && result.audios.length) || result.audio_url || (resultUrlType === 'audio' && result.result_url);
    
    if (!hasImages && !hasVideos && !hasAudios) return true; // 处理中/无资源时暂不校验
    var expectImage = selectedType === 'text2img' || selectedType === 'editimg';
    var expectVideo = selectedType === 'img2video' || selectedType === 'lipsync';
    var expectAudio = selectedType === 'text2audio' || selectedType === 'tts' || selectedType === 'dubbing';
    if (expectImage && hasImages && !hasVideos && !hasAudios) return true;
    if (expectVideo && hasVideos && !hasImages && !hasAudios) return true;
    if (expectAudio && hasAudios && !hasImages && !hasVideos) return true;
    if (expectImage && (hasVideos || hasAudios)) return false;
    if (expectVideo && (hasImages || hasAudios)) return false;
    if (expectAudio && (hasImages || hasVideos)) return false;
    return true;
  }

  function normalizeTaskStatus(s) {
    var t = (s || '').toString().toLowerCase();
    if (['succeed', 'succeeded', 'success', 'completed', 'done', 'finish', 'finished'].indexOf(t) >= 0) return 'completed';
    if (['fail', 'failed', 'error'].indexOf(t) >= 0) return 'failed';
    return 'processing';
  }

  function collectUrls(obj, images, videos, audios) {
    if (!obj || typeof obj !== 'object') return;
    if (typeof obj === 'string' && /^https?:\/\//i.test(obj)) {
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(obj)) images.push(obj);
      else if (/\.(mp4|webm|mov|avi)$/i.test(obj)) videos.push(obj);
      else if (/\.(mp3|wav|m4a|aac)$/i.test(obj)) audios.push(obj);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(function (item) { collectUrls(item, images, videos, audios); });
      return;
    }
    Object.keys(obj).forEach(function (k) {
      collectUrls(obj[k], images, videos, audios);
    });
  }

  // 根据任务ID + 类型请求对应 API，解析为统一结构（必须请求同源，由本机 server 代理到云雾）
  function queryTaskStatus(taskId, type) {
    return new Promise(function (resolve, reject) {
      try {
        var base = apiOrigin();
        var apiKey = window.MediaStudio.getYunwuApiKey();
        if (!apiKey || !String(apiKey).trim()) {
          reject(new Error('请先在设置中配置API密钥'));
          return;
        }
        var path = getTaskQueryPath(type);
        var url = base.replace(/\/+$/, '') + path + encodeURIComponent(taskId);
        fetch(url, {
          method: 'GET',
          headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
        })
          .then(function (response) {
            if (!response.ok) throw new Error('请求失败: ' + response.status + ' ' + response.statusText);
            return response.json();
          })
          .then(function (data) {
            if (data && data.success === false && data.message) {
              reject(new Error(data.message));
              return;
            }
            var inner = (data && data.data && data.data.data) || data.data || data;
            var statusRaw = (inner && inner.task_status) ||
              (inner && inner.status) ||
              (inner && inner.state) ||
              (data && data.data && data.data.task_status) ||
              (data && data.data && data.data.status) ||
              (data && data.data && data.data.state) ||
              (data && data.task_status) ||
              (data && data.status) ||
              (data && data.data && data.data.task_result && data.data.task_result.task_status) ||
              '';
            var status = normalizeTaskStatus(statusRaw);
            var result = (inner && inner.task_result) ||
              (data && data.data && data.data.task_result) ||
              (data && data.data && data.data.result) ||
              (data && data.data && data.data) ||
              (data && data.result) ||
              (data && data.data) ||
              {};
            // 如果 result 为空对象，尝试从 data.data 直接获取（某些API格式）
            if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
              if (data && data.data && typeof data.data === 'object') {
                result = data.data;
              }
            }
            var images = [];
            var videos = [];
            var audios = [];
            if (result.images && Array.isArray(result.images)) {
              result.images.forEach(function (x) {
                if (typeof x === 'string') images.push(x); else if (x && x.url) images.push(x.url);
              });
            }
            if (!images.length && result.image) images.push(typeof result.image === 'string' ? result.image : (result.image && result.image.url));
            if (result.video || result.videoUrl || result.video_url) {
              var v = result.video || result.videoUrl || result.video_url;
              if (typeof v === 'string') videos.push(v); else if (v && v.url) videos.push(v.url);
            }
            if (result.videos && Array.isArray(result.videos)) {
              result.videos.forEach(function (v) {
                if (typeof v === 'string') videos.push(v); else if (v && v.url) videos.push(v.url);
              });
            }
            if (result.audios && Array.isArray(result.audios)) {
              result.audios.forEach(function (a) {
                if (a && typeof a.url_mp3 === 'string' && a.url_mp3.trim()) audios.push(a.url_mp3.trim());
                if (a && typeof a.url_wav === 'string' && a.url_wav.trim()) audios.push(a.url_wav.trim());
                if (a && typeof a.url === 'string' && a.url.trim()) audios.push(a.url.trim());
              });
            }
            if (!audios.length && (result.audio || result.audioUrl || result.audio_url)) {
              var a = result.audio || result.audioUrl || result.audio_url;
              if (typeof a === 'string') audios.push(a); else if (a && a.url) audios.push(a.url);
            }
            if (result.url) {
              var u = typeof result.url === 'string' ? result.url : (result.url && result.url.url);
              if (u) {
                if (/\.(mp4|webm|mov|avi)(\?|#|$)/i.test(u)) videos.push(u);
                else if (/\.(mp3|wav|m4a|aac)(\?|#|$)/i.test(u)) audios.push(u);
                else images.push(u);
              }
            }
            // 处理 result_url（图片生成API可能返回此字段）
            if (result.result_url && typeof result.result_url === 'string') {
              var u = result.result_url;
              if (/\.(mp4|webm|mov|avi)(\?|#|$)/i.test(u)) videos.push(u);
              else if (/\.(mp3|wav|m4a|aac)(\?|#|$)/i.test(u)) audios.push(u);
              else images.push(u); // 默认当作图片（图片生成API的主要输出）
            }
            // 也检查 data.data.result_url（某些API可能在此层级）
            if (!images.length && !videos.length && !audios.length && data && data.data) {
              var d = (data.data && data.data.data) || data.data;
              if (d && d.result_url && typeof d.result_url === 'string') {
                var u = d.result_url;
                if (/\.(mp4|webm|mov|avi)(\?|#|$)/i.test(u)) videos.push(u);
                else if (/\.(mp3|wav|m4a|aac)(\?|#|$)/i.test(u)) audios.push(u);
                else images.push(u);
              }
            }
            if (!audios.length && data && data.data) {
              var d = (data.data && data.data.data) || data.data;
              if (d && d.audio_url && typeof d.audio_url === 'string') audios.push(d.audio_url);
              if (d && d.url && typeof d.url === 'string' && /\.(mp3|wav|m4a|aac)(\?|#|$)/i.test(d.url)) audios.push(d.url);
              if (d && d.audio && typeof d.audio === 'string') audios.push(d.audio);
            }
            if (!images.length && !videos.length && !audios.length) collectUrls(data, images, videos, audios);
            images = [...new Set(images.filter(Boolean))];
            videos = [...new Set(videos.filter(Boolean))];
            audios = [...new Set(audios.filter(Boolean))];
            // 优先使用 result.result_url，如果没有则从解析的资源中选择
            var resultUrl = (result && result.result_url) || (videos[0] || audios[0] || images[0]) || '';
            var videoId = (inner && inner.video_id) ||
              (result && result.video_id) ||
              (data && data.data && data.data.video_id) ||
              (data && data.data && data.data.task_result && data.data.task_result.video_id) ||
              (data && data.data && data.data.data && data.data.data.video_id) ||
              (result && result.videos && result.videos[0] && result.videos[0].id) ||
              '';
            var audioId = (inner && inner.audio_id) ||
              (result && result.audio_id) ||
              (data && data.data && data.data.audio_id) ||
              (data && data.data && data.data.task_result && data.data.task_result.audio_id) ||
              (result && result.audios && result.audios[0] && result.audios[0].id) ||
              '';
            if (typeof videoId !== 'string') videoId = videoId ? String(videoId) : '';
            if (typeof audioId !== 'string') audioId = audioId ? String(audioId) : '';
            resolve({
              status: status,
              progress: status === 'completed' ? 100 : (status === 'failed' ? 0 : 50),
              progressStatus: statusRaw || (status === 'completed' ? '已完成' : status === 'failed' ? '失败' : '处理中'),
              result_url: resultUrl,
              image_url: images[0] || '',
              video_url: videos[0] || '',
              audio_url: audios[0] || '',
              images: images,
              videos: videos,
              audios: audios,
              video_id: videoId,
              audio_id: audioId
            });
          })
          .catch(reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  // 刷新单个作品状态
  window.refreshWorkStatusGrid = function(workId) {
    var works = (window.MediaStudio && window.MediaStudio.getWorks()) || [];
    var work = works.find(function(w) { return w.id === workId; });
    
    if (!work) {
      alert('找不到该作品');
      return;
    }
    
    if (!work.taskId) {
      alert('该作品没有任务ID');
      return;
    }
    
    // 显示加载状态
    var btn = document.querySelector('[onclick="window.refreshWorkStatusGrid(\'' + workId + '\')"]');
    if (btn) {
      btn.innerHTML = '⏳';
      btn.disabled = true;
    }
    
    queryTaskStatus(work.taskId, work.type)
      .then(function(result) {
        var hasResources = (result.audios && result.audios.length) || result.audio_url || (result.images && result.images.length) || result.image_url || (result.videos && result.videos.length) || result.video_url || result.result_url;
        var completed = result.status === 'completed' || result.status === 'ready';
        var status = result.status;
        if (completed && hasResources) status = 'ready';
        else if (completed) status = 'completed';
        var updates = {
          status: status,
          progress: result.progress != null ? result.progress : (completed ? 100 : 50),
          progressStatus: result.status === 'completed' || result.status === 'ready' ? '已完成' : (result.status === 'failed' ? '失败' : (result.progressStatus || result.status_text || result.message || '处理中'))
        };
        if (result.result_url) updates.resultUrl = result.result_url;
        if (result.image_url) updates.images = [result.image_url];
        if (result.video_url) updates.videos = [result.video_url];
        if (result.audio_url) updates.audios = [result.audio_url];
        if (result.images && result.images.length) updates.images = result.images;
        if (result.videos && result.videos.length) updates.videos = result.videos;
        if (result.audios && result.audios.length) updates.audios = result.audios;
        if (result.video_id) updates.videoId = result.video_id;
        if (result.audio_id) updates.audioId = result.audio_id;
        window.MediaStudio.updateWork(workId, updates);
        
        // 重新渲染列表
        renderList('');
        
        // 显示成功消息
        if (result.status === 'completed' || !result.status) {
          alert('✅ 任务已完成！');
        } else if (result.status === 'failed') {
          alert('❌ 任务失败: ' + (result.error_message || result.error || '未知错误'));
        } else {
          alert('🔄 状态已更新: ' + (result.status_text || result.status || '处理中'));
        }
      })
      .catch(function(error) {
        console.error('刷新状态失败:', error);
        
        // 提供手动更新选项
        if (confirm('API查询失败: ' + error.message + '\n\n是否手动标记为已完成？')) {
          var updates = {
            status: 'completed',
            progress: 100,
            progressStatus: '手动标记完成'
          };
          window.MediaStudio.updateWork(workId, updates);
          renderList('');
          alert('已手动标记为完成');
        }
      })
      .finally(function() {
        if (btn) {
          btn.innerHTML = '🔄';
          btn.disabled = false;
        }
      });
  };

  // 自动轮询处理中的任务
  function startPollingWork(workId) {
    if (workPollingIntervals[workId]) {
      clearInterval(workPollingIntervals[workId]);
    }
    
    workPollingIntervals[workId] = setInterval(function() {
      var works = (window.MediaStudio && window.MediaStudio.getWorks()) || [];
      var work = works.find(function(w) { return w.id === workId; });
      
      if (!work || !work.taskId || work.status === 'completed' || work.status === 'failed') {
        clearInterval(workPollingIntervals[workId]);
        delete workPollingIntervals[workId];
        return;
      }
      
      queryTaskStatus(work.taskId, work.type)
        .then(function(result) {
          var updates = {
            status: result.status || 'completed',
            progress: result.progress || 100,
            progressStatus: result.status_text || result.message || '已完成'
          };
          
          if (result.result_url) {
            updates.resultUrl = result.result_url;
          }
          if (result.image_url) {
            updates.images = [result.image_url];
          }
          if (result.video_url) {
            updates.videos = [result.video_url];
          }
          if (result.audio_url) {
            updates.audios = [result.audio_url];
          }
          
          if (result.images && result.images.length) {
            updates.images = result.images;
          }
          if (result.videos && result.videos.length) {
            updates.videos = result.videos;
          }
          if (result.audios && result.audios.length) {
            updates.audios = result.audios;
          }
          
          window.MediaStudio.updateWork(workId, updates);
          
          // 如果任务完成或失败，停止轮询
          if (result.status === 'completed' || result.status === 'failed' || !result.status) {
            clearInterval(workPollingIntervals[workId]);
            delete workPollingIntervals[workId];
          }
          
          // 更新UI
          if (window.MediaStudio.currentId === id) {
            renderList('');
          }
        })
        .catch(function(error) {
          console.error('轮询失败:', error);
          // 发生错误时停止轮询
          clearInterval(workPollingIntervals[workId]);
          delete workPollingIntervals[workId];
        });
    }, 10000); // 每10秒轮询一次
  }

  // 渲染网格布局
  function renderList(filterType) {
    var listEl = document.getElementById('worksList');
    var emptyEl = document.getElementById('worksEmpty');
    if (!listEl) return;
    
    var works = (window.MediaStudio && window.MediaStudio.getWorks()) || [];
    var filtered = !filterType ? works : works.filter(function (w) { return w.type === filterType; });
    
    // 不再自动轮询，避免未操作时请求云雾 API；用户需点击「刷新状态」主动查询
    // works.forEach(function(work) {
    //   if (isProcessing(work) && work.taskId && !workPollingIntervals[work.id]) {
    //     startPollingWork(work.id);
    //   }
    // });
    
    if (filtered.length === 0) {
      listEl.style.display = 'none';
      if (emptyEl) { 
        emptyEl.style.display = 'block';
        emptyEl.innerHTML = works.length ? 
          '<div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>' +
          '<div style="font-size: 1.1rem; margin-bottom: 10px;">该类型暂无作品</div>' +
          '<div style="font-size: 0.9rem;">请尝试其他筛选条件</div>' :
          '<div style="font-size: 3rem; margin-bottom: 20px;">📁</div>' +
          '<div style="font-size: 1.1rem; margin-bottom: 10px;">暂无作品</div>' +
          '<div style="font-size: 0.9rem;">请在图片生成、图生视频等功能中生成作品</div>';
      }
      return;
    }
    
    if (emptyEl) emptyEl.style.display = 'none';
    listEl.style.display = 'grid';
    
    function formatLocalDate(isoStr) {
      if (!isoStr) return '';
      var d = new Date(isoStr);
      if (isNaN(d.getTime())) return (isoStr || '').slice(0, 19).replace('T', ' ');
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
    listEl.innerHTML = filtered.map(function (w) {
      var typeName = TYPE_NAMES[w.type] || w.type || '作品';
      var date = formatLocalDate(w.createdAt);
      var processing = isProcessing(w);
      
      // 缩略图：优先用已获取资源 URL；按来源或扩展名判断类型（无扩展名时按 w.images/videos/audios）
      var thumbHtml = '';
      var mainUrl = w.resultUrl || (w.images && w.images[0]) || (w.videos && w.videos[0]) || (w.audios && w.audios[0]);
      var fromImages = mainUrl && w.images && w.images.length && (w.images[0] === mainUrl || w.images.indexOf(mainUrl) >= 0);
      var fromVideos = mainUrl && w.videos && w.videos.length && (w.videos[0] === mainUrl || w.videos.indexOf(mainUrl) >= 0);
      var fromAudios = mainUrl && w.audios && w.audios.length && (w.audios[0] === mainUrl || w.audios.indexOf(mainUrl) >= 0);
      var isImageUrl = mainUrl && (/\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(mainUrl) || fromImages || (mainUrl === w.resultUrl && w.images && w.images.length));
      var isVideoUrl = mainUrl && (/\.(mp4|webm|mov|avi)(\?|#|$)/i.test(mainUrl) || fromVideos || (mainUrl === w.resultUrl && w.videos && w.videos.length));
      var isAudioUrl = mainUrl && (/\.(mp3|wav|m4a|aac)(\?|#|$)/i.test(mainUrl) || fromAudios || (mainUrl === w.resultUrl && w.audios && w.audios.length));
      // 无扩展名且未匹配来源时，按任务类型推断：图片生成/多图参考生图用图，图生视频/对口型用视频，配音用音频
      if (mainUrl && !isImageUrl && !isVideoUrl && !isAudioUrl) {
        if (w.type === 'text2img' || w.type === 'editimg') isImageUrl = true;
        else if (w.type === 'img2video' || w.type === 'lipsync') isVideoUrl = true;
        else if (w.type === 'dubbing' || w.type === 'text2audio') isAudioUrl = true;
        else isImageUrl = true; // 默认尝试按图片加载
      }
      var hasPreview = mainUrl && (isImageUrl || isVideoUrl || isAudioUrl);
      var safeUrl = mainUrl ? String(mainUrl).replace(/"/g, '&quot;').replace(/</g, '&lt;') : '';
      if (mainUrl) {
        if (isImageUrl) {
          thumbHtml = '<img src="' + safeUrl + '" class="work-thumb-grid" alt="' + typeName + '" referrerpolicy="no-referrer" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML=\'<div class=\\"work-thumb-placeholder-grid\\">🖼️</div>\'">';
        } else if (isVideoUrl) {
          thumbHtml = '<video src="' + safeUrl + '" class="work-thumb-grid" preload="metadata" muted playsinline referrerpolicy="no-referrer" onerror="this.onerror=null;this.parentElement.innerHTML=\'<div class=\\"work-thumb-placeholder-grid\\">🎬</div>\'"></video>';
        } else if (isAudioUrl) {
          thumbHtml = '<div class="work-thumb-placeholder-grid">🎵</div>';
        }
      }
      if (!thumbHtml) {
        thumbHtml = '<div class="work-thumb-placeholder-grid">' +
          (processing ? '⏳' : typeName.charAt(0)) + '</div>';
      }
      if (hasPreview) {
        thumbHtml = '<div class="work-card-preview-inner" data-work-id="' + w.id + '" title="点击预览资源">' + thumbHtml + '</div>';
      }
      
      // 状态徽章
      var statusHtml = '';
      if (processing) {
        var n = (w.progress || 0);
        var st = (w.progressStatus || '处理中');
        statusHtml = '<span class="work-status-grid status-processing" title="' + st + '">处理中 (' + n + '%)</span>';
      } else if (w.status === 'failed') {
        statusHtml = '<span class="work-status-grid status-failed">失败</span>';
      } else if (w.status === 'completed' || w.status === 'ready' || !w.status) {
        statusHtml = '<span class="work-status-grid status-success">已完成</span>';
      }
      
      // 标题：若为「任务ID: xxx」则用类型+作品，避免与下方任务ID重复
      var rawTitle = (w.title || w.prompt || '').toString().trim();
      if (!rawTitle || /^任务ID\s*[:：]/.test(rawTitle)) {
        rawTitle = typeName + ' 作品';
      }
      var title = (rawTitle || typeName + ' ' + date || '未命名').slice(0, 100);
      
      // 任务ID / 视频ID / 音频ID（可点击复制）
      var taskIdHtml = '';
      if (w.taskId) {
        taskIdHtml = '<div class="work-taskid-grid">任务ID: <span title="点击复制" data-id="' + (w.taskId || '').replace(/"/g, '&quot;') + '">' + (w.taskId || '').replace(/</g, '&lt;') + '</span></div>';
      }
      if (w.videoId) {
        taskIdHtml += '<div class="work-taskid-grid">视频ID: <span title="点击复制，可用于对口型人脸识别" data-id="' + (w.videoId || '').replace(/"/g, '&quot;') + '">' + (w.videoId || '').replace(/</g, '&lt;') + '</span></div>';
      }
      if (w.audioId) {
        taskIdHtml += '<div class="work-taskid-grid">音频ID: <span title="点击复制" data-id="' + (w.audioId || '').replace(/"/g, '&quot;') + '">' + (w.audioId || '').replace(/</g, '&lt;') + '</span></div>';
      }
      
      // 主要下载链接
      var downloadUrl = w.resultUrl || (w.videos && w.videos[0]) || 
                       (w.audios && w.audios[0]) || (w.images && w.images[0]) || '';
      
      /* 一个作品一个区域：预览 + 信息 + 按钮 集成在 .work-card-body 内 */
      return '<div class="work-card-grid" data-id="' + w.id + '">' +
        '<div class="work-card-body">' +
        '<div class="work-card-preview">' + thumbHtml + '</div>' +
        '<div class="work-card-info">' +
        '<div class="work-type-status-row">' +
        '<span class="work-type-grid">' + typeName + '</span>' +
        (statusHtml ? '<span class="work-status-wrap">' + statusHtml + '</span>' : '') +
        '</div>' +
        '<div class="work-title-grid js-show-full-desc" title="点击查看完整介绍" data-full-desc="' + (rawTitle || title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '">' + title + '</div>' +
        taskIdHtml +
        '<div class="work-date-grid">' + date + '</div>' +
        '</div>' +
        '<div class="work-card-actions">' +
        (hasPreview ? '<button type="button" class="work-btn-grid secondary" onclick="window.openPreviewModal(\'' + w.id + '\')" title="预览资源">👁</button>' : '') +
        '<button type="button" class="work-btn-grid" ' +
        (downloadUrl ? 'onclick="window.downloadWorkGrid(\'' + w.id + '\', \'' + downloadUrl.replace(/'/g, "\\'") + '\', this)"' : 'disabled') +
        ' title="下载">⬇</button>' +
        '<button type="button" class="work-btn-grid secondary" onclick="window.refreshWorkStatusGrid(\'' + w.id + '\')" title="刷新状态">🔄</button>' +
        '<button type="button" class="work-btn-grid secondary" onclick="window.deleteWorkGrid(\'' + w.id + '\')" title="删除">🗑</button>' +
        '</div>' +
        '</div></div>';
    }).join('');
    
    // 复制任务ID / 视频ID / 音频ID
    listEl.querySelectorAll('.work-taskid-grid span[data-id]').forEach(function (el) {
      el.addEventListener('click', function () {
        var idValue = el.getAttribute('data-id');
        if (!idValue) return;
        navigator.clipboard.writeText(idValue).then(function() {
          var original = el.textContent;
          el.textContent = '已复制!';
          el.style.color = 'var(--success)';
          setTimeout(function() {
            el.textContent = original;
            el.style.color = '';
          }, 1500);
        });
      });
    });
    // 缩略图点击预览
    listEl.querySelectorAll('.work-card-preview-inner').forEach(function (el) {
      el.addEventListener('click', function () {
        var workId = el.getAttribute('data-work-id');
        if (workId) window.openPreviewModal(workId);
      });
    });
    // 标题点击查看完整介绍
    listEl.querySelectorAll('.work-title-grid.js-show-full-desc').forEach(function (el) {
      el.addEventListener('click', function () {
        var full = el.getAttribute('data-full-desc') || '';
        var body = document.getElementById('workTitleModalBody');
        var overlay = document.getElementById('workTitleModal');
        if (body) body.textContent = full || '（无介绍）';
        if (overlay) overlay.classList.add('active');
      });
    });
  }

  // 预览弹窗：仅在有资源时由用户点击触发，不请求 API
  window.openPreviewModal = function (workId) {
    var works = (window.MediaStudio && window.MediaStudio.getWorks()) || [];
    var w = works.find(function (x) { return x.id === workId; });
    if (!w) return;
    var mainUrl = w.resultUrl || (w.images && w.images[0]) || (w.videos && w.videos[0]) || (w.audios && w.audios[0]);
    if (!mainUrl) return;
    var inner = document.getElementById('workPreviewInner');
    var overlay = document.getElementById('workPreviewOverlay');
    if (!inner || !overlay) return;
    inner.innerHTML = '';
    var isImg = /\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(mainUrl);
    var isVid = /\.(mp4|webm|mov|avi)(\?|#|$)/i.test(mainUrl);
    var isAud = /\.(mp3|wav|m4a|aac)(\?|#|$)/i.test(mainUrl);
    if (isImg) {
      inner.innerHTML = '<img src="' + mainUrl + '" alt="预览">';
    } else if (isVid) {
      inner.innerHTML = '<video src="' + mainUrl + '" controls playsinline></video>';
    } else if (isAud) {
      inner.innerHTML = '<div class="work-preview-audio"><audio src="' + mainUrl + '" controls></audio></div>';
    } else {
      inner.innerHTML = '<a href="' + mainUrl + '" target="_blank" rel="noopener">打开链接</a>';
    }
    overlay.classList.add('active');
  };

  window.closePreviewModal = function () {
    var overlay = document.getElementById('workPreviewOverlay');
    var inner = document.getElementById('workPreviewInner');
    if (overlay) overlay.classList.remove('active');
    if (inner) {
      var v = inner.querySelector('video');
      if (v) v.pause();
    }
  };
  
  // 下载函数
  window.downloadWorkGrid = function(workId, url, btnEl) {
    if (!url) {
      alert('暂无可下载资源');
      return;
    }

    var list = (window.MediaStudio && window.MediaStudio.getWorks && window.MediaStudio.getWorks()) || [];
    var w = list.find(function (it) { return it && it.id === workId; }) || null;
    var typeName = (w && (TYPE_NAMES[w.type] || w.type)) || 'work';
    var baseTitle = (w && (w.title || w.prompt)) ? String(w.title || w.prompt) : typeName;
    var safeTitle = downloadManager.sanitizeFileName(baseTitle);

    var extMatch = String(url).match(/\.([a-z0-9]{2,5})(?:\?|#|$)/i);
    var fileName = safeTitle + (extMatch ? ('.' + extMatch[1].toLowerCase()) : '');
    if (!fileName || fileName === '.file') fileName = downloadManager.getFileNameFromUrl(url);

    const originalText = (btnEl && btnEl.textContent) || '下载';
    if (btnEl) {
      btnEl.innerHTML = '⏳ 下载中...';
      btnEl.disabled = true;
    }
    
    downloadManager.downloadFile(url, fileName)
      .then(() => {
        alert('下载完成: ' + fileName);
      })
      .catch(err => {
        console.error('下载失败:', err);
        alert('下载失败，尝试直接打开...');
        window.open(url, '_blank');
      })
      .finally(() => {
        if (btnEl) {
          btnEl.innerHTML = originalText;
          btnEl.disabled = false;
        }
      });
  };
  
  // 删除函数
  window.deleteWorkGrid = function(workId) {
    if (!confirm('确定要删除这个作品吗？此操作不可撤销。')) return;
    
    var list = (window.MediaStudio && window.MediaStudio.getWorks()) || [];
    var next = list.filter(function (w) { return w.id !== workId; });
    if (workPollingIntervals[workId]) {
      clearTimeout(workPollingIntervals[workId]);
      delete workPollingIntervals[workId];
    }
    try { 
      localStorage.setItem('media_studio_works', JSON.stringify(next));
      if (window.MediaStudio && window.MediaStudio.syncWorksToServer) window.MediaStudio.syncWorksToServer();
      renderList('');
    } catch (e) {}
  };
  
  // 搜索弹窗相关函数
  function openSearchModal() {
    var modal = document.getElementById('searchModal');
    if (modal) {
      modal.classList.add('active');
      var input = document.getElementById('search-taskid-input');
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  }
  
  function closeSearchModal() {
    var modal = document.getElementById('searchModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }
  
  function searchByTaskId() {
    var taskId = document.getElementById('search-taskid-input').value.trim();
    var taskType = document.getElementById('search-task-type').value;
    
    if (!taskId) {
      alert('请输入任务ID');
      return;
    }
    
    closeSearchModal();
    
    // 先尝试从本地存储中查找
    var works = (window.MediaStudio && window.MediaStudio.getWorks()) || [];
    var found = works.filter(function(w) {
      return w.taskId === taskId && (!taskType || w.type === taskType);
    });
    
    if (found.length > 0) {
      // 显示搜索结果
      var listEl = document.getElementById('worksList');
      var emptyEl = document.getElementById('worksEmpty');
      
      if (listEl && emptyEl) {
        listEl.style.display = 'none';
        emptyEl.style.display = 'block';
        emptyEl.innerHTML = 
          '<div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>' +
          '<div style="font-size: 1.1rem; margin-bottom: 10px;">找到 ' + found.length + ' 个匹配的作品</div>' +
          '<div style="font-size: 0.9rem;">任务ID: ' + taskId + '</div>' +
          '<div style="margin-top: 20px;">' +
          '<button class="btn-primary" style="margin-top: 10px;" onclick="window.clearSearchFilter()">显示全部作品</button>' +
          '</div>';
      }
    } else {
      // 如果本地没有，尝试从API查询
      var base = window.MediaStudio.getYunwuApiBase() || apiOrigin();
      var apiKey = window.MediaStudio.getYunwuApiKey();
      
      if (!base || !apiKey) {
        alert('请先在设置中配置API地址和密钥');
        return;
      }
      
      alert('正在从服务器查询任务状态...');
      
      queryTaskStatus(taskId, taskType)
        .then(function(result) {
          if (!resultMatchesType(result, taskType)) {
            alert('该任务ID对应的资源类型与所选类型不符，请选择正确的作品类型后再搜索。');
            return;
          }
          // 创建新的作品记录
          var newWork = {
            type: taskType,
            taskId: taskId,
            status: (result.status === 'completed' || result.status === 'ready') && (result.result_url || (result.audios && result.audios.length) || (result.videos && result.videos.length) || (result.images && result.images.length)) ? 'ready' : (result.status || 'completed'),
            progress: result.progress != null ? result.progress : 100,
            progressStatus: result.status === 'completed' || result.status === 'ready' ? '已完成' : (result.progressStatus || result.status_text || result.message || '通过任务ID搜索'),
            title: '通过任务ID搜索的作品',
            prompt: '任务ID: ' + taskId,
            createdAt: new Date().toISOString(),
            resultUrl: result.result_url || '',
            images: result.images || [],
            videos: result.videos || [],
            audios: result.audios || [],
            videoId: result.video_id || '',
            audioId: result.audio_id || ''
          };
          
          // 处理不同的API响应格式
          if (result.image_url) {
            newWork.images = [result.image_url];
          }
          if (result.video_url) {
            newWork.videos = [result.video_url];
          }
          if (result.audio_url) {
            newWork.audios = [result.audio_url];
          }
          
          var workId = window.MediaStudio.addWork(newWork);
          
          // 如果任务还在处理中，启动轮询
          if (result.status === 'processing') {
            startPollingWork(workId);
          }
          
          // 重新渲染列表
          renderList('');
          
          alert('✅ 已获取任务信息并添加到作品列表');
        })
        .catch(function(error) {
          alert('查询失败: ' + error.message + '\n\n请检查：\n1. API地址是否正确\n2. API密钥是否正确\n3. 任务ID是否存在');
        });
    }
  }
  
  window.clearSearchFilter = function() {
    var filterSelect = document.getElementById('works-filter-type');
    if (filterSelect) filterSelect.value = '';
    renderList('');
  };
  
  function init(container) {
    if (!container) return;
    
    // 搜索按钮点击事件
    var searchBtn = document.getElementById('works-search-by-taskid');
    if (searchBtn) {
      searchBtn.addEventListener('click', openSearchModal);
    }
    
    // 搜索弹窗相关事件
    var closeBtn = document.getElementById('closeSearchModal');
    var cancelBtn = document.getElementById('cancelSearch');
    var searchBtnModal = document.getElementById('searchTaskById');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSearchModal);
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeSearchModal);
    }
    
    if (searchBtnModal) {
      searchBtnModal.addEventListener('click', searchByTaskId);
    }
    
    // 点击弹窗外部关闭
    var modal = document.getElementById('searchModal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeSearchModal();
        }
      });
    }
    
    // 预览弹窗关闭
    var previewClose = document.getElementById('workPreviewClose');
    var previewOverlay = document.getElementById('workPreviewOverlay');
    if (previewClose) previewClose.addEventListener('click', window.closePreviewModal);
    if (previewOverlay) {
      previewOverlay.addEventListener('click', function(e) {
        if (e.target === previewOverlay) window.closePreviewModal();
      });
    }
    
    // 完整介绍弹窗关闭
    function closeWorkTitleModal() {
      var overlay = document.getElementById('workTitleModal');
      if (overlay) overlay.classList.remove('active');
    }
    var titleModalClose = document.getElementById('closeWorkTitleModal');
    var titleModalOverlay = document.getElementById('workTitleModal');
    if (titleModalClose) titleModalClose.addEventListener('click', closeWorkTitleModal);
    if (titleModalOverlay) {
      titleModalOverlay.addEventListener('click', function(e) {
        if (e.target === titleModalOverlay) closeWorkTitleModal();
      });
    }
    
    var filterSelect = document.getElementById('works-filter-type');
    if (filterSelect) {
      filterSelect.addEventListener('change', function () {
        var v = (filterSelect.value || '').trim();
        renderList(v);
      });
    }
    // 初始渲染（不自动轮询 API，用户点击「刷新状态」或「通过任务ID搜索」才会请求）
    renderList('');
    // 供其他功能在轮询时调用：若当前在作品管理则刷新列表，使「处理中」进度实时显示
    if (window.MediaStudio) {
      window.MediaStudio.refreshWorksList = function () {
        if (window.MediaStudio.currentId === 'works') renderList('');
      };
    }
  }
  
  // 注册到主应用
  if (window.MediaStudio && window.MediaStudio.register) {
    window.MediaStudio.register(id, { 
      name: name, 
      icon: icon, 
      getPanel: getPanel, 
      init: init 
    });
  }
  
  // 导出必要函数
  window.refreshWorkStatus = window.refreshWorkStatusGrid;
  window.deleteWork = window.deleteWorkGrid;
  window.downloadWork = window.downloadWorkGrid;
})();