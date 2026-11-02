/* Prism CRT preference boot — generated from design/tokens.json by tools/build-tokens.mjs. Do not edit by hand. Rows: src/scripts/prefs-table.ts. */
(function () {
  var root = document.documentElement;
  var rows = [{"key":"theme","storageKey":"portfolio-theme","tier":"local","values":["prism","paper","crt","signal"],"fallback":null,"attr":"data-theme","states":{"prism":{"attr":"prism","classes":[]},"paper":{"attr":"paper","classes":[]},"crt":{"attr":"crt","classes":[]},"signal":{"attr":"signal","classes":[]}}},{"key":"motion","storageKey":"portfolio-motion","tier":"local","values":["full","reduced"],"fallback":"full","attr":"data-motion","states":{"full":{"attr":null,"classes":["js-motion"]},"reduced":{"attr":"reduced","classes":[]}}},{"key":"sound","storageKey":"portfolio-sound","tier":"local","values":["on","off"],"fallback":"off","attr":"data-sound","states":{"on":{"attr":"on","classes":[]},"off":{"attr":null,"classes":[]}}},{"key":"crt","storageKey":"portfolio-crt","tier":"session","values":["on","off"],"fallback":"on","attr":"data-crt","states":{"on":{"attr":null,"classes":[]},"off":{"attr":"off","classes":[]}}},{"key":"notes","storageKey":"portfolio-notes","tier":"local","values":["explore","page"],"fallback":"explore","attr":null,"states":{"explore":{"attr":null,"classes":[]},"page":{"attr":null,"classes":[]}}}];
  var themeBg = {"prism":"#1a1713","paper":"#f4ede1","crt":"#070b09","signal":"#0d0a14"};
  function stored(row) {
    try {
      return (row.tier === 'session' ? sessionStorage : localStorage).getItem(row.storageKey);
    } catch (e) {
      return null;
    }
  }
  // The Signal unlock: the same rule as parseReward in src/scripts/signal-reward.ts.
  function signalUnlocked() {
    try {
      var raw = localStorage.getItem("portfolio-signal");
      if (raw) {
        var reward = JSON.parse(raw);
        if (reward && Number(reward.best) > 0) return true;
      }
      return Number(localStorage.getItem("portfolio-tg-best")) > 0;
    } catch (e) {
      return false;
    }
  }
  var unlocked = signalUnlocked();
  if (unlocked) root.classList.add("has-signal");
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var value = stored(row);
    if (value === null || row.values.indexOf(value) < 0) value = row.fallback;
    if (row.key === 'theme' && value === "signal" && !unlocked) value = row.fallback;
    var state = value === null ? null : row.states[value];
    var keep = state ? state.classes : [];
    for (var name in row.states) {
      var classes = row.states[name].classes;
      for (var c = 0; c < classes.length; c++) if (keep.indexOf(classes[c]) < 0) root.classList.remove(classes[c]);
    }
    for (var k = 0; k < keep.length; k++) root.classList.add(keep[k]);
    if (row.attr) {
      if (state && state.attr !== null) root.setAttribute(row.attr, state.attr);
      else root.removeAttribute(row.attr);
    }
  }
  var theme = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? "paper" : "prism");
  var meta = document.getElementById('theme-color');
  if (meta) meta.setAttribute('content', themeBg[theme] || themeBg["prism"]);
})();
