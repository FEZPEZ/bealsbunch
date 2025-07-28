const SMASH_ROOT_PATH = "../assets/smash-roster/characters/";

const smashGridData = [
    [
        ['zizzle iz.png', 'ZIZZLE IZ'],
        ['lucky.png', 'LUCKY'],
        ['underdog.png', 'UNDERDOG'],
        ['momo.png', 'MOMO'],
        ['3ds sound.png', '3DS SOUND'],
        ['luther.png', 'LUTHER'],
        ['buzz.png', 'BUZZ'],
        ['spudnick.png', 'SPUDNICK'],
        ['steve.png', 'STEVE'],
        ['meat or die.png', 'MEAT OR DIE'],
        ['clumsy ninja.png', 'CLUMSY NINJA'],
        ['lettuce leaf.png', 'LETTUCE LEAF'],
        ['webkinz.png', 'DOG']
    ],
    [
        ['piderman.png', 'PIDERMAN'],
        ['calvin\'s dad.png', 'CALVIN\'S DAD'],
        ['todd.png', 'TODD'],
        ['om nom.png', 'OM NOM'],
        ['tintin.png', 'TINTIN'],
        ['dragonvale.png', 'DRAGONVALE'],
        ['junkbot.png', 'JUNKBOT'],
        ['phineas and phineas.png', 'PHINEAS & PHINEAS'],
        ['zathura.png', 'ZATHURA'],
        ['mcdonalds.png', 'McDONALDS'],
        ['melman.png', 'MELMAN'],
        ['bududugu.png', 'BUDUDUGU'],
        ['yoda.png', 'YODA']
    ],
    [
        ['frog.png', 'FROG'],
        ['iron man.png', 'IRON MAN'],
        ['clyde.png', 'CLYDE'],
        ['hammy.png', 'HAMMY'],
        ['guy.png', 'GUY'],
        ['other guy.png', 'OTHER GUY'],
        ['pajama sam.png', 'PAJAMA SAM'],
        ['googles.png', 'GOOGLES'],
        ['barry.png', 'BARRY'],
        ['captain crunch.png', 'CAPTAIN CRUNCH'],
        ['future luke.png', 'FUTURE LUKE'],
        ['phineas.png', 'PHINEAS'],
        ['m.c. ballyhoo.png', 'MC BALLYHOO']
    ],
    [
        ['head monster.png', 'HEAD MONSTER'],
        ['starfright.png', 'STARFRIGHT'],
        ['carls breakfast.png', 'CARL\'S BREAKFAST'],
        ['bobby.png', 'BOBBY'],
        ['dash.png', 'DASH'],
        ['tahu.png', 'TAHU'],
        ['miss hattie.png', 'MISS HATTIE'],
        ['bigweld.png', 'BIGWELD'],
        ['knock out.png', 'KNOCK OUT'],
        ['dash pepper.png', 'DASH PEPPER'],
        ['bill nye.png', 'BILL NYE'],
        ['budderball.png', 'BUDDERBALL'],
        ['arnold.png', 'ARNOLD']
    ]
];

const container = document.getElementById('dream-smash-roster');

smashGridData.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'roster-row';

    row.forEach(([filename, label]) => {
        const box = document.createElement('div');
        box.className = 'roster-box';

        const wrapper = document.createElement('div');
        wrapper.className = 'img-wrapper';

        const img = document.createElement('img');
        img.className = 'roster-img';
        img.src = `${SMASH_ROOT_PATH}${filename}`;
        img.alt = "j";

        const labelDiv = document.createElement('div');
        labelDiv.className = 'roster-text';

        const labelInner = document.createElement('div');
        labelInner.className = 'roster-text-inner';
        labelInner.textContent = label;

        labelDiv.appendChild(labelInner);
        box.appendChild(wrapper);
        wrapper.appendChild(img);
        rowDiv.appendChild(box);
        box.appendChild(labelDiv);

// After labelDiv is in the DOM, measure and apply scale
        requestAnimationFrame(() => {
            const containerWidth = labelDiv.clientWidth;
            applyScaleX(labelInner, containerWidth);
        });

    });

    container.appendChild(rowDiv);
});


function applyScaleX(labelInner, containerWidth) {
    // Reset any existing transform
    labelInner.style.transform = 'scaleX(1)';

    // Force layout calc
    const fullWidth = labelInner.scrollWidth;

    const scale = 0.95*(containerWidth / fullWidth);

    // Only scale if necessary
    if (scale < 1) {
        labelInner.style.transform = `scaleX(${scale})`;
        labelInner.style.transformOrigin = 'left center';
        labelInner.style.marginLeft = '0'; // Not needed anymore
    }

}

