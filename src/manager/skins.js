/* credit to https://github.com/Pixel1011/Minecraft-legacy-skin-server/blob/main/SkinServer/src/SkinConverter.ts for the original skin conversion logic which helped me realise how simple it was. all credits given */

export class Skins {
    constructor(manager) {
        this.manager = manager;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this.renderCanvas = document.createElement('canvas');
        this.renderCtx = this.renderCanvas.getContext('2d', { willReadFrequently: true });
    };

    async isSkin(buff) {
        return new Promise((resolve) => {
            try {
                const blob = new Blob([buff], { type: 'image/png' });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    if (img.width === 64 && (
                        img.height === 64 ||
                        img.height === 32
                    )) resolve(true);
                    else resolve(false);
                };
                img.src = url;
            } catch {
                resolve(false);
            };
        });
    };

    async process(dataURI) {
        let processedDataURI = dataURI;

        const img = await this.dataURI_Img(dataURI);

        this.canvas.width = 64;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        if (img.height === 64) { // if modern skin it needs to be processed
            if (await this.isSlim()) await this.stretchSkin(img);
            await this.convert();
            processedDataURI = this.canvas.toDataURL("image/png");
        };

        await this.renderSkin();
        const headDataURI = this.renderCanvas.toDataURL("image/jpeg", 1.0);

        return [ processedDataURI, headDataURI ];
    };

    async isSlim() {
        const pixel = this.ctx.getImageData(54, 20, 1, 1).data;
        return pixel[3] === 0;
    };

    async convert() {
        // copy arm, leg, torso second layer on top
        /* this diagram is very helpful. https://www.researchgate.net/profile/Kenneth-Nero-2/publication/352484065/figure/fig1/AS:11431281238653099@1713991677683/A-sample-Minecraft-skin-file-The-unused-pixels-are-shown-in-grey-white-checkerboard.ppm */
        this.ctx.drawImage(this.canvas, 0, 32, 56, 16, 0, 16, 56, 16);

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = 64;
        tempCanvas.height = 32;

        tempCtx.drawImage(this.canvas, 0, 0, 64, 32, 0, 0, 64, 32);

        this.canvas.height = 32;
        this.ctx.drawImage(tempCanvas, 0, 0);
    };

    async stretchSkin(img) {
        this.ctx.clearRect(0, 0, 64, 64);
        
        this.ctx.drawImage(img, 0, 0, 40, 16, 0, 0, 40, 16);
        this.ctx.drawImage(img, 0, 16, 40, 16, 0, 16, 40, 16);
        this.ctx.drawImage(img, 0, 32, 40, 32, 0, 32, 40, 32);

        const regions = [[40, 16], [40, 32], [32, 48], [48, 48]];
        regions.forEach(([sx, sy]) => {
            this.ctx.drawImage(img, sx + 4, sy, 3, 4, sx + 4, sy, 4, 4);
            this.ctx.drawImage(img, sx + 7, sy, 3, 4, sx + 8, sy, 4, 4);

            this.ctx.drawImage(img, sx, sy + 4, 4, 12, sx, sy + 4, 4, 12);
            this.ctx.drawImage(img, sx + 4, sy + 4, 3, 12, sx + 4, sy + 4, 4, 12);
            this.ctx.drawImage(img, sx + 7, sy + 4, 4, 12, sx + 8, sy + 4, 4, 12);
            this.ctx.drawImage(img, sx + 11, sy + 4, 3, 12, sx + 12, sy + 4, 4, 12);
        });
    };

    async renderSkin() {
        this.renderCanvas.width = 8;
        this.renderCanvas.height = 8;

        // base
        this.renderCtx.drawImage(this.canvas, 8, 8, 8, 8, 0, 0, 8, 8);

        // overlay
        this.renderCtx.drawImage(this.canvas, 40, 8, 8, 8, 0, 0, 8, 8);
    };

    async dataURI_Img(dataURI) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve(img);
            };
            img.onerror = (err) => {
                reject(new Error("Failed to load image"));
                console.error(err);
            };
            img.src = dataURI;
        });
    };
};