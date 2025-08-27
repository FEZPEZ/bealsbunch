
    // Root directories
    const IMG_ROOT = "./assets/sonic-speed/images/";
    const AUDIO_ROOT = "./assets/sonic-speed/";

    // References
    const sonicContainer = document.getElementById("sonic-speed");
    sonicContainer.style.backgroundImage = `url(${IMG_ROOT}background.jpg)`;

    // Create image
    const sonicImg = document.createElement("img");
    sonicImg.src = IMG_ROOT + "sonic-1.png";
    sonicContainer.appendChild(sonicImg);

    // Preload audio
    const sonicSound = new Audio(AUDIO_ROOT + "youre-too-slow.wav");

    // Utility: random placement inside container
    function placeRandomly() {
    const cWidth = sonicContainer.clientWidth;
    const cHeight = sonicContainer.clientHeight;
    const iWidth = sonicImg.offsetWidth;
    const iHeight = sonicImg.offsetHeight;

    const x = Math.random() * (cWidth - iWidth);
    const y = Math.random() * (cHeight - iHeight);

    sonicImg.style.left = `${x}px`;
    sonicImg.style.top = `${y}px`;
}

    // When image loads, place randomly
    sonicImg.onload = placeRandomly;

    // On click, reposition and play sound
    sonicImg.addEventListener("click", () => {
    placeRandomly();
    sonicSound.currentTime = 0; // reset if still playing
    sonicSound.play();
});
