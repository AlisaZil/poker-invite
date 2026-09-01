/* ============================================================
   Poker Night — interaction
   ============================================================ */
(function () {
  "use strict";

  /* Marks the document as scripted, which is what gates the
     scroll-reveal styles — without JS the page renders as normal. */
  document.documentElement.classList.add("js");

  var form    = document.getElementById("rsvp-form");
  var note    = document.getElementById("form-note");
  var choices = Array.prototype.slice.call(document.querySelectorAll(".choice"));
  var cue     = document.querySelector(".scroll-cue");

  /* ---------- I'M ALL IN / I'LL FOLD ---------- */

  function select(button) {
    choices.forEach(function (btn) {
      var on = btn === button;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-checked", String(on));
    });
  }

  /* Re-adding the class after a forced reflow lets the bounce
     replay when the same button is clicked again. */
  function bump(el) {
    el.classList.remove("is-bumped");
    void el.offsetWidth;
    el.classList.add("is-bumped");
  }

  choices.forEach(function (btn) {
    btn.addEventListener("click", function () {
      select(btn);
      bump(btn);
      say("");
    });


    /* arrow keys move between the two options, as a radiogroup should */
    btn.addEventListener("keydown", function (e) {
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].indexOf(e.key) === -1) return;
      e.preventDefault();
      var i    = choices.indexOf(btn);
      var step = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : -1;
      var next = choices[(i + step + choices.length) % choices.length];
      select(next);
      next.focus();
    });
  });

  function chosen() {
    var active = document.querySelector(".choice.is-active");
    return active ? active.dataset.value : "all-in";
  }

  /* ---------- messages ---------- */

  var rsvpPanel = document.getElementById("panel-3");

  function say(text, isError) {
    note.textContent = text;
    note.classList.toggle("is-error", Boolean(isError));
    /* on wide screens the note stands where the deadline is */
    if (rsvpPanel) rsvpPanel.classList.toggle("is-messaging", text !== "");
  }

  /* ---------- validation + submit ---------- */

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var submit       = form.querySelector(".submit");
  var SUBMIT_LABEL = submit.textContent;

  function confirmOnButton() {
    submit.textContent = "Seat saved \u2660";
    submit.classList.remove("is-sent");
    void submit.offsetWidth;            /* restart press + sweep */
    submit.classList.add("is-sent");

    form.classList.remove("is-celebrating");
    void form.offsetWidth;
    form.classList.add("is-celebrating");
  }

  function resetButton() {
    if (submit.textContent === SUBMIT_LABEL) return;
    submit.textContent = SUBMIT_LABEL;
    submit.classList.remove("is-sent");
  }

  form.addEventListener("animationend", function (e) {
    if (e.target === form) form.classList.remove("is-celebrating");
  });

  function flag(input, bad) {
    input.setAttribute("aria-invalid", String(bad));
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name    = form.elements.name;
    var email   = form.elements.email;
    var players = form.elements.players;

    var nameBad    = name.value.trim() === "";
    var emailBad   = !EMAIL.test(email.value.trim());
    var count      = parseInt(players.value, 10);
    var playersBad = players.value !== "" && (isNaN(count) || count < 1 || count > 10);

    flag(name, nameBad);
    flag(email, emailBad);
    flag(players, playersBad);

    if (nameBad)    { say("We need a name for the seat.", true); name.focus();    return; }
    if (emailBad)   { say("That email won't reach you.", true);  email.focus();   return; }
    if (playersBad) { say("Between 1 and 10 players.", true);    players.focus(); return; }

    var rsvp = {
      name:    name.value.trim(),
      email:   email.value.trim(),
      players: players.value === "" ? 1 : count,
      status:  chosen()
    };

    /* No backend here — hand the payload off and confirm to the guest. */
    console.log("RSVP", rsvp);

    if (rsvp.status === "fold") {
      say("Noted — " + rsvp.name.split(" ")[0] + " folds. We'll deal you in next time.");
    } else {
      say("You're in, " + rsvp.name.split(" ")[0] + ". Seat" +
          (rsvp.players > 1 ? "s" : "") + " held until 8:00 PM.");
    }

    confirmOnButton();

    form.reset();
    [name, email, players].forEach(function (i) { flag(i, false); });
  });

  /* clear the invalid mark as soon as the guest starts fixing it */
  form.addEventListener("input", function (e) {
    if (!e.target.matches(".field__input")) return;
    flag(e.target, false);
    resetButton();
  });

  /* ---------- reveal the details when they scroll into view ---------- */

  var revealing = [
    document.getElementById("panel-2"),
    document.getElementById("panel-3")
  ].filter(Boolean);

  if (!("IntersectionObserver" in window)) {
    revealing.forEach(function (el) { el.classList.add("is-revealed"); });
  } else {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        reveal.unobserve(entry.target);   /* each one only plays once */
      });
    }, { threshold: 0.35 });

    revealing.forEach(function (el) { reveal.observe(el); });
  }

  /* ---------- chevron ---------- */

  if (cue) {
    cue.addEventListener("click", function () {
      var target = document.getElementById("panel-2");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();
