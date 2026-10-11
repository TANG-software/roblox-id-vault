/* Blox ID Vault — front-end
 * Works across pages: each page contains ONE library section
 * (#animations, #sounds or #jjs) and this script initialises whichever is present.
 */
(function () {
  "use strict";

  var FAV_KEY = "rbxidvault:favourites";
  var favourites = loadFavourites();

  // ---------- tiny helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function loadFavourites() {
    try { var r = localStorage.getItem(FAV_KEY); var a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function saveFavourites() { try { localStorage.setItem(FAV_KEY, JSON.stringify(favourites)); } catch (e) {} }
  function isFav(key) { return favourites.indexOf(key) !== -1; }
  function toggleFav(key) {
    var i = favourites.indexOf(key);
    if (i === -1) favourites.push(key); else favourites.splice(i, 1);
    saveFavourites();
  }

  // ---------- toast ----------
  var toastTimer = null;
  function toast(msg) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = msg; el.hidden = false;
    requestAnimationFrame(function () { el.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { el.hidden = true; }, 230);
    }, 1500);
  }

  // ---------- clipboard ----------
  function copyText(text, label) {
    function done() { toast("copied " + (label ? label + " → " : "") + text); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(text)).then(done, function () { fallback(text); done(); });
    } else { fallback(text); done(); }
  }
  function fallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "-1000px";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  // ---------- reusable library component ----------
  function createLibrary(name, data) {
    var root = document.getElementById(name);
    if (!root || !data) return null;

    var lib = {
      name: name, data: data, query: "", category: "All", favOnly: false, sort: "featured",
      el: {
        search: $('[data-lib-search="' + name + '"]', root),
        sort: $('[data-lib-sort="' + name + '"]', root),
        chips: $('[data-lib-chips="' + name + '"]', root),
        results: $('[data-lib-results="' + name + '"]', root),
        empty: $('[data-lib-empty="' + name + '"]', root),
        favBtn: $('[data-lib-fav="' + name + '"]', root),
        count: $('[data-lib-count="' + name + '"]', root)
      }
    };

    function key(item) { return name + ":" + item.id + ":" + item.name; }
    function categories() {
      var seen = {}, out = [];
      data.forEach(function (d) { if (!seen[d.category]) { seen[d.category] = true; out.push(d.category); } });
      return out;
    }
    function matches(item, q) {
      if (!q) return true;
      var hay = (item.name + " " + item.id + " " + item.category + " " + (item.tags || []).join(" ")).toLowerCase();
      return hay.indexOf(q) !== -1;
    }
    function sorted(rows) {
      var arr = rows.slice();
      switch (lib.sort) {
        case "name": arr.sort(function (a, b) { return a.name.localeCompare(b.name); }); break;
        case "id-asc": arr.sort(function (a, b) { return Number(a.id) - Number(b.id); }); break;
        case "id-desc": arr.sort(function (a, b) { return Number(b.id) - Number(a.id); }); break;
        case "category": arr.sort(function (a, b) { return a.category.localeCompare(b.category) || a.name.localeCompare(b.name); }); break;
        default: break;
      }
      return arr;
    }

    function renderChips() {
      var cats = ["All"].concat(categories());
      lib.el.chips.innerHTML = cats.map(function (c) {
        return '<button class="chip' + (c === lib.category ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
      }).join("");
    }

    function render() {
      var q = lib.query.trim().toLowerCase();
      var rows = data.filter(function (item) {
        if (lib.category !== "All" && item.category !== lib.category) return false;
        if (lib.favOnly && !isFav(key(item))) return false;
        return matches(item, q);
      });
      rows = sorted(rows);
      lib.el.count.textContent = rows.length + (rows.length === 1 ? " ID" : " IDs");

      if (!rows.length) {
        lib.el.results.innerHTML = "";
        lib.el.empty.hidden = false;
        lib.el.empty.textContent = lib.favOnly
          ? "No favourites here yet — tap the ★ on a card to save it."
          : "No matches. Try another word, or clear the filters.";
        return;
      }
      lib.el.empty.hidden = true;

      lib.el.results.innerHTML = rows.map(function (item) {
        var k = key(item);
        var tags = (item.tags || []).slice(0, 4).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
        var lib_url = "https://www.roblox.com/library/" + item.id;
        var store_url = "https://create.roblox.com/store/asset/" + item.id;
        return (
          '<article class="card">' +
            '<div class="card-top">' +
              '<div>' +
                '<div class="card-name">' + esc(item.name) + "</div>" +
                '<div class="card-cat">' + esc(item.category) + "</div>" +
              "</div>" +
              '<button class="fav-btn' + (isFav(k) ? " on" : "") + '" data-fav="' + esc(k) + '" title="Favourite" aria-label="Favourite">\u2605</button>' +
            "</div>" +
            '<div class="id-row">' +
              '<button class="id-pill" data-copy="' + esc(item.id) + '" data-label="' + esc(item.name) + '" title="Click to copy">' + esc(item.id) + "</button>" +
              '<button class="copy-btn" data-copy="' + esc(item.id) + '" data-label="' + esc(item.name) + '">Copy</button>' +
            "</div>" +
            (tags ? '<div class="card-tags">' + tags + "</div>" : "") +
            '<div class="card-links">' +
              '<a href="' + store_url + '" target="_blank" rel="noopener">Creator Store ↗</a>' +
              '<a href="' + lib_url + '" target="_blank" rel="noopener">Library ↗</a>' +
            "</div>" +
          "</article>"
        );
      }).join("");
    }

    lib.el.search.addEventListener("input", function (e) { lib.query = e.target.value; render(); });
    lib.el.sort.addEventListener("change", function (e) { lib.sort = e.target.value; render(); });
    lib.el.favBtn.addEventListener("click", function () {
      lib.favOnly = !lib.favOnly;
      lib.el.favBtn.classList.toggle("active", lib.favOnly);
      render();
    });
    lib.el.chips.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      lib.category = chip.getAttribute("data-cat");
      renderChips(); render();
    });
    lib.el.results.addEventListener("click", function (e) {
      var copyEl = e.target.closest("[data-copy]");
      if (copyEl) {
        copyText(copyEl.getAttribute("data-copy"), copyEl.getAttribute("data-label"));
        if (copyEl.classList.contains("copy-btn")) {
          copyEl.classList.add("done");
          setTimeout(function () { copyEl.classList.remove("done"); }, 1200);
        }
        return;
      }
      var favEl = e.target.closest("[data-fav]");
      if (favEl) {
        var k = favEl.getAttribute("data-fav");
        toggleFav(k);
        favEl.classList.toggle("on", isFav(k));
        if (lib.favOnly) render();
      }
    });

    renderChips();
    render();
    return lib;
  }

  // ---------- extractor ----------
  function extractId(raw) {
    if (!raw) return null;
    var runs = String(raw).match(/\d{3,}/g);
    if (!runs) return null;
    var best = runs[0];
    runs.forEach(function (r) { if (r.length > best.length) best = r; });
    return best;
  }
  function guessType(id) {
    var a = ANIMATIONS.filter(function (x) { return x.id === id; })[0];
    if (a) return { type: "Animation", name: a.name };
    var j = JJS.filter(function (x) { return x.id === id; })[0];
    if (j) return { type: "Sound / audio (Jujutsu Shenanigans)", name: j.name };
    var s = SOUNDS.filter(function (x) { return x.id === id; })[0];
    if (s) return { type: "Sound / audio", name: s.name };
    return { type: "Not in the vault (asset ID)", name: null };
  }
  function runExtract() {
    var out = $("#extract-out");
    var id = extractId($("#extract-input").value);
    if (!id) {
      out.hidden = false;
      out.innerHTML = '<p class="muted">No numeric ID found. Paste a Roblox link, an <code>rbxassetid://</code> string, or the number itself.</p>';
      return;
    }
    var g = guessType(id);
    out.hidden = false;
    out.innerHTML =
      '<div class="muted small" style="font-family:var(--mono)">detected asset id</div>' +
      '<div class="big-id">' + esc(id) + "</div>" +
      '<div class="muted small">Likely type: <strong>' + esc(g.type) + "</strong>" +
        (g.name ? " — matches <strong>" + esc(g.name) + "</strong> in the vault" : "") + "</div>" +
      '<div class="extract-actions">' +
        '<button class="btn btn-primary" data-copy="' + esc(id) + '" data-label="asset">Copy ID</button>' +
        '<button class="btn btn-ghost" id="search-this">Find in vault</button>' +
        '<a class="btn btn-ghost" href="https://create.roblox.com/store/asset/' + id + '" target="_blank" rel="noopener">Creator Store ↗</a>' +
        '<a class="btn btn-ghost" href="https://www.roblox.com/library/' + id + '" target="_blank" rel="noopener">Library ↗</a>' +
      "</div>";
  }

  // ---------- init ----------
  document.addEventListener("DOMContentLoaded", function () {
    var DATA = { animations: ANIMATIONS, sounds: SOUNDS, jjs: JJS };

    Object.keys(DATA).forEach(function (name) {
      if (document.getElementById(name)) createLibrary(name, DATA[name]);
    });

    // pre-fill search from ?q=
    var q = new URLSearchParams(location.search).get("q");
    var firstSearch = $("[data-lib-search]");
    if (q && firstSearch) {
      firstSearch.value = q;
      firstSearch.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // counts (only where the elements exist)
    var total = ANIMATIONS.length + SOUNDS.length + JJS.length;
    var el;
    if ((el = $("#total-count"))) el.textContent = total;
    if ((el = $("#stat-anim"))) el.textContent = ANIMATIONS.length;
    if ((el = $("#stat-sound"))) el.textContent = SOUNDS.length;
    if ((el = $("#stat-jjs"))) el.textContent = JJS.length;
    if ((el = $("#stat-total"))) el.textContent = total;
    if ((el = $("#home-anim"))) el.textContent = ANIMATIONS.length;
    if ((el = $("#home-sound"))) el.textContent = SOUNDS.length;
    if ((el = $("#home-jjs"))) el.textContent = JJS.length;

    // extractor (home page only)
    if ($("#extract-btn")) {
      $("#extract-btn").addEventListener("click", runExtract);
      $("#extract-input").addEventListener("keydown", function (e) { if (e.key === "Enter") runExtract(); });
      $("#extract-out").addEventListener("click", function (e) {
        var copyEl = e.target.closest("[data-copy]");
        if (copyEl) { copyText(copyEl.getAttribute("data-copy"), copyEl.getAttribute("data-label")); return; }
        if (e.target.id === "search-this") {
          var id = extractId($("#extract-input").value);
          if (!id) return;
          var target = ANIMATIONS.some(function (x) { return x.id === id; }) ? "animations"
                     : (JJS.some(function (x) { return x.id === id; }) ? "jjs" : "sounds");
          location.href = target + ".html?q=" + encodeURIComponent(id);
        }
      });
    }

    // "/" focuses search
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || /input|textarea|select/i.test(document.activeElement.tagName)) return;
      var s = $("[data-lib-search]");
      if (!s) return;
      e.preventDefault();
      s.focus(); s.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
})();
