// Movie Section Module
const MovieSection = {
    // GIF data
    gifs: [
        { src: 'ezgif-2249585acd78be.gif', style: 'top: 15px; left: 121px; transform: scale(0.4);' },
        { src: 'ezgif-2b75fac3629109.gif', style: 'top: 15px; left: 2px; transform: scale(0.6);' },
        { src: 'ezgif-2b9935c865c07c.gif', style: 'top: 55px; left: 166px; transform: scale(0.7);' },
        { src: 'ezgif-2b68403086f60b.gif', style: 'top: 25px; left: 862px; transform: scale(0.7);' },
        { src: 'ezgif-2c14a2364b97a2.gif', style: 'top: 7px; left: 66px; transform: scale(0.5);' },
        { src: 'ezgif-2f7a8ec79d3ca7.gif', style: 'top: 11px; left: 973px; transform: scale(1.0);' },
        { src: 'ezgif-20f290f9cc84d9.gif', style: 'top: 6px; left: 171px; transform: scale(1.0);' },
        { src: 'ezgif-25c1f9169cb9c8.gif', style: 'top: 12px; left: 349px; transform: scale(0.6);' },
        { src: 'ezgif-29f2d8c57818af.gif', style: 'top: 16px; left: 755px; transform: scale(0.5);' },
        { src: 'ezgif-293d49ffb4470f.gif', style: 'top: 5px; left: 677px; transform: scale(0.4);' },
        { src: 'ezgif-2685061b5cd497.gif', style: 'top: 8px; left: 227px; transform: scale(0.4);' },
        { src: 'top-gun.gif', style: 'top: 11px; left: 417px; transform: scale(0.4);' },
        { src: 'scott-pilgrim-scot-pilgrim-vs-the-world.gif', style: 'top: 41px; left: 457px; transform: scale(0.6);' },
        { src: 'lalaland.gif', style: 'top: 40px; left: 581px; transform: scale(0.6);' },
        { src: 'ezgif-27f402ee8df458.gif', style: 'top: 32px; left: 797px; transform: scale(0.7);' },
        { src: 'unikitty.gif', style: 'top: 57px; left: 707px; transform: scale(0.5);' },
        { src: 'kermit-nod.gif', style: 'top: 59px; left: 380px; transform: scale(0.4);' },
        { src: '11288.gif', style: 'top: 41px; left: 61px; transform: scale(0.3);' },
        { src: 'H67VLYWOSUFZFS3U6NYZSZOEEPVRKF5T.gif', style: 'top: 22px; left: 538px; transform: scale(0.7);' },
        { src: 'JXZZ6KBK4NS72VO5KDJ6HKBXOEM24XQD.gif', style: 'top: 4px; left: 583px; transform: scale(1.0);' },
        { src: '275HWQJX57LUOGKKETPSXPO24BXDPNY6.gif', style: 'top: 69px; left: 956px; transform: scale(0.7);' },
        { src: 'EKSXIVIIEUPTPK3HMEAT5YEIJRRMUNY5.gif', style: 'top: 34px; left: 1017px; transform: scale(0.5);' },
        { src: 'YRUKJ3AGHWPXP6CSRCCK7Y57MEZPROXU.gif', style: 'top: 66px; left: 1054px; transform: scale(0.7);' },
        { src: '2566715_9854f.gif', style: 'top: 2px; left: 267px; transform: scale(0.4);' }
    ],

    init() {
        document.addEventListener('sectionsLoaded', () => {
            this.loadGifs();
            this.setupInteractions();
        });
    },

    loadGifs() {
        const container = document.getElementById('gif-container-movie');
        if (!container) return;

        const FILE_ROOT = './assets/movie/gifs';
        
        this.gifs.forEach(gif => {
            const img = document.createElement('img');
            img.src = `${FILE_ROOT}/${gif.src}`;
            img.style.cssText = `position: absolute; ${gif.style} transform-origin: top left; max-width: none;`;
            container.appendChild(img);
        });
    },

    setupInteractions() {
        // Add any interactive functionality for movie section buttons here
        const buttons = document.querySelectorAll('#movie-content button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Placeholder for button functionality
                console.log('Movie button clicked:', e.target.textContent);
            });
        });
    }
};

// Initialize Movie section
MovieSection.init();
