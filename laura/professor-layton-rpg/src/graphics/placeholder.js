export class PlaceholderGraphics {
    static background(name) {
        return `
            <div class="placeholder-bg">
                <div class="bg-title">[BACKGROUND: ${name}]</div>
            </div>
        `;
    }

    static character(name, mode = 'normal', isTalking = false, frame = 0) {
        let spriteName = `${name}_${mode}`;

        if (isTalking) {
            spriteName += `_talking_${frame}`;
        } else {
            spriteName += '_0';
        }

        return `
            <div class="placeholder-character">
                <div class="sprite-text">[${spriteName}]</div>
            </div>
        `;
    }
}