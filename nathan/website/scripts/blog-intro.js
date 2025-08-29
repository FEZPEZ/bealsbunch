(function() {
    const blogIntroText =
        "Welcome 2 my funny blog lol! This is my page where i blog about exciting stuff that's pretty cool like, pizza and tinker toys, and other stuff! Plz reply with your fav animals!!!";

    const blogIntroBox = document.getElementById("blog-intro");

    const blogIntroCodes = [
        "us too",
        "two pots",
        "worst rows",
        "spot rots",
        "pro sports",
        "soupy soup",
        "tux turt",
        "spouty spur"

    ];

    const blogIntroMessages = [
        "you unlock mcqueen by clicking on his number lots of times",
        "i have the bomb guys from kirby so i deleted them already",
        "of course you got beat by a plant, you picked a trash character, but I'll play as the grandpa next time",
        "i can't figure out what kirby is looking at",
        "i don't think the hobbit likes his name to be said out loud",
        "i bet woody could have flown out the window, would've saved a lot of time",
        "i still think racoons can time travel",
        "i think it was under the table the whole time"
    ];

    let blogIntroParagraph, blogIntroResetTxt, blogIntroTimeMachine, blogIntroSecretMsg;
    let blogIntroActiveCodeIndex = null;
    let blogIntroHistory = [];
    let blogIntroDeleting = false;
    let blogIntroPending = [];

    let goToBlog;
    let unlockTimerStarted = false;

    // Apply progress theme on load
    const storedProgress = parseInt(localStorage.getItem("clueProgress") || "0", 10);
    document.documentElement.classList.add("progress-" + storedProgress);

    window.addEventListener("DOMContentLoaded", () => {
        document.body.classList.add("ready");
    });

    function renderContent(text = blogIntroText) {
        blogIntroBox.innerHTML = "";

        const blogIntroHeader = document.createElement("div");
        blogIntroHeader.className = "blogIntroHeader";
        blogIntroHeader.textContent = "!!! plz dont copy this text !!!";
        blogIntroBox.appendChild(blogIntroHeader);

        blogIntroParagraph = document.createElement("p");
        text.split("").forEach(ch => {
            const span = document.createElement("span");
            span.textContent = ch;
            span.className = "blogIntroChar";
            blogIntroParagraph.appendChild(span);
        });
        blogIntroBox.appendChild(blogIntroParagraph);

        const controls = document.createElement("div");
        controls.className = "blogIntroControls";

        blogIntroResetTxt = document.createElement("div");
        blogIntroResetTxt.className = "blogIntroButton";
        blogIntroResetTxt.textContent = "did you get it??";

        blogIntroTimeMachine = document.createElement("div");
        blogIntroTimeMachine.className = "blogIntroButton";
        blogIntroTimeMachine.textContent = "time machine";

        if (!goToBlog) {
            goToBlog = document.createElement("div");
            goToBlog.className = "blogIntroButton";
            goToBlog.textContent = "";
            goToBlog.style.pointerEvents = "none";
            goToBlog.style.opacity = "0.5";

            goToBlog.addEventListener("click", () => {
                if (goToBlog.style.pointerEvents === "none") return;
                document.getElementById("intro-overlay").style.display = "none";
                document.body.style.overflow = "auto";
            });

            if (!unlockTimerStarted) {
                unlockTimerStarted = true;
                setTimeout(() => {
                    goToBlog.style.pointerEvents = "auto";
                    goToBlog.style.opacity = "1";
                    goToBlog.textContent = "go to blog";
                }, 3000);
            }
        }

        controls.appendChild(blogIntroResetTxt);
        controls.appendChild(blogIntroTimeMachine);
        controls.appendChild(goToBlog);
        blogIntroBox.appendChild(controls);

        blogIntroSecretMsg = document.createElement("div");
        blogIntroSecretMsg.className = "blogIntroSecret";
        blogIntroBox.appendChild(blogIntroSecretMsg);

        blogIntroActiveCodeIndex = null;
        attachEvents();
    }

    function attachEvents() {
        blogIntroParagraph.addEventListener("mousedown", e => {
            if (e.target.classList.contains("blogIntroChar")) {
                blogIntroDeleting = true;
                blogIntroPending = [];
                e.target.classList.add("blogIntroPendingDelete");
                blogIntroPending.push(e.target);
            }
        });
        blogIntroParagraph.addEventListener("mouseover", e => {
            if (blogIntroDeleting && e.target.classList.contains("blogIntroChar")) {
                if (!blogIntroPending.includes(e.target)) {
                    e.target.classList.add("blogIntroPendingDelete");
                    blogIntroPending.push(e.target);
                }
            }
        });
        document.addEventListener("mouseup", () => {
            if (blogIntroDeleting) {
                saveHistory();
                blogIntroPending.forEach(span => span.remove());
                blogIntroDeleting = false;
                blogIntroPending = [];
                checkCodes();
            }
        });
        blogIntroResetTxt.addEventListener("click", () => {
            if (blogIntroActiveCodeIndex !== null) {
                blogIntroSecretMsg.textContent = blogIntroMessages[blogIntroActiveCodeIndex];
                updateProgress(blogIntroActiveCodeIndex+1); //add one to move to the NEXT style
            } else {
                saveHistory();
                renderContent();
            }
        });
        blogIntroTimeMachine.addEventListener("click", () => {
            if (blogIntroHistory.length > 0) {
                const prev = blogIntroHistory.pop();
                restoreState(prev);
            }
        });
    }

    function updateProgress(newIndex) {
        const current = parseInt(localStorage.getItem("clueProgress") || "0", 10);
        if (newIndex > current) {
            localStorage.setItem("clueProgress", newIndex);
            // reload to apply darker theme immediately
            //location.reload();
        }
    }

    function saveHistory() {
        const snapshot = [...blogIntroParagraph.querySelectorAll(".blogIntroChar")]
            .map(span => span.textContent)
            .join("");
        blogIntroHistory.push(snapshot);
        if (blogIntroHistory.length > 3) blogIntroHistory.shift();
    }

    function restoreState(text) {
        renderContent(text);
        checkCodes();
    }

    function checkCodes() {
        const currentText = [...blogIntroParagraph.querySelectorAll(".blogIntroChar")]
            .map(span => span.textContent)
            .join("")
            .toLowerCase();

        let foundIndex = null;
        blogIntroCodes.forEach((code, idx) => {
            if (currentText.includes(code)) foundIndex = idx;
        });

        [...blogIntroParagraph.querySelectorAll(".blogIntroChar")].forEach(span => {
            span.classList.remove("blogIntroHighlight");
        });

        if (foundIndex !== null) {
            highlightSubstring(currentText, blogIntroCodes[foundIndex]);
            blogIntroActiveCodeIndex = foundIndex;
        } else {
            blogIntroActiveCodeIndex = null;
        }
    }

    function highlightSubstring(text, code) {
        const idx = text.indexOf(code);
        if (idx === -1) return;
        const spans = [...blogIntroParagraph.querySelectorAll(".blogIntroChar")];
        for (let i = idx; i < idx + code.length; i++) {
            spans[i].classList.add("blogIntroHighlight");
        }
    }

    renderContent();
})();