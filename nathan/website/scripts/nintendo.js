// Nintendo Section Module
const NintendoSection = {
    // Amiibo data
    amiiboWishList: [
        'Inkling', 'Ridley', 'Wolf', 'King K. Rool', 'Ice Climbers',
        'Piranha Plant', 'Ken', 'Young Link', 'Mario', 'Mario',
        'Mario', 'Mario', 'Mario', 'Mario', 'Daisy',
        'Pokémon Trainer', 'Pichu', 'Isabelle', 'Ivysaur', 'Squirtle',
        'Simon Belmont', 'Richter Belmont', 'Snake', 'Incineroar', 'Chrom',
        'Joker', 'The Sun', 'Red Mario', 'Hero', 'Banjo Kazooie',
        'Sparky Sparky Boom Man', 'Byleth', 'Min Min', 'Steve', 'Donkey Kong',
        'Kirby Air Ride', 'Mythra', 'Sephiroth', 'Kazuya', 'Sora From Kingdom Hearts'
    ],

    // CD collection data
    cdCollection: [
        { id: 1, caption: 'rare' },
        { id: 2, caption: 'japan only!' },
        { id: 3, caption: 'rare' },
        { id: 4, caption: 'bundle exclusive' },
        { id: 5, caption: 'N/A' },
        { id: 6, caption: 'rare' },
        { id: 7, caption: 'N/A' }
    ],

    // GIF data
    gifs: [
        { src: '2O2UWDGYFNOHHSTO42TG47IHE2BOKW3E.gif', style: 'top: 98px; left: 232px; transform: scale(0.6);' },
        { src: 'KRQNVUQOQFDOIWAHV6X7DOM4PUZZMMF2.gif', style: 'top: 100px; left: 371px; transform: scale(1.0);' },
        { src: 'TE7XIVDMK552ZKRXYVBVWUOMLYLLBSCG.gif', style: 'top: 108px; left: 45px; transform: scale(2.4);' },
        { src: 'ZMUIJOD7UUCUB4T32KNCAGQN3ZCZKX7A.gif', style: 'top: 60px; left: 408px; transform: scale(0.6);' },
        { src: '2DACTM75GKC5X7XL4EVEOYSTHW2O4CTQ.gif', style: 'top: 201px; left: 51px; transform: scale(1.7);' },
        { src: '4HFDJLDZ5JQOTN5TQMBNGUHE2F52AZAP.gif', style: 'top: 50px; left: 185px; transform: scale(2.1);' },
        { src: '4ZD2KA4RR65TS35EN2N4BJD7KHPO36YP.gif', style: 'top: 152px; left: 286px; transform: scale(1.0);' },
        { src: '6YTCDFL5IBI3MNSV7OB2RPK2V345V5ZQ.gif', style: 'top: 210px; left: 433px; transform: scale(0.7);' },
        { src: '446M2AEVJDC3DFQQ3YXESKKJG7ENYBA3.gif', style: 'top: 48px; left: 164px; transform: scale(2.6);' },
        { src: 'CXBGOAMDIA74BPQBPWZI3PT3UN73QZLF.gif', style: 'top: 198px; left: 132px; transform: scale(0.8);' },
        { src: 'WD2ITN3HBW7ISGFFIZF74NWU4XSX3O47.gif', style: 'top: 71px; left: 104px; transform: scale(2.5);' },
        { src: 'WYLVCEJ6KFSFQNAXDZWB57G3FOSJRF3F.gif', style: 'top: 198px; left: 94px; transform: scale(1.7);' },
        { src: 'YR76B3OAGDC3RJ2URVQMLLJLPBRSOAYK.gif', style: 'top: 218px; left: 401px; transform: scale(1.6);' },
        { src: 'noteblock.gif', style: 'top: 60px; left: 299px; transform: scale(1.0);' },
        { src: 'coin.gif', style: 'top: 60px; left: 377px; transform: scale(1.0);' },
        { src: 'p-switch.gif', style: 'top: 60px; left: 359px; transform: scale(1.0);' },
        { src: 'question-block.gif', style: 'top: 60px; left: 338px; transform: scale(1.0);' },
        { src: 'star-firework.gif', style: 'top: 51px; left: 334px; transform: scale(1.0);' },
        { src: 'star.gif', style: 'top: 59px; left: 318px; transform: scale(1.0);' }
    ],

    init() {
        // Wait for sections to be loaded
        document.addEventListener('sectionsLoaded', () => {
            this.populateAmiiboList();
            this.populateCDCollection();
            this.loadGifs();
            this.setupToreeGif();
        });
    },

    populateAmiiboList() {
        const listContainer = document.getElementById('amiibo-list-items');
        const imagesContainer = document.getElementById('amiibo-list-images');
        
        if (!listContainer || !imagesContainer) return;

        // Populate list items
        this.amiiboWishList.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            listContainer.appendChild(li);
        });

        // Populate amiibo images
        const amiiboImages = ['splatoon.webp', 'squid.webp', 'girl.webp'];
        for (let i = 0; i < 29; i++) {
            const img = document.createElement('img');
            img.src = `assets/nintendo/amiibo/${amiiboImages[i % 3]}`;
            img.className = 'w-6 h-6';
            imagesContainer.appendChild(img);
        }
    },

    populateCDCollection() {
        const container = document.getElementById('cd-collection-items');
        if (!container) return;

        this.cdCollection.forEach(cd => {
            const cdItem = document.createElement('div');
            cdItem.className = 'cd-item';
            
            const img = document.createElement('img');
            img.src = `assets/nintendo/favorite-cds/cd${cd.id}.png`;
            img.alt = `CD ${cd.id}`;
            
            const caption = document.createElement('div');
            caption.className = 'cd-caption';
            caption.textContent = cd.caption;
            
            cdItem.appendChild(img);
            cdItem.appendChild(caption);
            container.appendChild(cdItem);
        });

        // Add Toree GIF
        const toreeContainer = document.createElement('div');
        toreeContainer.className = 'flex flex-col items-center';
        
        const toreeGif = document.createElement('img');
        toreeGif.src = 'assets/nintendo/gifs/toree.gif';
        toreeGif.className = 'toree-3d cursor-pointer';
        toreeGif.id = 'toree-gif';
        
        const toreeCaption = document.createElement('div');
        toreeCaption.className = 'cd-caption';
        toreeCaption.textContent = 'have you listened to toree 3d?';
        
        toreeContainer.appendChild(toreeGif);
        toreeContainer.appendChild(toreeCaption);
        container.appendChild(toreeContainer);
    },

    loadGifs() {
        const container = document.getElementById('gif-container-nintendo');
        if (!container) return;

        const FILE_ROOT = './assets/nintendo/gifs';
        
        this.gifs.forEach(gif => {
            const img = document.createElement('img');
            img.src = `${FILE_ROOT}/${gif.src}`;
            img.style.cssText = `position: absolute; ${gif.style} transform-origin: top left; max-width: none;`;
            container.appendChild(img);
        });
    },

    setupToreeGif() {
        const gif = document.getElementById('toree-gif');
        if (!gif) return;
        
        const audio = new Audio('assets/nintendo/audio/toree-title.mp3');
        audio.loop = true;
        
        gif.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
};

// Initialize Nintendo section
NintendoSection.init();
