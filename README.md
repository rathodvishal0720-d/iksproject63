# Samskrita Bhasha and Natural Language Processing

**Indian Knowledge System (IKS) project** by Vishal Rathod, Roll No. 63, T.Y. B.Sc. (Information Technology).

A responsive website that translates English or Hindi sentences into Sanskrit (Devanagari script) and explains Sanskrit NLP, Paninian grammar, Sandhi and Samasa. It is built with plain **HTML, CSS and JavaScript only**. There is no backend, no build step and no API key, so it runs on **GitHub Pages**.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and project content |
| `style.css` | Saffron, cream and gold heritage design, responsive layout |
| `script.js` | Translator logic, examples, copy/clear, dictionary demo |
| `README.md` | This guide |

## How the translation works

### Mode 1: Online machine translation (default)
The browser calls the public **MyMemory** API directly:

```
GET https://api.mymemory.translated.net/get?q=<text>&langpair=en|sa
GET https://api.mymemory.translated.net/get?q=<text>&langpair=hi|sa
```

* Sanskrit is supported (language code `sa`, returned as `sa-IN`) and results are in Devanagari.
* No secret key is needed, and the service allows direct browser (CORS) requests.
* This was checked before use: a test request for `en|sa` returned a Devanagari Sanskrit translation.

### Mode 2: Basic dictionary demo (offline)
A small built-in dictionary of common words and a few ready-made sentences. **It is not a real translator.** It swaps words one at a time and does not apply Sanskrit case endings, verb agreement, Sandhi or word order. Unknown words show in `[brackets]`. If the online service fails, the site offers a one-click switch to this mode.

## Limitations (please mention these when presenting)

1. **Accuracy:** MyMemory output is machine-generated. It can contain grammar, Sandhi and vocabulary mistakes. Treat it as a draft, and have a Sanskrit teacher check anything important.
2. **Best for short sentences.** Idioms and long, complex sentences translate poorly.
3. **Daily limit:** anonymous use is limited to roughly 5,000 characters per day per internet connection. Recent results are cached for the browser session to save quota.
4. **Needs internet** for online mode, and the typed text is sent to the MyMemory service. Do not enter private information.
5. **Third-party service:** this site depends on MyMemory being available. If it changes or goes down, the dictionary demo still works.
6. **Dictionary demo is tiny** and only for demonstration of the lookup idea.
7. Fonts load from Google Fonts. Without internet the site falls back to system fonts, and Devanagari still displays on modern phones and laptops.

## Publish with GitHub Pages (no software needed)

1. Sign in at **github.com**. Create a free account first if needed.
2. Click **+** (top right) then **New repository**. Name it, for example, `sanskrit-nlp-iks`. Choose **Public**. Click **Create repository**.
3. On the new repository page click **creating a new file** (or **Add file** then **Create new file**).
4. In the file name box type `index.html`, paste the full code, then click **Commit changes** and **Commit changes** again.
5. Repeat for `style.css`, `script.js` and `README.md`. File names must match exactly and be lower case, all in the main folder.
   *Shortcut:* **Add file** then **Upload files**, drag all four files in, and click **Commit changes**.
6. Open the **Settings** tab, then **Pages** in the left menu.
7. Under **Build and deployment** choose **Source: Deploy from a branch**. Select branch **main** and folder **/ (root)**, then click **Save**.
8. Wait one to two minutes and refresh the Pages screen. A banner shows **Your site is live at** with your address:
   `https://YOUR-USERNAME.github.io/sanskrit-nlp-iks/`
9. Open that address on your laptop or phone. It works in any modern browser. Use **Share** or type the link on your phone to demonstrate in college.

### If the page looks unstyled or is blank
* Check that all four files are in the main folder, not inside a subfolder.
* Check the names are exactly `index.html`, `style.css` and `script.js`.
* Do a hard refresh (Ctrl + Shift + R) after publishing changes.

## Presentation tips
* Demo online mode with the example buttons in both English and Hindi.
* Show the dictionary demo and point out how bracketed words and missing grammar illustrate why real Sanskrit NLP needs Sandhi splitting, morphology and Karaka analysis.
* Connect it back to your literature review: rule-based (Paninian), database-driven, and neural approaches.

## Credits
* Translation service: MyMemory by Translated (https://mymemory.translated.net)
* Fonts: Google Fonts (Poppins, Cormorant Garamond, Noto Serif Devanagari, Noto Sans Devanagari)
