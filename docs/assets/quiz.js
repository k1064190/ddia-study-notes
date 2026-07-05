/*
 * Quiz engine. Each chapter page defines window.QUIZ_DATA = [
 *   { type: "mcq",   q: "...", options: ["...", ...], answer: 1, expl: "..." }   // answer = index
 *   { type: "ox",    q: "...", answer: true|false,     expl: "..." }
 *   { type: "short", q: "...", answers: ["정답", "동의어"], expl: "..." }        // 부분 일치 허용
 * ]
 * and includes <div id="quiz"></div><script src="assets/quiz.js"></script>.
 */
(function () {
  var data = window.QUIZ_DATA || [];
  var root = document.getElementById("quiz");
  if (!root || !data.length) return;

  var solved = 0,
    correctCount = 0;
  var scoreEl;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function showExpl(qBox, ok, expl) {
    var e = qBox.querySelector(".quiz-expl");
    e.innerHTML =
      '<span class="verdict ' +
      (ok ? "ok" : "no") +
      '">' +
      (ok ? "정답! " : "오답. ") +
      "</span>" +
      esc(expl);
    e.classList.add("show");
    solved++;
    if (ok) correctCount++;
    scoreEl.textContent =
      "점수: " +
      correctCount +
      " / " +
      solved +
      " (전체 " +
      data.length +
      "문제)";
  }

  function norm(s) {
    return s.toLowerCase().replace(/[\s\-_.,'"()]/g, "");
  }

  data.forEach(function (item, i) {
    var box = document.createElement("div");
    box.className = "quiz-q";
    var typeLabel =
      item.type === "mcq" ? "객관식" : item.type === "ox" ? "O/X" : "단답형";
    box.innerHTML =
      '<div class="q-text">Q' +
      (i + 1) +
      ". " +
      esc(item.q) +
      '<span class="q-type">[' +
      typeLabel +
      "]</span></div>";

    if (item.type === "mcq" || item.type === "ox") {
      var opts = item.type === "ox" ? ["O (참)", "X (거짓)"] : item.options;
      var answerIdx = item.type === "ox" ? (item.answer ? 0 : 1) : item.answer;
      var wrap = document.createElement("div");
      wrap.className = "quiz-options";
      opts.forEach(function (opt, oi) {
        var b = document.createElement("button");
        b.innerHTML =
          (item.type === "mcq" ? "(" + "ABCD".charAt(oi) + ") " : "") +
          esc(opt);
        b.addEventListener("click", function () {
          wrap.querySelectorAll("button").forEach(function (x) {
            x.disabled = true;
          });
          if (oi === answerIdx) {
            b.classList.add("correct");
          } else {
            b.classList.add("wrong");
            wrap.children[answerIdx].classList.add("correct");
          }
          showExpl(box, oi === answerIdx, item.expl);
        });
        wrap.appendChild(b);
      });
      box.appendChild(wrap);
    } else {
      var wrap2 = document.createElement("div");
      wrap2.className = "quiz-short";
      var input = document.createElement("input");
      input.placeholder = "답 입력…";
      var btn = document.createElement("button");
      btn.textContent = "확인";
      function grade() {
        if (btn.disabled) return;
        btn.disabled = true;
        input.disabled = true;
        var v = norm(input.value);
        var ok = item.answers.some(function (a) {
          var na = norm(a);
          return (
            v && (v === na || v.indexOf(na) !== -1 || na.indexOf(v) !== -1)
          );
        });
        input.style.borderColor = ok ? "var(--correct)" : "var(--wrong)";
        showExpl(box, ok, "정답: " + item.answers[0] + " — " + item.expl);
      }
      btn.addEventListener("click", grade);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") grade();
      });
      wrap2.appendChild(input);
      wrap2.appendChild(btn);
      box.appendChild(wrap2);
    }

    var expl = document.createElement("div");
    expl.className = "quiz-expl";
    box.appendChild(expl);
    root.appendChild(box);
  });

  var scoreWrap = document.createElement("div");
  scoreWrap.className = "quiz-score";
  scoreWrap.innerHTML = '<div class="inner"></div>';
  scoreEl = scoreWrap.querySelector(".inner");
  scoreEl.textContent =
    "문제를 풀면 점수가 표시됩니다 (전체 " + data.length + "문제)";
  root.appendChild(scoreWrap);
})();
