/* ============================================================
   Samskrita Bhasha and NLP : English/Hindi -> Sanskrit translator
   Plain JavaScript, no backend, no secret keys.

   Mode 1 (default): MyMemory public API, called straight from the
   browser. Endpoint: https://api.mymemory.translated.net/get
   Parameters: q (text, max 500 bytes), langpair (e.g. en|sa, hi|sa)
   Sanskrit target code: "sa". Anonymous quota: ~5000 chars/day.

   Mode 2: a SMALL built-in dictionary demo. It is NOT a translator.
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- Settings ---------------- */
  var API_URL = 'https://api.mymemory.translated.net/get';
  var MAX_CHUNK_BYTES = 450;   // MyMemory allows 500 bytes per request; keep a safety margin
  var TIMEOUT_MS = 15000;

  /* ---------------- Element references ---------------- */
  var $ = function (id) { return document.getElementById(id); };
  var inputLang = $('inputLang');
  var modeSelect = $('modeSelect');
  var modeNote = $('modeNote');
  var inputText = $('inputText');
  var charCount = $('charCount');
  var translateBtn = $('translateBtn');
  var clearBtn = $('clearBtn');
  var copyBtn = $('copyBtn');
  var statusBox = $('status');
  var output = $('output');
  var outputMeta = $('outputMeta');
  var exampleChips = $('exampleChips');
  var exLangLabel = $('exLangLabel');
  var navToggle = $('navToggle');
  var mainNav = $('mainNav');

  var PLACEHOLDER_HTML = '<span class="placeholder">Your Sanskrit translation will appear here in Devanagari script.</span>';
  var currentResult = '';
  var toastTimer = null;

  /* ---------------- Example sentences ---------------- */
  var EXAMPLES = {
    en: [
      'Good morning, my friend.',
      'Knowledge is power.',
      'Where is the school?',
      'What is your name?',
      'I read a book.',
      'Water is life.'
    ],
    hi: [
      'आपका नाम क्या है?',
      'मैं पुस्तक पढ़ता हूँ।',
      'ज्ञान ही शक्ति है।',
      'आज मौसम सुंदर है।',
      'सत्य की सदा जीत होती है।',
      'धन्यवाद, मेरे मित्र।'
    ]
  };

  /* ============================================================
     DICTIONARY DEMO DATA (small, hand-written, for demonstration)
     ============================================================ */

  // Whole-sentence entries (keys are matched after normalisation).
  var PHRASES = {
    en: {
      'good morning my friend': 'सुप्रभातम्, मम मित्र',
      'knowledge is power': 'ज्ञानं शक्तिः',
      'truth alone triumphs': 'सत्यमेव जयते',
      'i read a book': 'अहं पुस्तकं पठामि',
      'water is life': 'जलं जीवनम्',
      'where is the school': 'पाठशाला कुत्र अस्ति',
      'what is your name': 'भवतः नाम किम्',
      'thank you': 'धन्यवादः',
      'good morning': 'सुप्रभातम्',
      'good night': 'शुभरात्रिः'
    },
    hi: {
      'आपका नाम क्या है': 'भवतः नाम किम्',
      'मैं पुस्तक पढ़ता हूँ': 'अहं पुस्तकं पठामि',
      'मैं पुस्तक पढ़ती हूँ': 'अहं पुस्तकं पठामि',
      'ज्ञान ही शक्ति है': 'ज्ञानं शक्तिः',
      'आज मौसम सुंदर है': 'अद्य वातावरणं सुन्दरम् अस्ति',
      'सत्य की सदा जीत होती है': 'सत्यमेव जयते',
      'धन्यवाद मेरे मित्र': 'धन्यवादः, मम मित्र',
      'पानी जीवन है': 'जलं जीवनम्',
      'विद्यालय कहाँ है': 'पाठशाला कुत्र अस्ति',
      'शुभ रात्रि': 'शुभरात्रिः'
    }
  };

  // Single words. An empty string means "drop this word" (Sanskrit has no articles).
  var WORDS = {
    en: {
      'hello': 'नमस्ते', 'hi': 'नमस्ते', 'namaste': 'नमस्ते', 'thanks': 'धन्यवादः', 'thank': 'धन्यवादः',
      'welcome': 'स्वागतम्', 'yes': 'आम्', 'no': 'न', 'not': 'न', 'please': 'कृपया', 'sorry': 'क्षम्यताम्',
      'what': 'किम्', 'who': 'कः', 'where': 'कुत्र', 'when': 'कदा', 'why': 'किमर्थम्', 'how': 'कथम्',
      'i': 'अहम्', 'me': 'माम्', 'you': 'त्वम्', 'he': 'सः', 'she': 'सा', 'it': 'तत्', 'we': 'वयम्', 'they': 'ते',
      'my': 'मम', 'your': 'तव', 'his': 'तस्य', 'her': 'तस्याः', 'our': 'अस्माकम्', 'their': 'तेषाम्',
      'this': 'एतत्', 'that': 'तत्', 'is': 'अस्ति', 'am': 'अस्मि', 'are': 'सन्ति', 'was': 'आसीत्',
      'and': 'च', 'or': 'वा', 'with': 'सह', 'but': 'किन्तु', 'all': 'सर्वम्',
      'the': '', 'a': '', 'an': '', 'to': '', 'of': '',
      'good': 'उत्तमम्', 'morning': 'प्रभातम्', 'night': 'रात्रिः', 'day': 'दिनम्', 'today': 'अद्य',
      'tomorrow': 'श्वः', 'yesterday': 'ह्यः', 'now': 'अधुना', 'always': 'सदा', 'alone': 'केवलम्',
      'truth': 'सत्यम्', 'triumphs': 'जयते', 'wins': 'जयते', 'victory': 'जयः',
      'knowledge': 'ज्ञानम्', 'power': 'शक्तिः', 'strength': 'बलम्', 'life': 'जीवनम्',
      'water': 'जलम्', 'food': 'अन्नम्', 'book': 'पुस्तकम्', 'books': 'पुस्तकानि',
      'school': 'पाठशाला', 'teacher': 'शिक्षकः', 'student': 'छात्रः', 'friend': 'मित्रम्',
      'mother': 'माता', 'father': 'पिता', 'brother': 'भ्राता', 'sister': 'भगिनी',
      'home': 'गृहम्', 'house': 'गृहम्', 'name': 'नाम', 'language': 'भाषा', 'sanskrit': 'संस्कृतम्',
      'india': 'भारतम्', 'country': 'देशः', 'world': 'विश्वम्', 'sun': 'सूर्यः', 'moon': 'चन्द्रः',
      'river': 'नदी', 'tree': 'वृक्षः', 'flower': 'पुष्पम्', 'fruit': 'फलम्', 'mountain': 'पर्वतः',
      'peace': 'शान्तिः', 'love': 'प्रेम', 'happy': 'सुखी', 'beautiful': 'सुन्दरम्', 'big': 'महत्',
      'small': 'लघु', 'new': 'नवम्', 'computer': 'सङ्गणकम्', 'weather': 'वातावरणम्', 'king': 'राजा',
      'god': 'ईश्वरः', 'time': 'समयः', 'work': 'कार्यम्', 'money': 'धनम्', 'city': 'नगरम्',
      'village': 'ग्रामः', 'man': 'पुरुषः', 'woman': 'स्त्री', 'child': 'बालः', 'children': 'बालाः',
      'go': 'गच्छति', 'goes': 'गच्छति', 'come': 'आगच्छति', 'comes': 'आगच्छति', 'eat': 'खादति', 'eats': 'खादति',
      'drink': 'पिबति', 'drinks': 'पिबति', 'read': 'पठति', 'reads': 'पठति', 'study': 'पठति', 'studies': 'पठति',
      'write': 'लिखति', 'writes': 'लिखति', 'see': 'पश्यति', 'sees': 'पश्यति', 'speak': 'वदति', 'speaks': 'वदति',
      'learn': 'अधीते', 'learns': 'अधीते', 'play': 'क्रीडति', 'plays': 'क्रीडति', 'sleep': 'स्वपिति',
      'sleeps': 'स्वपिति', 'give': 'ददाति', 'gives': 'ददाति', 'know': 'जानाति', 'knows': 'जानाति',
      'live': 'जीवति', 'lives': 'जीवति'
    },
    hi: {
      'नमस्ते': 'नमस्ते', 'नमस्कार': 'नमस्ते', 'धन्यवाद': 'धन्यवादः', 'शुक्रिया': 'धन्यवादः',
      'स्वागत': 'स्वागतम्', 'हाँ': 'आम्', 'नहीं': 'न', 'न': 'न', 'कृपया': 'कृपया', 'क्षमा': 'क्षम्यताम्',
      'सुप्रभात': 'सुप्रभातम्', 'मैं': 'अहम्', 'मुझे': 'माम्', 'तुम': 'त्वम्', 'आप': 'भवान्',
      'वह': 'सः', 'वो': 'सः', 'यह': 'एतत्', 'हम': 'वयम्', 'वे': 'ते',
      'मेरा': 'मम', 'मेरी': 'मम', 'मेरे': 'मम', 'तुम्हारा': 'तव', 'आपका': 'भवतः', 'आपकी': 'भवतः', 'आपके': 'भवतः',
      'उसका': 'तस्य', 'उसकी': 'तस्य', 'हमारा': 'अस्माकम्', 'हमारी': 'अस्माकम्',
      'का': '', 'की': '', 'के': '', 'को': '', 'में': '', 'से': '', 'ही': 'एव',
      'है': 'अस्ति', 'हूँ': 'अस्मि', 'हैं': 'सन्ति', 'था': 'आसीत्', 'थी': 'आसीत्',
      'और': 'च', 'या': 'वा', 'लेकिन': 'किन्तु', 'परंतु': 'किन्तु',
      'क्या': 'किम्', 'कौन': 'कः', 'कहाँ': 'कुत्र', 'कब': 'कदा', 'क्यों': 'किमर्थम्', 'कैसे': 'कथम्',
      'नाम': 'नाम', 'आज': 'अद्य', 'सदा': 'सदा', 'हमेशा': 'सदा', 'अब': 'अधुना',
      'सत्य': 'सत्यम्', 'ज्ञान': 'ज्ञानम्', 'शक्ति': 'शक्तिः', 'बल': 'बलम्', 'जीवन': 'जीवनम्', 'जीत': 'जयः',
      'पानी': 'जलम्', 'जल': 'जलम्', 'भोजन': 'भोजनम्', 'पुस्तक': 'पुस्तकम्', 'किताब': 'पुस्तकम्',
      'विद्यालय': 'पाठशाला', 'स्कूल': 'पाठशाला', 'शिक्षक': 'शिक्षकः', 'गुरु': 'गुरुः',
      'छात्र': 'छात्रः', 'विद्यार्थी': 'छात्रः', 'मित्र': 'मित्रम्', 'दोस्त': 'मित्रम्',
      'माता': 'माता', 'माँ': 'माता', 'पिता': 'पिता', 'भाई': 'भ्राता', 'बहन': 'भगिनी',
      'घर': 'गृहम्', 'भाषा': 'भाषा', 'संस्कृत': 'संस्कृतम्', 'भारत': 'भारतम्', 'देश': 'देशः',
      'विश्व': 'विश्वम्', 'दुनिया': 'विश्वम्', 'सूर्य': 'सूर्यः', 'चाँद': 'चन्द्रः', 'चंद्रमा': 'चन्द्रः',
      'नदी': 'नदी', 'पेड़': 'वृक्षः', 'फूल': 'पुष्पम्', 'फल': 'फलम्', 'पर्वत': 'पर्वतः', 'पहाड़': 'पर्वतः',
      'शांति': 'शान्तिः', 'प्रेम': 'प्रेम', 'सुंदर': 'सुन्दरम्', 'सुन्दर': 'सुन्दरम्',
      'अच्छा': 'उत्तमम्', 'अच्छी': 'उत्तमम्', 'बड़ा': 'महत्', 'छोटा': 'लघु', 'नया': 'नवम्',
      'मौसम': 'वातावरणम्', 'राजा': 'राजा', 'समय': 'समयः', 'काम': 'कार्यम्', 'धन': 'धनम्',
      'शहर': 'नगरम्', 'गाँव': 'ग्रामः', 'दिन': 'दिनम्', 'रात': 'रात्रिः', 'सुबह': 'प्रभातम्',
      'जाता': 'गच्छति', 'जाती': 'गच्छति', 'जाते': 'गच्छति', 'जाना': 'गच्छति',
      'आता': 'आगच्छति', 'आती': 'आगच्छति', 'आते': 'आगच्छति',
      'खाता': 'खादति', 'खाती': 'खादति', 'पीता': 'पिबति', 'पीती': 'पिबति',
      'पढ़ता': 'पठति', 'पढ़ती': 'पठति', 'पढ़ते': 'पठति', 'पढ़ना': 'पठति',
      'लिखता': 'लिखति', 'लिखती': 'लिखति', 'देखता': 'पश्यति', 'देखती': 'पश्यति',
      'बोलता': 'वदति', 'बोलती': 'वदति', 'सीखता': 'अधीते', 'सीखती': 'अधीते',
      'खेलता': 'क्रीडति', 'खेलती': 'क्रीडति', 'जानता': 'जानाति', 'जानती': 'जानाति',
      'रहता': 'वसति', 'रहती': 'वसति'
    }
  };

  /* ---------------- Text normalisation helpers ---------------- */
  // Lower-case, Unicode-normalise, and treat chandrabindu (ँ) like anusvara (ं)
  // so that "हूँ" and "हूं" match the same dictionary entry.
  function norm(s) {
    return String(s).normalize('NFC').toLowerCase().replace(/\u0901/g, '\u0902');
  }

  // Build normalised lookup tables once.
  function buildTable(obj) {
    var t = Object.create(null);
    Object.keys(obj).forEach(function (k) { t[norm(k)] = obj[k]; });
    return t;
  }
  var WORD_TABLE = { en: buildTable(WORDS.en), hi: buildTable(WORDS.hi) };
  var PHRASE_TABLE = { en: buildTable(PHRASES.en), hi: buildTable(PHRASES.hi) };

  function phraseKey(text) {
    return norm(text)
      .replace(/[.,!?;:\u0964\u0965"'\u2018\u2019\u201C\u201D()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function endMark(text) {
    var t = text.trim();
    var last = t.charAt(t.length - 1);
    if (last === '?') return '?';
    if (last === '!') return '!';
    return '\u0964'; // danda
  }

  /* ---------------- Dictionary demo translation ---------------- */
  function dictionaryTranslate(text, lang) {
    var key = phraseKey(text);
    var phrase = PHRASE_TABLE[lang][key];
    if (phrase) {
      return { text: phrase + endMark(text), unknown: 0, total: key.split(' ').length, wholePhrase: true };
    }

    var tokens = text.normalize('NFC').match(/[\p{L}\p{M}\p{N}']+|[^\s\p{L}\p{M}\p{N}']/gu) || [];
    var out = '';
    var unknown = 0;
    var total = 0;

    tokens.forEach(function (tok) {
      var isWord = /[\p{L}\p{N}]/u.test(tok);
      if (!isWord) {
        var mark = tok === '.' ? '\u0964' : tok;
        out += mark + ' ';
        return;
      }
      total++;
      var k = norm(tok);
      var hit = WORD_TABLE[lang][k];
      if (hit === undefined && lang === 'en' && k.length > 3 && k.charAt(k.length - 1) === 's') {
        hit = WORD_TABLE.en[k.slice(0, -1)]; // very crude plural handling
      }
      if (hit === undefined) {
        unknown++;
        out += '[' + tok + '] ';
      } else if (hit !== '') {
        out += hit + ' ';
      }
    });

    out = out.replace(/\s+([,.?!;:\u0964])/g, '$1').replace(/\s+/g, ' ').trim();
    return { text: out, unknown: unknown, total: total, wholePhrase: false };
  }

  /* ============================================================
     ONLINE TRANSLATION (MyMemory)
     ============================================================ */

  function TranslateError(kind, message) {
    this.name = 'TranslateError';
    this.kind = kind;
    this.message = message || kind;
  }
  TranslateError.prototype = Object.create(Error.prototype);

  function byteLength(s) {
    return new TextEncoder().encode(s).length;
  }

  // Split long input into pieces that fit MyMemory's 500-byte limit,
  // breaking at sentence ends first and at spaces if a sentence is still too long.
  function splitIntoChunks(text) {
    var sentences = text.match(/[^.!?\u0964\u0965\n]+[.!?\u0964\u0965]*\s*/g) || [text];
    var chunks = [];
    var current = '';

    function pushCurrent() {
      if (current.trim()) chunks.push(current.trim());
      current = '';
    }

    sentences.forEach(function (sentence) {
      if (byteLength(sentence) > MAX_CHUNK_BYTES) {
        pushCurrent();
        var words = sentence.split(/\s+/);
        var piece = '';
        words.forEach(function (w) {
          var candidate = piece ? piece + ' ' + w : w;
          if (byteLength(candidate) > MAX_CHUNK_BYTES) {
            if (piece) chunks.push(piece);
            piece = w;
          } else {
            piece = candidate;
          }
        });
        if (piece) chunks.push(piece);
      } else if (byteLength(current + sentence) > MAX_CHUNK_BYTES) {
        pushCurrent();
        current = sentence;
      } else {
        current += sentence;
      }
    });
    pushCurrent();
    return chunks;
  }

  function decodeEntities(s) {
    var ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
  }

  function fetchWithTimeout(url) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    return fetch(url, { signal: controller.signal })
      .then(function (res) { clearTimeout(timer); return res; })
      .catch(function (err) {
        clearTimeout(timer);
        if (err && err.name === 'AbortError') throw new TranslateError('timeout');
        throw new TranslateError('network');
      });
  }

  function translateChunk(chunk, lang) {
    var params = new URLSearchParams({ q: chunk, langpair: lang + '|sa' });
    return fetchWithTimeout(API_URL + '?' + params.toString())
      .then(function (res) {
        if (res.status === 429) throw new TranslateError('quota');
        if (!res.ok) throw new TranslateError('http', 'HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var status = Number(data && data.responseStatus);
        var text = data && data.responseData && data.responseData.translatedText;

        if (data && data.quotaFinished) throw new TranslateError('quota');
        if (typeof text === 'string' && /MYMEMORY WARNING|USED ALL AVAILABLE FREE TRANSLATIONS/i.test(text)) {
          throw new TranslateError('quota');
        }
        if (status === 429) throw new TranslateError('quota');
        if (status !== 200) {
          throw new TranslateError('api', (data && data.responseDetails) || ('Status ' + status));
        }
        if (typeof text !== 'string' || !text.trim()) throw new TranslateError('empty');

        text = decodeEntities(text).trim();
        if (!/[\u0900-\u097F]/.test(text)) throw new TranslateError('notsanskrit');
        if (norm(text) === norm(chunk)) throw new TranslateError('unchanged');
        return text;
      });
  }

  function onlineTranslate(text, lang) {
    var chunks = splitIntoChunks(text);
    var results = [];
    // Translate pieces one after another (polite to the free service).
    return chunks.reduce(function (promise, chunk) {
      return promise.then(function () {
        return translateChunk(chunk, lang).then(function (t) { results.push(t); });
      });
    }, Promise.resolve()).then(function () {
      return results.join(' ');
    });
  }

  /* ---------------- Simple session cache (saves free quota) ---------------- */
  function cacheGet(key) {
    try { return sessionStorage.getItem('sk:' + key); } catch (e) { return null; }
  }
  function cacheSet(key, value) {
    try { sessionStorage.setItem('sk:' + key, value); } catch (e) { /* ignore */ }
  }

  /* ============================================================
     UI helpers
     ============================================================ */

  function showStatus(type, html, actionLabel, actionFn) {
    statusBox.hidden = false;
    statusBox.className = 'status ' + type;
    statusBox.innerHTML = '';
    if (type === 'loading') {
      var sp = document.createElement('span');
      sp.className = 'spinner';
      sp.setAttribute('aria-hidden', 'true');
      statusBox.appendChild(sp);
    }
    var body = document.createElement('div');
    body.className = 'status-body';
    body.textContent = html;
    if (actionLabel && actionFn) {
      var br = document.createElement('div');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'status-action';
      btn.textContent = actionLabel;
      btn.addEventListener('click', actionFn);
      br.appendChild(btn);
      body.appendChild(br);
    }
    statusBox.appendChild(body);
  }

  function hideStatus() {
    statusBox.hidden = true;
    statusBox.innerHTML = '';
    statusBox.className = 'status';
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }

  function setBusy(busy) {
    translateBtn.disabled = busy;
    translateBtn.textContent = busy ? 'Translating\u2026' : 'Translate to Sanskrit';
  }

  function showResult(text, meta) {
    currentResult = text;
    output.textContent = text;
    outputMeta.textContent = meta || '';
    copyBtn.disabled = !text;
  }

  function resetResult() {
    currentResult = '';
    output.innerHTML = PLACEHOLDER_HTML;
    outputMeta.textContent = '';
    copyBtn.disabled = true;
  }

  function updateModeNote() {
    if (modeSelect.value === 'api') {
      modeNote.className = 'mode-note';
      modeNote.textContent = 'Online machine translation via the free MyMemory service. Results are machine-generated drafts and may contain mistakes. Your text is sent to that service, so avoid private details.';
    } else {
      modeNote.className = 'mode-note warn';
      modeNote.textContent = 'Basic dictionary demo: replaces words one by one from a small built-in list. It is NOT a real translator and does not apply Sanskrit grammar, Sandhi or word order. Unknown words appear in [brackets].';
    }
  }

  function renderExamples() {
    var lang = inputLang.value;
    exLangLabel.textContent = '(' + (lang === 'en' ? 'English' : 'Hindi') + ')';
    exampleChips.innerHTML = '';
    EXAMPLES[lang].forEach(function (sentence) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = sentence;
      chip.addEventListener('click', function () {
        inputText.value = sentence;
        updateCount();
        runTranslation();
      });
      exampleChips.appendChild(chip);
    });
  }

  function updateCount() {
    charCount.textContent = inputText.value.length + ' / ' + inputText.maxLength;
  }

  function friendlyError(err) {
    var kind = err && err.kind;
    switch (kind) {
      case 'timeout':
        return 'The translation service took too long to answer. Please check your internet connection and try again.';
      case 'network':
        return (navigator.onLine === false)
          ? 'You appear to be offline. Connect to the internet and try again, or use the dictionary demo mode.'
          : 'Could not reach the translation service. It may be busy or blocked on this network. Please try again, or use the dictionary demo mode.';
      case 'quota':
        return 'The free daily translation limit for this connection has been reached. Please try again tomorrow, or use the dictionary demo mode.';
      case 'empty':
        return 'The service returned an empty result. Try rephrasing the sentence.';
      case 'unchanged':
      case 'notsanskrit':
        return 'The service could not produce a Sanskrit translation for this text. Try a shorter or simpler sentence.';
      case 'http':
      case 'api':
        return 'The translation service reported a problem (' + (err.message || 'unknown') + '). Please try again in a moment.';
      default:
        return 'Something went wrong while translating. Please try again.';
    }
  }

  /* ============================================================
     Main action
     ============================================================ */

  function runTranslation() {
    var text = inputText.value.trim();
    var lang = inputLang.value;
    var mode = modeSelect.value;

    if (!text) {
      showStatus('error', 'Please type a sentence first, or choose one of the examples.');
      resetResult();
      inputText.focus();
      return;
    }

    if (lang === 'en' && /[\u0900-\u097F]/.test(text)) {
      showStatus('error', 'The input language is set to English, but the text looks like Devanagari. Switch the input language to Hindi, or type in English.');
      return;
    }
    if (lang === 'hi' && !/[\u0900-\u097F]/.test(text)) {
      showStatus('error', 'The input language is set to Hindi, but the text does not look like Hindi in Devanagari script. Switch to English, or type in Hindi.');
      return;
    }

    if (mode === 'dict') {
      var r = dictionaryTranslate(text, lang);
      hideStatus();
      var meta = 'Mode: basic dictionary demo (not a full translation). ';
      if (r.wholePhrase) {
        meta += 'Matched a ready-made sentence.';
      } else {
        meta += (r.total - r.unknown) + ' of ' + r.total + ' words found in the dictionary.';
      }
      showResult(r.text, meta);
      if (!r.wholePhrase && r.unknown > 0) {
        showStatus('error', r.unknown + ' word(s) are not in the small demo dictionary and are shown in [brackets]. Try the online mode for fuller translation.');
      }
      return;
    }

    // Online mode
    var cacheKey = lang + '|' + text;
    var cached = cacheGet(cacheKey);
    if (cached) {
      hideStatus();
      showResult(cached, 'Mode: online machine translation (MyMemory), from this session\u2019s saved results. Please verify before using.');
      return;
    }

    if (navigator.onLine === false) {
      showStatus('error', 'You appear to be offline. Connect to the internet, or switch to the dictionary demo mode.', 'Use dictionary demo mode', switchToDict);
      return;
    }

    setBusy(true);
    showStatus('loading', 'Translating to Sanskrit\u2026 this usually takes a few seconds.');

    onlineTranslate(text, lang)
      .then(function (result) {
        cacheSet(cacheKey, result);
        showResult(result, 'Mode: online machine translation (MyMemory). Machine-generated: please verify grammar and Sandhi with a Sanskrit teacher.');
        showStatus('success', 'Translation complete.');
        setTimeout(function () {
          if (statusBox.classList.contains('success')) hideStatus();
        }, 2500);
      })
      .catch(function (err) {
        showStatus('error', friendlyError(err), 'Use dictionary demo mode', switchToDict);
      })
      .then(function () { setBusy(false); });
  }

  function switchToDict() {
    modeSelect.value = 'dict';
    updateModeNote();
    runTranslation();
  }

  /* ---------------- Copy / Clear ---------------- */
  function copyTranslation() {
    if (!currentResult) return;
    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = currentResult;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      showToast(ok ? 'Translation copied' : 'Copy failed. Please select the text and copy manually.');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(currentResult)
        .then(function () { showToast('Translation copied'); })
        .catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function clearAll() {
    inputText.value = '';
    updateCount();
    hideStatus();
    resetResult();
    inputText.focus();
  }

  /* ---------------- Events ---------------- */
  translateBtn.addEventListener('click', runTranslation);
  clearBtn.addEventListener('click', clearAll);
  copyBtn.addEventListener('click', copyTranslation);
  inputText.addEventListener('input', updateCount);
  inputText.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runTranslation();
    }
  });
  inputLang.addEventListener('change', function () {
    renderExamples();
    inputText.placeholder = inputLang.value === 'hi'
      ? 'यहाँ एक वाक्य लिखें, जैसे: ज्ञान ही शक्ति है।'
      : 'Type a sentence here, for example: Knowledge is power.';
    hideStatus();
  });
  modeSelect.addEventListener('change', function () {
    updateModeNote();
    hideStatus();
  });

  navToggle.addEventListener('click', function () {
    var open = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mainNav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------------- Init ---------------- */
  updateModeNote();
  renderExamples();
  updateCount();
  resetResult();
})();
