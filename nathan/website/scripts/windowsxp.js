// Windows XP Section Module
const WindowsXPSection = {
    WINDOWS_ICON_PATH: "./assets/windows/icons/",
    WINDOWS_IMAGE_PATH: "./assets/windows/images/",
    imageSize: 58,
    NUM_IMAGES: 132,
    LEFT_ICON_SPACING: 12,
    ICON_SAFE_ZONE: 0.05, // The percentage of safe space where images won't load
    frontZIndex: 1000,
    icon5: null,

    init() {
        document.addEventListener('sectionsLoaded', () => {
            this.createWindowsXPDesktop();
        });
    },

    createWindowsXPDesktop() {
        const container = document.getElementById("windows-xp");
        if (!container) return;

        // Ensure container has position and sizing
        container.style.position = "relative";
        container.style.width = "100vw";
        container.style.height = `${(9 / 16) * 100}vw`; // 16:9 aspect ratio
        container.style.maxHeight = "100vh";
        container.style.overflow = "hidden";
        container.style.backgroundColor = "#008080";

        // Add taskbar elements
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

        // Add live clock text overlay
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
            zIndex: "11", // Above the clock image
            pointerEvents: "none", // Let mouse go through
        });

        const updateClock = () => {
            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const isPM = hours >= 12;
            if (hours === 0) hours = 12;
            else if (hours > 12) hours -= 12;

            const formatted = `${hours}:${minutes.toString().padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
            clockText.textContent = formatted;
        }

        updateClock(); // Initial
        setInterval(updateClock, 60 * 1000); // Update every minute

        container.appendChild(clockText);

        // Add 7 icons along the left side
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

        // Defer image placement until layout is calculated
        requestAnimationFrame(() => {
            const rect = container.getBoundingClientRect();
            const maxX = rect.width - this.imageSize;
            const maxY = rect.height - this.imageSize - 40; // reserve for taskbar

            for (let i = 1; i <= this.NUM_IMAGES; i++) {
                const img = document.createElement("img");
                img.src = `${this.WINDOWS_IMAGE_PATH}image${i}.png`;
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

                this.enableDrag(img, container, this.icon5);
                container.appendChild(img);
            }
        });
    },

    enableDrag(img, container, icon5) {
        let isDragging = false;
        let startX = 0, startY = 0;
        let initialLeft = 0, initialTop = 0;

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
                const maxY = containerRect.height - img.offsetHeight - 40; // avoid taskbar

                let newLeft = Math.max(0, Math.min(maxX, initialLeft + dx));
                let newTop = Math.max(0, Math.min(maxY, initialTop + dy));

                img.style.left = `${newLeft}px`;
                img.style.top = `${newTop}px`;
            }

            const onMouseUp = () => {
                isDragging = false;
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);

                // Check if image center is inside icon5's bounds
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
                    img.remove(); // Unload the image
                }
            }

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        });
    }
};

// Initialize Windows XP section
WindowsXPSection.init();
