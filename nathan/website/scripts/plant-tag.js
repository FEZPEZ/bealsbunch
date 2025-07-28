// Plant Tag Section Module
const PlantTagSection = {
    IMAGE_DIR: "../assets/macore/plant-tags",
    totalImages: 17,
    totalFrames: 7,
    imageSpacing: 10, // px between images
    divHeight: 300, // px container height
    targetFPS: 30,
    scrollSpeed: 2, // px per frame
    lastImage: [1, 1, 1],
    container: null,
    viewportWidth: 0,
    activeItems: [],
    lastTimestamp: 0,

    init() {
        document.addEventListener('sectionsLoaded', () => {
            this.setupSection();
        });
    },

    setupSection() {
        this.container = document.getElementById('scroll-track');
        if (!this.container) return;
        
        this.viewportWidth = window.innerWidth;
        this.container.style.height = this.divHeight + 'px';

        // Start animation after initial spawn
        this.spawnItem().then(() => {
            this.animate();
        });

        // Handle window resize to update viewportWidth
        window.addEventListener('resize', () => {
            this.viewportWidth = window.innerWidth;
        });
    },

    // Helper to get random integer between 1 and max inclusive
    randInt(max) {
        return Math.floor(Math.random() * max) + 1;
    },

    // Create a scroll item (image + frame overlay)
    async createScrollItem() {
        let imgNum = this.randInt(this.totalImages);
        // Ensure we don't repeat the last few
        while (imgNum === this.lastImage[0] || imgNum === this.lastImage[1] || imgNum === this.lastImage[2]) {
            imgNum = (imgNum + 1) % this.totalImages;
        }
        this.lastImage[2] = this.lastImage[1];
        this.lastImage[1] = this.lastImage[0];
        this.lastImage[0] = imgNum;
        // Reduce odds of getting the funny guy
        if (imgNum === 1 && this.randInt(3) > 1) {
            imgNum = this.randInt(this.totalImages);
        }
        const frameNum = this.randInt(this.totalFrames);

        // Create container div
        const item = document.createElement('div');
        item.className = 'scroll-item';

        // Image element
        const img = document.createElement('img');
        img.src = `${this.IMAGE_DIR}/image${imgNum}.webp`;
        img.draggable = false;

        // Frame element
        const frame = document.createElement('img');
        frame.className = 'frame';
        frame.src = `${this.IMAGE_DIR}/frame${frameNum}.webp`;
        frame.draggable = false;

        // Append images to item container
        item.appendChild(img);
        item.appendChild(frame);

        // Initially place item just offscreen to the right
        item.style.left = `${this.viewportWidth}px`;
        item.style.top = '0px';
        item.style.height = this.divHeight + 'px';

        // Wait for image to load to get width for spacing calculations
        return new Promise((resolve) => {
            img.onload = () => {
                // Set item width based on image width scaled to divHeight
                const scale = this.divHeight / img.naturalHeight;
                const width = img.naturalWidth * scale;

                img.style.width = width + 'px';
                img.style.height = this.divHeight + 'px';
                frame.style.width = width + 'px';
                frame.style.height = this.divHeight + 'px';

                item.style.width = width + 'px';

                resolve({item, width});
            };
            img.onerror = () => {
                // If image fails to load, resolve with null so it can skip spawning this item
                resolve(null);
            };
        });
    },

    // Spawn and add a new scroll item to container and activeItems
    async spawnItem() {
        const scrollItem = await this.createScrollItem();
        if (!scrollItem) return; // failed to load image, skip

        // Position item just to the right of the last spawned item, spaced by imageSpacing
        let startX = this.viewportWidth;

        if (this.activeItems.length > 0) {
            const last = this.activeItems[this.activeItems.length - 1];
            startX = last.x + last.width + this.imageSpacing;
        }

        scrollItem.item.style.left = `${startX}px`;
        this.container.appendChild(scrollItem.item);
        scrollItem.x = startX;
        this.activeItems.push(scrollItem);
    },

    animate(timestamp = 0) {
        if (timestamp - this.lastTimestamp > 1000 / this.targetFPS) {
            this.lastTimestamp = timestamp;

            for (let i = this.activeItems.length - 1; i >= 0; i--) {
                const it = this.activeItems[i];
                it.x -= this.scrollSpeed;
                it.item.style.left = it.x + 'px';

                if (it.x + it.width < 0) {
                    this.container.removeChild(it.item);
                    this.activeItems.splice(i, 1);
                }
            }

            if (this.activeItems.length === 0) {
                this.spawnItem();
            } else {
                const last = this.activeItems[this.activeItems.length - 1];
                if (last.x + last.width + this.imageSpacing < this.viewportWidth) {
                    this.spawnItem();
                }
            }
        }
        requestAnimationFrame((ts) => this.animate(ts));
    }
};

// Initialize Plant Tag section
PlantTagSection.init();
