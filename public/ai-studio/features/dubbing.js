/**
 * AI创作工坊 - 配音（独立文件）
 * 对接云雾可灵：文生音效 + 视频生音效
 */
(function () {
  var id = 'dubbing';
  var name = '配音';
  var icon = '🔊';
  var TEXT2AUDIO_PATH = '/api/yunwu/audio/text-to-audio/';
  var TTS_PATH = '/api/yunwu/audio/tts/';
  var VIDEO2AUDIO_PATH = '/api/yunwu/audio/video-to-audio/';

  function getPanel() {
    return [
      '<h2 class="panel-title">配音 · 可灵 Kling 文生音效 / 语音合成 / 视频生音效</h2>',
      '<div class="form-row">',
      '  <label>模式 <span class="required">*</span></label>',
      '  <select id="dub-mode">',
      '    <option value="text2audio">文生音效（文本生成音频）</option>',
      '    <option value="video2audio">视频生音效（视频提取/生成音效）</option>',
      '  </select>',
      '</div>',
      '<div id="dub-text2audio-fields">',
      '  <div class="form-row">',
      '    <label>类型 <span class="required">*</span></label>',
      '    <select id="dub-text2audio-type">',
      '      <option value="sound_effect">音效（环境声、自然声等）</option>',
      '      <option value="tts">语音合成（演讲/朗读，支持多语种）</option>',
      '    </select>',
      '    <p class="hint" id="dub-prompt-hint">音效：描述要生成的音效；语音合成：输入要朗读的文本（支持多语种）</p>',
      '  </div>',
      '  <div class="form-row" id="dub-tts-only-row">',
      '    <label>文本 text <span class="required">*</span></label>',
      '    <textarea id="dub-prompt" placeholder="输入要朗读的文本，支持中文、英文等多语种" maxlength="2000"></textarea>',
      '  </div>',
      '  <div id="dub-tts-params" style="display:none;">',
      '    <div class="form-row">',
      '      <label>音色 ID voice_id</label>',
      '      <div class="t2i-image-input-wrap" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">',
      '        <select id="dub-voice-id" class="ms-select" style="flex:1;min-width:200px;">',
      '          <option value="genshin_vindi2">加载中…</option>',
      '        </select>',
      '        <button type="button" class="btn-secondary" id="dub-voice-preview-btn" style="margin:0;">试听音色</button>',
      '        <span id="dub-voice-preview-hint" class="hint" style="display:none;"></span>',
      '      </div>',
      '      <p class="hint">系统提供多种音色可供选择，下拉为「音色名称 # 音色ID # 音色语种」。试听使用官方固定样例，不支持自定义文案。</p>',
      '    </div>',
      '    <div class="form-row">',
      '      <label>音色语种 voice_language</label>',
      '      <select id="dub-voice-language" style="width:100%;">',
      '        <option value="zh">zh（中文）</option>',
      '        <option value="en">en（英文）</option>',
      '        <option value="ja">ja（日文）</option>',
      '        <option value="ko">ko（韩文）</option>',
      '      </select>',
      '    </div>',
      '    <div class="form-row">',
      '      <label>语速 voice_speed</label>',
      '      <input type="number" id="dub-voice-speed" min="0.5" max="2" step="0.1" value="1.0" placeholder="1.0" style="width:120px;">',
      '      <p class="hint">建议 0.5～2.0，默认 1.0</p>',
      '    </div>',
      '    <div class="form-row">',
      '      <p class="hint" style="margin-top:8px;">语音合成备注：演讲/朗读支持多语种，不限于汉语。音色试听不支持自定义文案；试听文件命名规范：音色名称#音色ID#音色语种。</p>',
      '    </div>',
      '  </div>',
      '  <div class="form-row" id="dub-duration-row">',
      '    <label>时长 duration（秒）</label>',
      '    <input type="number" id="dub-duration" min="3" max="10" step="0.1" value="5" placeholder="3.0～10.0">',
      '    <p class="hint">3.0～10.0 秒，支持一位小数（仅音效模式）</p>',
      '  </div>',
      '</div>',
      '<div id="dub-video2audio-fields" style="display:none;">',
      '  <div class="form-row">',
      '    <label>视频 <span class="required">*</span></label>',
      '    <div class="t2i-image-input-wrap">',
      '      <input type="text" id="dub-video" placeholder="输入视频 URL 或视频ID">',
      '      <input type="file" id="dub-video-file" accept="video/mp4,video/mov" style="display:none;">',
      '      <button type="button" class="btn-secondary" id="dub-upload-video-btn" style="margin-left:8px;margin-top:0;">上传视频</button>',
      '    </div>',
      '    <p class="hint">视频ID（可灵生成，30天内、3～20秒）或视频 URL（MP4/MOV，≤100MB，3～20秒）</p>',
      '  </div>',
      '  <div class="form-row">',
      '    <label>音效提示词 sound_effect_prompt（可选）</label>',
      '    <input type="text" id="dub-sound-effect-prompt" placeholder="如：符合视频的人声、环境音">',
      '  </div>',
      '  <div class="form-row">',
      '    <label>配乐提示词 bgm_prompt（可选）</label>',
      '    <input type="text" id="dub-bgm-prompt" placeholder="配乐风格描述">',
      '  </div>',
      '  <div class="form-row">',
      '    <label><input type="checkbox" id="dub-asmr-mode"> 开启 ASMR 模式</label>',
      '    <p class="hint">增强细节音效，适合高沉浸场景</p>',
      '  </div>',
      '</div>',
      '<div class="form-row">',
      '  <button type="button" class="btn-primary" id="dub-submit">生成音效</button>',
      '</div>',
      '<div class="result-area" id="dub-result">生成结果将显示在此处，可播放音频</div>'
    ].join('\n');
  }

  function apiOrigin() {
    var o = (typeof window !== 'undefined' && window.location && window.location.origin) || '';
    return o.replace(/\/+$/, '') || (window.location.protocol + '//' + (window.location.hostname || 'localhost') + (window.location.port ? ':' + window.location.port : ''));
  }

  function setResult(html, isContent) {
    var el = document.getElementById('dub-result');
    if (el) { el.innerHTML = html; el.classList.toggle('has-content', !!isContent); }
  }

  function getVal(id, def) {
    var el = document.getElementById(id);
    if (!el) return def;
    var v = el.value != null ? String(el.value).trim() : '';
    return v === '' ? def : v;
  }

  function normalizeTaskStatus(s) {
    var t = (s || '').toString().toLowerCase();
    if (['succeed', 'succeeded', 'success', 'completed', 'done', 'finish', 'finished'].indexOf(t) >= 0) return 'done';
    if (['fail', 'failed', 'error'].indexOf(t) >= 0) return 'failed';
    return 'processing';
  }

  function collectAudioUrls(obj, out) {
    if (!obj || typeof obj !== 'object') return;
    var urlKeys = ['audio', 'url', 'audios', 'audio_url', 'output_audio', 'result_url', 'output_url', 'audioUrl'];
    urlKeys.forEach(function (k) {
      var v = obj[k];
      if (typeof v === 'string' && /^https?:\/\//i.test(v)) out.push(v);
      else if (Array.isArray(v)) v.forEach(function (u) {
        if (typeof u === 'string' && /^https?:\/\//i.test(u)) out.push(u);
        else if (u && u.url) out.push(u.url);
      });
    });
    Object.keys(obj).forEach(function (k) {
      collectAudioUrls(obj[k], out);
    });
  }

  function handleDubResult(result, workId, btn) {
    var audios = (result && result.audios) || [];
    var raw = result && result.raw;
    var audioId = (result && result.audioId) || '';
    if (!audios.length && raw) {
      collectAudioUrls(raw, audios);
      audios = [...new Set(audios.filter(Boolean))];
    }
    if (!audioId && raw) {
      audioId = (raw && raw.data && raw.data.audio_id) ||
        (raw && raw.data && raw.data.task_result && raw.data.task_result.audio_id) ||
        (raw && raw.audio_id) || '';
    }
    var hasResources = audios.length > 0;
    var succeedNoUrl = !!(result && result.succeedNoUrl);
    if (workId && window.MediaStudio && window.MediaStudio.updateWork) {
      var finalStatus = hasResources ? 'ready' : (succeedNoUrl ? 'ready' : 'failed');
      var updates = {
        status: finalStatus,
        audios: audios,
        progress: null,
        progressStatus: succeedNoUrl ? '已完成（链接未返回）' : null
      };
      if (audios.length) updates.resultUrl = audios[0];
      if (audioId) updates.audioId = audioId;
      window.MediaStudio.updateWork(workId, updates);
      if (window.MediaStudio && window.MediaStudio.refreshWorksList) window.MediaStudio.refreshWorksList();
    }
    if (!hasResources) {
      var msg = succeedNoUrl
        ? '<span class="msg-warning">任务已完成，但响应中音频链接（url_mp3/url_wav）为空，请到云雾控制台查看或稍后刷新作品状态。</span>'
        : '<span class="msg-warning">任务完成但未解析到音频链接。</span>';
      if (raw) {
        msg += '<br><details style="margin-top:12px"><summary style="cursor:pointer">点击展开「查询任务」原始响应（便于排查字段）</summary><pre style="max-height:240px;overflow:auto;font-size:11px;white-space:pre-wrap;background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;margin-top:8px">' + JSON.stringify(raw, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre></details>';
      }
      setResult(msg, true);
      if (btn) btn.disabled = false;
      return;
    }
    var html = '<span class="msg-success">✓ 生成完成</span><br>';
    var firstUrl = audios[0];
    if (firstUrl) {
      html += '<div class="t2i-out"><audio src="' + (firstUrl || '').replace(/"/g, '&quot;') + '" controls style="max-width:100%;"></audio><a href="' + (firstUrl || '#').replace(/"/g, '&quot;') + '" target="_blank" rel="noopener">打开音频</a></div>';
    }
    setResult(html, true);
    if (btn) btn.disabled = false;
  }

  function handleDubError(err, workId, btn) {
    setResult('<span class="msg-error">✗ ' + (err && err.message || String(err)).replace(/\n/g, '<br>') + '</span>', true);
    if (workId && window.MediaStudio && window.MediaStudio.updateWork) {
      window.MediaStudio.updateWork(workId, { status: 'failed', error: (err && err.message) || String(err), progress: null, progressStatus: null });
    }
    if (btn) btn.disabled = false;
  }

  function pollTask(taskId, apiKey, workId, setProgress, resolve, reject, pollCount, queryPath) {
    pollCount = pollCount || 0;
    queryPath = queryPath || VIDEO2AUDIO_PATH;
    var maxPolls = 240;
    if (pollCount >= maxPolls) {
      reject(new Error('任务超时（约 10 分钟仍未返回资源），请稍后在「作品管理」中重新查询'));
      return;
    }
    var url = apiOrigin() + queryPath.replace(/\/+$/, '') + '/' + encodeURIComponent(taskId);
    fetch(url, {
      method: 'GET',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    })
      .then(function (r) { return r.json(); })
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
        var audios = [];
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
        if (!audios.length && result.url) {
          var url = typeof result.url === 'string' ? result.url : (result.url && result.url.url);
          if (url && /\.(mp3|wav|m4a|aac)(\?|#|$)/i.test(url)) audios.push(url);
        }
        if (!audios.length && data && data.data) {
          var d = data.data.data || data.data;
          if (d && d.audio_url && typeof d.audio_url === 'string') audios.push(d.audio_url);
          if (d && d.url && typeof d.url === 'string' && /\.(mp3|wav|m4a|aac)(\?|#|$)/i.test(d.url)) audios.push(d.url);
          if (d && d.audio && typeof d.audio === 'string') audios.push(d.audio);
        }
        if (!audios.length) collectAudioUrls(data, audios);
        audios = [...new Set(audios.filter(Boolean))];

        var audioId = (result && result.audio_id) ||
          (result && result.audios && result.audios[0] && result.audios[0].id) ||
          (data && data.data && data.data.audio_id) ||
          (inner && inner.task_result && inner.task_result.audios && inner.task_result.audios[0] && inner.task_result.audios[0].id) ||
          (data && data.data && data.data.task_result && data.data.task_result.audios && data.data.task_result.audios[0] && data.data.task_result.audios[0].id) ||
          (data && data.audio_id) ||
          '';

        if (status === 'done' && audios.length > 0) {
          resolve({ audios: audios, raw: data, audioId: audioId });
          return;
        }
        var hasAudiosArray = result.audios && Array.isArray(result.audios) && result.audios.length > 0;
        if (status === 'done' && !audios.length && hasAudiosArray) {
          resolve({ audios: [], raw: data, audioId: audioId, succeedNoUrl: true });
          return;
        }
        if (status === 'done' && !audios.length) {
          var progressText = '状态已完成，等待音频生成，继续轮询…（' + (pollCount + 1) + '/' + maxPolls + '）';
          if (typeof setProgress === 'function') setProgress(progressText, statusRaw);
          if (workId && window.MediaStudio && window.MediaStudio.updateWork) {
            var pw = (window.MediaStudio.getWorks() || []).find(function (w) { return w.id === workId; });
            var n = ((pw && pw.progress) || 0) + 1;
            window.MediaStudio.updateWork(workId, { progress: n, progressStatus: statusRaw || '等待资源' });
          }
          if (window.MediaStudio && window.MediaStudio.refreshWorksList) window.MediaStudio.refreshWorksList();
          setTimeout(function () { pollTask(taskId, apiKey, workId, setProgress, resolve, reject, pollCount + 1, queryPath); }, 2500);
          return;
        }
        if (status === 'failed') {
          reject(new Error((result.message || result.error || data.message || data.error || '任务失败') + ''));
          return;
        }
        var progressText = '轮询中，状态=' + (statusRaw || '处理中') + (pollCount > 0 ? '（' + (pollCount + 1) + '/' + maxPolls + '）' : '');
        if (typeof setProgress === 'function') setProgress(progressText, statusRaw);
        if (workId && window.MediaStudio && window.MediaStudio.updateWork) {
          var pw = (window.MediaStudio.getWorks() || []).find(function (w) { return w.id === workId; });
          var n = ((pw && pw.progress) || 0) + 1;
          window.MediaStudio.updateWork(workId, { progress: n, progressStatus: statusRaw || '处理中' });
        }
        if (window.MediaStudio && window.MediaStudio.refreshWorksList) window.MediaStudio.refreshWorksList();
        setTimeout(function () { pollTask(taskId, apiKey, workId, setProgress, resolve, reject, pollCount + 1, queryPath); }, 2500);
      })
      .catch(reject);
  }

  function init(container) {
    if (!container) return;
    var btn = document.getElementById('dub-submit');
    if (!btn) return;

    var modeSelect = document.getElementById('dub-mode');
    var text2audioFields = document.getElementById('dub-text2audio-fields');
    var video2audioFields = document.getElementById('dub-video2audio-fields');
    var text2audioTypeSelect = document.getElementById('dub-text2audio-type');
    var durationRow = document.getElementById('dub-duration-row');
    var promptHint = document.getElementById('dub-prompt-hint');
    var promptTextarea = document.getElementById('dub-prompt');
    if (modeSelect && text2audioFields && video2audioFields) {
      function toggleMode() {
        var isText = modeSelect.value === 'text2audio';
        text2audioFields.style.display = isText ? '' : 'none';
        video2audioFields.style.display = isText ? 'none' : '';
        toggleText2AudioType();
      }
      function toggleText2AudioType() {
        var isTts = text2audioTypeSelect && text2audioTypeSelect.value === 'tts';
        var ttsParams = document.getElementById('dub-tts-params');
        if (durationRow) durationRow.style.display = isTts ? 'none' : '';
        if (ttsParams) ttsParams.style.display = isTts ? '' : 'none';
        if (promptHint) promptHint.textContent = isTts ? '输入要朗读的文本，支持多语种（不限于汉语）。' : '音效：描述要生成的音效；语音合成：输入要朗读的文本（支持多语种）';
        if (promptTextarea) promptTextarea.placeholder = isTts ? '输入要朗读的文本，如：大家好，欢迎收听。或 Hello, welcome.' : '音效模式：如雨声、海浪；语音合成：输入要朗读的文本';
        if (isTts) loadTtsVoices();
      }
      function loadTtsVoices() {
        var sel = document.getElementById('dub-voice-id');
        if (!sel) return;
        sel.innerHTML = '<option value="genshin_vindi2">加载中…</option>';
        window._dubTtsVoiceList = [];
        fetch(apiOrigin() + '/api/tts/voices', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var list = (data && data.data && data.data.ttsList) || (data && data.ttsList) || [];
            if (!Array.isArray(list)) list = [];
            var html = '';
            var voiceList = [];
            list.forEach(function (v) {
              var id = (v && (v.voice_id || v.speakerId || v.id || v.voiceId)) || '';
              var name = (v && (v.name || v.voice_name || v.label)) || id || '未知';
              var lang = (v && (v.language || v.voice_language || v.lang)) || '';
              var exampleUrl = (v && (v.exampleUrl || v.example_url || v.preview_url || v.sample_url)) || '';
              if (id) {
                html += '<option value="' + String(id).replace(/"/g, '&quot;') + '">' + String(name + (id ? ' # ' + id : '') + (lang ? ' # ' + lang : '')).replace(/</g, '&lt;') + '</option>';
                voiceList.push({ id: id, name: name, language: lang, exampleUrl: exampleUrl });
              }
            });
            window._dubTtsVoiceList = voiceList;
            if (html) sel.innerHTML = html; else sel.innerHTML = '<option value="genshin_vindi2">阳光少年 # genshin_vindi2 # zh</option>';
          })
          .catch(function () {
            window._dubTtsVoiceList = [{ id: 'genshin_vindi2', name: '阳光少年', language: 'zh', exampleUrl: '' }];
            sel.innerHTML = '<option value="genshin_vindi2">阳光少年 # genshin_vindi2 # zh</option>';
          });
      }
      function previewTtsVoice() {
        var sel = document.getElementById('dub-voice-id');
        var hint = document.getElementById('dub-voice-preview-hint');
        if (!sel) return;
        var voiceId = (sel.value || '').trim();
        var list = window._dubTtsVoiceList || [];
        var voice = list.filter(function (v) { return v.id === voiceId; })[0] || null;
        var url = voice && voice.exampleUrl ? (voice.exampleUrl + '').trim() : '';
        if (hint) { hint.style.display = 'none'; hint.textContent = ''; }
        if (!url) {
          if (hint) { hint.style.display = 'inline'; hint.textContent = '该音色暂无试听（无官方样例链接）'; }
          return;
        }
        if (window._dubPreviewAudio) {
          try { window._dubPreviewAudio.pause(); window._dubPreviewAudio = null; } catch (e) {}
        }
        var audio = new Audio(url);
        window._dubPreviewAudio = audio;
        audio.play().catch(function (e) {
          if (hint) { hint.style.display = 'inline'; hint.textContent = '试听加载失败'; }
        });
        if (hint) { hint.style.display = 'inline'; hint.textContent = '正在试听…'; }
        audio.addEventListener('ended', function () { if (hint) hint.textContent = ''; });
        audio.addEventListener('error', function () { if (hint) hint.textContent = '试听加载失败'; });
      }
      var previewBtn = document.getElementById('dub-voice-preview-btn');
      if (previewBtn) previewBtn.addEventListener('click', previewTtsVoice);
      var voiceSelect = document.getElementById('dub-voice-id');
      var langSelect = document.getElementById('dub-voice-language');
      if (voiceSelect && langSelect) {
        voiceSelect.addEventListener('change', function () {
          var list = window._dubTtsVoiceList || [];
          var v = list.filter(function (x) { return x.id === (voiceSelect.value || '').trim(); })[0];
          if (v && v.language && langSelect.querySelector('option[value="' + v.language + '"]')) langSelect.value = v.language;
        });
      }
      modeSelect.addEventListener('change', toggleMode);
      if (text2audioTypeSelect) text2audioTypeSelect.addEventListener('change', toggleText2AudioType);
      toggleMode();
    }

    var videoInput = document.getElementById('dub-video');
    var videoFileInput = document.getElementById('dub-video-file');
    var uploadVideoBtn = document.getElementById('dub-upload-video-btn');
    var currentVideoUrl = '';
    var currentVideoId = '';

    if (uploadVideoBtn && videoFileInput) {
      uploadVideoBtn.addEventListener('click', function () { videoFileInput.click(); });
      videoFileInput.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        setResult('视频文件已选择，请使用视频URL或视频ID', true);
        videoFileInput.value = '';
      });
    }

    if (videoInput) {
      videoInput.addEventListener('blur', function () {
        var val = videoInput.value.trim();
        if (val) {
          var isId = /^\d+$/.test(val);
          if (isId) {
            currentVideoId = val;
            currentVideoUrl = '';
          } else if (/^https?:\/\//i.test(val)) {
            currentVideoUrl = val;
            currentVideoId = '';
          }
        } else {
          currentVideoUrl = '';
          currentVideoId = '';
        }
      });
    }

    btn.addEventListener('click', function () {
      var apiKey = (window.MediaStudio && window.MediaStudio.getYunwuApiKey()) || '';
      if (!apiKey) {
        setResult('<span class="msg-warning">请先在「设置」中配置并保存云雾 API Key</span>', true);
        return;
      }
      var isText2Audio = (document.getElementById('dub-mode') && document.getElementById('dub-mode').value === 'text2audio');

      if (isText2Audio) {
        var prompt = getVal('dub-prompt', '').trim();
        if (!prompt) {
          setResult('<span class="msg-warning">请输入文本内容</span>', true);
          return;
        }
        var isTts = (document.getElementById('dub-text2audio-type') && document.getElementById('dub-text2audio-type').value === 'tts');
        var submitUrl = isTts ? (apiOrigin() + '/api/yunwu/audio/tts') : (apiOrigin() + '/api/yunwu/audio/text-to-audio');
        var queryPath = isTts ? TTS_PATH : TEXT2AUDIO_PATH;
        var body = { apiKey: apiKey };
        if (isTts) {
          body.text = prompt;
          body.voice_id = getVal('dub-voice-id', 'genshin_vindi2') || 'genshin_vindi2';
          body.voice_language = getVal('dub-voice-language', 'zh') || 'zh';
          body.voice_speed = getVal('dub-voice-speed', '1.0') || '1.0';
        } else {
          body.prompt = prompt;
          var duration = parseFloat(getVal('dub-duration', '5'), 10);
          if (isNaN(duration) || duration < 3 || duration > 10) duration = 5;
          body.duration = Math.round(duration * 10) / 10;
        }

        setResult('正在提交任务…', true);
        btn.disabled = true;
        var workId = null;
        fetch(submitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
          .then(function (r) {
            return r.text().then(function (t) {
              var data = null;
              try { data = t ? JSON.parse(t) : null; } catch (e) {}
              if (!r.ok) {
                var msg = (data && (data.message || data.error || (data.error && data.error.message))) || t || ('HTTP ' + r.status);
                if (r.status === 400 && isTts && data && (data.message || data.data)) {
                  msg = (data.message || '') + (data.data && typeof data.data === 'object' ? ' ' + JSON.stringify(data.data) : '');
                }
                throw new Error(msg || ('请求失败 ' + r.status));
              }
              return data != null ? data : {};
            });
          })
          .then(function (data) {
            var taskId = (data && data.data && (data.data.id || data.data.task_id || data.data.request_id)) ||
              (data && data.id) || (data && data.task_id) || (data && data.request_id) ||
              (data && data.data && data.data.request_id);
            if (!taskId) {
              var errMsg = (data && (data.message || data.error || (data.error && data.error.message))) ? (data.message || data.error || (data.error && data.error.message)) : '未返回任务 ID，请检查 API 响应';
              setResult('<span class="msg-error">✗ ' + String(errMsg).replace(/\n/g, '<br>') + '</span><pre>' + JSON.stringify(data || {}, null, 2) + '</pre>', true);
              btn.disabled = false;
              return Promise.reject(new Error(errMsg));
            }
            if (window.MediaStudio && window.MediaStudio.addWork) {
              workId = window.MediaStudio.addWork({
                type: isTts ? 'tts' : 'text2audio',
                status: 'processing',
                taskId: taskId,
                title: (prompt || (isTts ? '语音合成' : '文生音效')).slice(0, 80),
                images: [],
                videos: [],
                audios: [],
              });
            }
            setResult('任务已创建，轮询中: ' + taskId + ' …', true);
            var setProgress = function (txt) { setResult(txt, true); };
            return new Promise(function (resolve, reject) {
              pollTask(taskId, apiKey, workId, setProgress, resolve, reject, 0, queryPath);
            });
          })
          .then(function (result) { handleDubResult(result, workId, btn); })
          .catch(function (err) { handleDubError(err, workId, btn); });
        return;
      }

      var videoInputValue = getVal('dub-video', '') || currentVideoUrl || currentVideoId || '';
      if (!videoInputValue) {
        setResult('<span class="msg-warning">请输入视频 URL 或视频ID</span>', true);
        return;
      }

      var body = { apiKey: apiKey };
      if (/^\d+$/.test(videoInputValue)) {
        body.video_id = videoInputValue;
      } else {
        body.video_url = videoInputValue;
      }
      var soundPrompt = getVal('dub-sound-effect-prompt', '').trim();
      if (soundPrompt) body.sound_effect_prompt = soundPrompt;
      var bgmPrompt = getVal('dub-bgm-prompt', '').trim();
      if (bgmPrompt) body.bgm_prompt = bgmPrompt;
      var asmrEl = document.getElementById('dub-asmr-mode');
      body.asmr_mode = !!(asmrEl && asmrEl.checked);

      setResult('正在提交任务…', true);
      btn.disabled = true;
      var workId = null;
      fetch(apiOrigin() + '/api/yunwu/audio/video-to-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (r) {
          if (!r.ok) {
            return r.text().then(function (t) {
              throw new Error('请求失败 ' + r.status + (r.status === 404 ? '（接口未找到，请确认服务已重启）' : '') + ': ' + (t ? t.substring(0, 150).replace(/\s+/g, ' ') : ''));
            });
          }
          return r.json();
        })
        .then(function (data) {
          var taskId = (data && data.data && (data.data.id || data.data.task_id || data.data.request_id)) ||
            (data && data.id) || (data && data.task_id) || (data && data.request_id) ||
            (data && data.data && data.data.request_id);
          if (!taskId) {
            var errMsg = (data && (data.message || data.error || (data.error && data.error.message))) ? (data.message || data.error || (data.error && data.error.message)) : '未返回任务 ID，请检查 API 响应';
            setResult('<span class="msg-error">✗ ' + String(errMsg).replace(/\n/g, '<br>') + '</span><pre>' + JSON.stringify(data || {}, null, 2) + '</pre>', true);
            btn.disabled = false;
            return Promise.reject(new Error(errMsg));
          }
          if (window.MediaStudio && window.MediaStudio.addWork) {
            workId = window.MediaStudio.addWork({
              type: 'dubbing',
              status: 'processing',
              taskId: taskId,
              title: '视频生音效',
              images: [],
              videos: [],
              audios: [],
            });
          }
          setResult('任务已创建，轮询中: ' + taskId + ' …', true);
          var setProgress = function (txt) { setResult(txt, true); };
          return new Promise(function (resolve, reject) {
            pollTask(taskId, apiKey, workId, setProgress, resolve, reject, 0, VIDEO2AUDIO_PATH);
          });
        })
        .then(function (result) {
          var audios = (result && result.audios) || [];
          var raw = result && result.raw;
          var audioId = (result && result.audioId) || '';
          if (!audios.length && raw) {
            collectAudioUrls(raw, audios);
            audios = [...new Set(audios.filter(Boolean))];
          }
          if (!audioId && raw) {
            audioId = (raw && raw.data && raw.data.audio_id) ||
              (raw && raw.data && raw.data.task_result && raw.data.task_result.audio_id) ||
              (raw && raw.audio_id) ||
              '';
          }
          var hasResources = audios.length > 0;
          if (workId && window.MediaStudio && window.MediaStudio.updateWork) {
            var updates = {
              status: hasResources ? 'ready' : 'failed',
              audios: audios,
              progress: null,
              progressStatus: null
            };
            if (audios.length) updates.resultUrl = audios[0];
            if (audioId) updates.audioId = audioId;
            window.MediaStudio.updateWork(workId, updates);
            if (window.MediaStudio && window.MediaStudio.refreshWorksList) window.MediaStudio.refreshWorksList();
          }
          if (!hasResources) {
            var msg = '<span class="msg-warning">任务完成但未解析到音频链接。</span>';
            if (raw) {
              msg += '<br><details style="margin-top:12px"><summary style="cursor:pointer">点击展开「查询任务」原始响应（便于排查字段）</summary><pre style="max-height:240px;overflow:auto;font-size:11px;white-space:pre-wrap;background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;margin-top:8px">' + JSON.stringify(raw, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre></details>';
            }
            setResult(msg, true);
            btn.disabled = false;
            return;
          }
          var html = '<span class="msg-success">✓ 生成完成</span><br>';
          var firstUrl = audios[0];
          if (firstUrl) {
            html += '<div class="t2i-out"><audio src="' + (firstUrl || '').replace(/"/g, '&quot;') + '" controls style="max-width:100%;"></audio><a href="' + (firstUrl || '#').replace(/"/g, '&quot;') + '" target="_blank" rel="noopener">打开音频</a></div>';
          }
          setResult(html, true);
          btn.disabled = false;
        })
        .catch(function (err) {
          setResult('<span class="msg-error">✗ ' + (err.message || String(err)).replace(/\n/g, '<br>') + '</span>', true);
          if (workId && window.MediaStudio && window.MediaStudio.updateWork) {
            window.MediaStudio.updateWork(workId, { status: 'failed', error: (err && err.message) || String(err), progress: null, progressStatus: null });
          }
          btn.disabled = false;
        });
    });
  }

  if (window.MediaStudio && window.MediaStudio.register) {
    window.MediaStudio.register(id, { name: name, icon: icon, getPanel: getPanel, init: init });
  }
})();
