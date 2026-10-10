/* Blox ID Vault — front-end logic */
(function () {
  "use strict";

  var FAV_KEY = "rbxid_favourites";

  var state = {
    tab: "animations",
    query: "",
    category: "All",
    favOnly: false,
  };

  var favourites = loadFavourites();

  // ---------- helpers ----------
  function $(sel) { return document.querySelector(sel); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function loadFavourites() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveFavourites() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favourites)); } catch (e) {}
  }

  function isFav(key) { return favourites.indexOf(key) !== -1; }

  function toggleFav(key) {
    var i = favourites.indexOf(key);
    if (i === -1) favourites.push(key); else favourites.splice(i, 1);
    saveFavourites();
  }

  function currentData() {
    return state.tab === "animations" ? ANIMATIONS : SOUNDS;
  }

  function itemKey(item) { return state.tab + ":" + item.id + ":" + item.name; }

  function categories(data) {
    var seen = {};
    var out = [];
    data.forEach(function (d) {
      if (!seen[d.category]) { seen[d.category] = true; out.push(d.category); }
    });
    return out;
  }

  function matches(item, q) {
    if (!q) return true;
    var hay = (item.name + " " + item.id + " " + item.category + " " + (item.tags || []).join(" ")).toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  // ---------- toast ----------
  var toastTimer = null;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { el.hidden = true; }, 220);
    }, 1600);
  }

  // ---------- clipboard ----------
  function copyId(id, label) {
    var text = String(id);
    function done() { toast("Copied " + (label ? label + " — " : "") + text); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text); done();
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  // ---------- rendering ----------
  function renderChips() {
    var data = currentData();
    var cats = ["All"].concat(categories(data));
    var html = cats.map(function (c) {
      var active = c === state.category ? " active" : "";
      return '<button class="chip' + active + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");
    $("#chips").innerHTML = html;
  }

  function renderResults() {
    var data = currentData();
    var q = state.query.trim().toLowerCase();
    var rows = data.filter(function (item) {
      if (state.category !== "All" && item.category !== state.category) return false;
      if (state.favOnly && !isFav(itemKey(item))) return false;
      return matches(item, q);
    });

    var results = $("#results");
    var empty = $("#empty");

    if (!rows.length) {
      results.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    results.innerHTML = rows.map(function (item) {
      var key = itemKey(item);
      var fav = isFav(key) ? " on" : "";
      var tags = (item.tags || []).slice(0, 4).map(function (t) {
        return '<span class="tag">' + esc(t) + "</span>";
      }).join("");
      var lib = "https://www.roblox.com/library/" + item.id;
      var store = "https://create.roblox.com/store/asset/" + item.id;
      return (
        '<article class="card">' +
          '<div class="card-top">' +
            '<div>' +
              '<div class="card-name">' + esc(item.name) + "</div>" +
              '<div class="card-cat">' + esc(item.category) + "</div>" +
            "</div>" +
            '<button class="fav-btn' + fav + '" data-fav="' + esc(key) + '" title="Favourite" aria-label="Favourite">\u2605</button>' +
          "</div>" +
          '<div class="id-row">' +
            '<button class="id-pill" data-copy="' + esc(item.id) + '" data-label="' + esc(item.name) + '" title="Click to copy">' + esc(item.id) + "</button>" +
            '<button class="copy-btn" data-copy="' + esc(item.id) + '" data-label="' + esc(item.name) + '">Copy</button>' +
          "</div>" +
          (tags ? '<div class="card-tags">' + tags + "</div>" : "") +
          '<div class="card-links">' +
            '<a href="' + lib + '" target="_blank" rel="noopener">Library</a>' +
            '<a href="' + store + '" target="_blank" rel="noopener">Creator Store</a>' +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  function renderCounts() {
    $("#count-animations").textContent = "(" + ANIMATIONS.length + ")";
    $("#count-sounds").textContent = "(" + SOUNDS.length + ")";
  }

  function renderAll() {
    renderChips();
    renderResults();
  }

  // ---------- extractor ----------
  function extractId(raw) {
    if (!raw) return null;
    // grab the longest run of digits (asset IDs are long; avoids grabbing random numbers)
    var runs = String(raw).match(/\d{3,}/g);
    if (!runs) return null;
    var best = runs[0];
    runs.forEach(function (r) { if (r.length > best.length) best = r; });
    return best;
  }

  function guessType(id) {
    // heuristics only — IDs are not self-describing
    var animIds = {};
    ANIMATIONS.forEach(function (a) { animIds[a.id] = a.name; });
    var sndIds = {};
    SOUNDS.forEach(function (s) { sndIds[s.id] = s.name; });
    if (animIds[id]) return { type: "Animation", name: animIds[id] };
    if (sndIds[id]) return { type: "Sound / audio", name: sndIds[id] };
    var n = Number(id);
    if (n >= 500000000) return { type: "Unknown (likely an audio or animation asset)", name: null };
    return { type: "Unknown", name: null };
  }

  function runExtract() {
    var raw = $("#extract-input").value;
    var out = $("#extract-out");
    var id = extractId(raw);
    if (!id) {
      out.hidden = false;
      out.innerHTML = '<p class="muted">No numeric ID found. Paste a Roblox link, an <code>rbxassetid://</code> string, or the number itself.</p>';
      return;
    }
    var guess = guessType(id);
    var lib = "https://www.roblox.com/library/" + id;
    var store = "https://create.roblox.com/store/asset/" + id;
    out.hidden = false;
    out.innerHTML =
      '<div class="muted small">Detected asset ID</div>' +
      '<div class="big-id">' + esc(id) + "</div>" +
      '<div class="muted small">Likely type: <strong>' + esc(guess.type) + "</strong>" +
        (guess.name ? " — matches <strong>" + esc(guess.name) + "</strong> in the vault" : "") + "</div>" +
      '<div class="extract-actions" style="margin-top:14px">' +
        '<button class="btn btn-primary" data-copy="' + esc(id) + '" data-label="asset">Copy ID</button>' +
        '<button class="btn btn-ghost" id="search-this">Search this ID in the vault</button>' +
        '<a class="btn btn-ghost" href="' + store + '" target="_blank" rel="noopener">Creator Store</a>' +
        '<a class="btn btn-ghost" href="' + lib + '" target="_blank" rel="noopener">Library</a>' +
      "</div>";
  }

  // ---------- events ----------
  function bind() {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        state.tab = t.getAttribute("data-tab");
        state.category = "All";
        document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        renderAll();
      });
    });

    $("#search").addEventListener("input", function (e) {
      state.query = e.target.value;
      renderResults();
    });

    $("#fav-toggle").addEventListener("click", function () {
      state.favOnly = !state.favOnly;
      this.classList.toggle("active", state.favOnly);
      renderResults();
    });

    // delegate clicks
    document.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (chip) {
        state.category = chip.getAttribute("data-cat");
        renderChips();
        renderResults();
        return;
      }
      var copyEl = e.target.closest("[data-copy]");
      if (copyEl) {
        copyId(copyEl.getAttribute("data-copy"), copyEl.getAttribute("data-label"));
        if (copyEl.classList.contains("copy-btn")) {
          copyEl.classList.add("done");
          var btn = copyEl;
          setTimeout(function () { btn.classList.remove("done"); }, 1200);
        }
        return;
      }
      var favEl = e.target.closest("[data-fav]");
      if (favEl) {
        var key = favEl.getAttribute("data-fav");
        toggleFav(key);
        favEl.classList.toggle("on", isFav(key));
        if (state.favOnly) renderResults();
        return;
      }
      if (e.target.id === "search-this") {
        var id = extractId($("#extract-input").value);
        if (id) {
          state.tab = "animations";
          state.category = "All";
          state.query = id;
          $("#search").value = id;
          document.querySelectorAll(".tab").forEach(function (x) {
            x.classList.toggle("active", x.getAttribute("data-tab") === "animations");
          });
          renderAll();
          // also check sounds
          var inAnim = ANIMATIONS.some(function (a) { return a.id === id; });
          if (!inAnim) {
            state.tab = "sounds";
            document.querySelectorAll(".tab").forEach(function (x) {
              x.classList.toggle("active", x.getAttribute("data-tab") === "sounds");
            });
            renderAll();
          }
          document.getElementById("library").scrollIntoView({ behavior: "smooth" });
        }
      }
    });

    $("#extract-btn").addEventListener("click", runExtract);
    $("#extract-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") runExtract();
    });
  }

  // ---------- init ----------
  document.addEventListener("DOMContentLoaded", function () {
    renderCounts();
    renderAll();
    bind();
  });
})();
