// Windows XP Section Module

const WINDOWS_SECRET_MESSAGE = "Fatal error: C:\\ABOVE.TABLE.EXE is not a table.";

const WindowsXPSection = {
    WINDOWS_ICON_PATH: "./assets/windows/icons/",
    WINDOWS_IMAGE_PATH: "./assets/windows/images/",
    imageSize: 58,
    NUM_IMAGES: 132,
    LEFT_ICON_SPACING: 12,
    ICON_SAFE_ZONE: 0.05,
    frontZIndex: 1000,
    icon5: null,
    deletedFiles: new Set(),

    // which images we care about deleting
    specialTargets: new Set(["image107.png", "image116.png", "image5.png"]),//, "image116.png", "image5.png"]),

    init() {
        document.addEventListener("sectionsLoaded", () => {
            this.createWindowsXPDesktop();
        });
    },

    createWindowsXPDesktop() {
        const container = document.getElementById("windows-xp");
        if (!container) return;

        container.style.position = "relative";
        container.style.width = "100vw";
        container.style.height = `${(9 / 16) * 100}vw`;
        container.style.maxHeight = "100vh";
        container.style.overflow = "hidden";
        container.style.backgroundColor = "#008080";

        // Taskbar
        const start = document.createElement("img");
        start.src = "./assets/windows/windows-taskbar-start.png";
        Object.assign(start.style, {
            position: "absolute",
            bottom: "0",
            left: "0",
            height: "40px",
            zIndex: "10",
        });

        const clock = document.createElement("img");
        clock.src = "./assets/windows/windows-taskbar-clock.png";
        Object.assign(clock.style, {
            position: "absolute",
            bottom: "0",
            right: "0",
            height: "40px",
            zIndex: "10",
        });

        const taskbar = document.createElement("img");
        taskbar.src = "./assets/windows/windows-taskbar-main.png";
        Object.assign(taskbar.style, {
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "100%",
            height: "40px",
            objectFit: "fill",
            zIndex: "5",
        });

        container.append(taskbar, start, clock);

        // Live clock text
        const clockText = document.createElement("div");
        Object.assign(clockText.style, {
            position: "absolute",
            bottom: "2px",
            right: "6px",
            height: "36px",
            lineHeight: "36px",
            fontFamily: "'Windows XP Tahoma', monospace",
            fontSize: "18px",
            color: "white",
            textAlign: "right",
            paddingRight: "20px",
            zIndex: "11",
            pointerEvents: "none",
        });

        const updateClock = () => {
            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const isPM = hours >= 12;
            if (hours === 0) hours = 12;
            else if (hours > 12) hours -= 12;
            clockText.textContent = `${hours}:${minutes
                .toString()
                .padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
        };
        updateClock();
        setInterval(updateClock, 60 * 1000);
        container.appendChild(clockText);

        // Left icons
        for (let i = 1; i <= 7; i++) {
            const icon = document.createElement("img");
            icon.src = `${this.WINDOWS_ICON_PATH}icon${i}.png`;
            Object.assign(icon.style, {
                position: "absolute",
                width: `${this.imageSize}px`,
                height: `${this.imageSize}px`,
                left: "12px",
                top: `${12 + (i - 1) * (this.imageSize + this.LEFT_ICON_SPACING)}px`,
                zIndex: "1",
                objectFit: "contain",
            });
            container.appendChild(icon);
            if (i === 5) this.icon5 = icon;
        }

        // Random icons
        requestAnimationFrame(() => {
            const rect = container.getBoundingClientRect();
            const maxX = rect.width - this.imageSize;
            const maxY = rect.height - this.imageSize - 40;

            for (let i = 1; i <= this.NUM_IMAGES; i++) {
                const img = document.createElement("img");
                const fileName = `image${i}.png`;
                img.src = `${this.WINDOWS_IMAGE_PATH}${fileName}`;
                Object.assign(img.style, {
                    position: "absolute",
                    width: `${this.imageSize}px`,
                    height: `${this.imageSize}px`,
                    objectFit: "contain",
                    zIndex: "2",
                    userSelect: "none",
                });

                const bias = this.ICON_SAFE_ZONE + Math.random() * (1 - this.ICON_SAFE_ZONE);
                const x = Math.min(maxX, Math.floor(bias * rect.width));
                const y = Math.floor(Math.random() * maxY);

                img.style.left = `${x}px`;
                img.style.top = `${y}px`;
                img.classList.add("windows-icon");
                img.dataset.filename = fileName;

                this.enableDrag(img, container, this.icon5);
                container.appendChild(img);
            }
        });
    },

    enableDrag(img, container, icon5) {
        let isDragging = false;
        let startX = 0,
            startY = 0;
        let initialLeft = 0,
            initialTop = 0;

        img.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isDragging = true;
            img.style.zIndex = this.frontZIndex.toString();
            this.frontZIndex++;

            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(img.style.left, 10);
            initialTop = parseInt(img.style.top, 10);

            const onMouseMove = (eMove) => {
                if (!isDragging) return;
                const dx = eMove.clientX - startX;
                const dy = eMove.clientY - startY;

                const containerRect = container.getBoundingClientRect();
                const maxX = containerRect.width - img.offsetWidth;
                const maxY = containerRect.height - img.offsetHeight - 40;

                let newLeft = Math.max(0, Math.min(maxX, initialLeft + dx));
                let newTop = Math.max(0, Math.min(maxY, initialTop + dy));

                img.style.left = `${newLeft}px`;
                img.style.top = `${newTop}px`;
            };

            const onMouseUp = () => {
                isDragging = false;
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);

                const imgRect = img.getBoundingClientRect();
                const imgCenterX = imgRect.left + imgRect.width / 2;
                const imgCenterY = imgRect.top + imgRect.height / 2;

                const icon5Rect = icon5.getBoundingClientRect();
                const inBounds =
                    imgCenterX >= icon5Rect.left &&
                    imgCenterX <= icon5Rect.right &&
                    imgCenterY >= icon5Rect.top &&
                    imgCenterY <= icon5Rect.bottom;

                if (inBounds) {
                    const fname = img.dataset.filename;
                    img.remove();
                    if (this.specialTargets.has(fname)) {
                        this.deletedFiles.add(fname);
                        if (this.deletedFiles.size === this.specialTargets.size) {
                            this.showOverlay(container);
                        }
                    }
                }
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        });
    },

    showOverlay(container) {
        // Base overlay wrapper
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",  // centers it
            zIndex: "9999",
            textAlign: "center",
        });

        // Relative box that tracks the HUD image size
        const hudWrapper = document.createElement("div");
        Object.assign(hudWrapper.style, {
            position: "relative",
            display: "inline-block",
            width: "25vw",       // <--- scale everything here
            maxWidth: "400px",   // optional hard cap in px
        });

        // HUD background image
        const bg = document.createElement("img");
        bg.src = "./assets/windows/error-message/windows-error-hud.png";
        Object.assign(bg.style, {
            display: "block",
            width: "100%",       // makes wrapper size = image size
            height: "auto",
        });

        // Text overlay
        const text = document.createElement("div");
        text.textContent = WINDOWS_SECRET_MESSAGE;
        Object.assign(text.style, {
            position: "absolute",
            top: "37%",
            left: "60%",
            transform: "translateX(-50%)",
            fontFamily: "'Windows XP Tahoma', monospace",
            fontSize: "1.3vw",     // scales with wrapper width
            lineHeight: "1.0",
            color: "#131313",
            fontWeight: "bold",
            textAlign: "center",
            width: "62%",
            maxWidth: "62%",
            whiteSpace: "normal",
            wordWrap: "break-word",
        });

        // X button
        const xBtn = document.createElement("img");
        xBtn.src = "./assets/windows/error-message/windows-error-x.png";
        Object.assign(xBtn.style, {
            position: "absolute",
            top: "6%",
            right: "3%",
            width: "10%",   // scales with HUD
            height: "auto",
        });
        xBtn.addEventListener("mouseenter", () => (xBtn.style.filter = "brightness(85%)"));
        xBtn.addEventListener("mouseleave", () => (xBtn.style.filter = "brightness(100%)"));

        // OK button
        const okBtn = document.createElement("img");
        okBtn.src = "./assets/windows/error-message/windows-error-ok.png";
        Object.assign(okBtn.style, {
            position: "absolute",
            bottom: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "35%",   // scales with HUD
            height: "auto",
        });
        okBtn.addEventListener("mouseenter", () => (okBtn.style.filter = "brightness(85%)"));
        okBtn.addEventListener("mouseleave", () => (okBtn.style.filter = "brightness(100%)"));

        const dismiss = () => overlay.remove();
        xBtn.addEventListener("click", dismiss);
        okBtn.addEventListener("click", dismiss);

        hudWrapper.append(bg, text, xBtn, okBtn);
        overlay.appendChild(hudWrapper);
        container.appendChild(overlay);
    }


};

WindowsXPSection.init();
