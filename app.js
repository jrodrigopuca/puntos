let realWidth = window.innerWidth; // *window.devicePixelRatio;
let realHeight = window.innerHeight; // window.devicePixelRatio;

let GameScene = new Phaser.Class({
    Extends: Phaser.Scene,

    /**
     *  cargar los elementos a usar a la clase, 
     *  de este modo será más fácil para acceder 
     *  en los otros métodos.
     */
    initialize: function GameScene() {
        Phaser.Scene.call(this, { key: 'gameScene', active: true });

        this.points = 0;
        this.record = !!localStorage.getItem("record") ? parseInt(localStorage.getItem("record")) : 0;

        this.myText = "";
        this.elements = null;
        this.btnAudio = null;
        this.particles = null;
        this.square1 = null;
        this.square2 = null;
        this.square3 = null;
        this.square4 = null;
        this.square5 = null;
        this.music = null;
        this.bell = null;

        this.silence = true;
        this.btnAudio = null;

    },

    /**
     *  crear una barra de progreso para mostrar 
     * mientras se cargan los datos
     */
    preload: function () {
        let progress = this.add.graphics();
        this.load.on('progress', function (value) {
            progress.clear();
            progress.fillStyle(0xffffff, 1);
            progress.fillRect(0, realHeight / 2, realWidth * value, 60);
        });

        this.load.on('complete', function () {
            progress.destroy();
        });

        this.load.audio('song', ['audio/tema.mp3']);
        this.load.audio('bell', ['audio/accept.mp3']);
        this.load.spritesheet('elements', 'img/elementos.png', { frameWidth: 75, frameHeight: 75 });
        this.load.spritesheet('particles',
            'img/files.png',
            { frameWidth: 25, frameHeight: 25 }
        );
    },
    create: function () {

        let styleText = { font: '5em tres', align: 'left', fontWeight: 'bold', stroke: '#000000', strokeThickness: 9 };
        this.myText = this.add.text(0.1 * realWidth, 10, `🍊  ${this.points}\n 🏆 ${this.record}`, styleText);
        this.music = this.sound.add('song');
        this.music.loop = true;
        this.music.stop();
        this.bell = this.sound.add('bell');
        this.bell.stop();


        this.btnAudio = this.add.text(realWidth - (0.2 * realWidth), 10, '🔇', styleText);
        this.btnAudio.setInteractive().on('pointerdown', () => {
            if (this.silence) {
                this.btnAudio.text = '🔊';
                this.music.play();
                this.silence = false;
            }
            else {
                this.btnAudio.text = '🔇';
                this.music.pause();
                this.silence = true;
            }
            this.btnAudio.updateText();
        })

        this.particles = this.add.particles('particles');
        this.square1 = this.particles.createEmitter({ frame: 0, x: 25, y: 25, speed: 300, frecuency: 5000, lifespan: 1000, on: false });
        this.square2 = this.particles.createEmitter({ frame: 1, x: 25, y: 25, speed: 300, frecuency: 5000, lifespan: 1000, on: false });
        this.square3 = this.particles.createEmitter({ frame: 2, x: 25, y: 25, speed: 300, frecuency: 5000, lifespan: 1000, on: false });
        this.square4 = this.particles.createEmitter({ frame: 3, x: 25, y: 25, speed: 300, frecuency: 5000, lifespan: 1000, on: false });
        this.square5 = this.particles.createEmitter({ frame: 4, x: 25, y: 25, speed: 300, frecuency: 5000, lifespan: 1000, on: false });



        this.elements = this.add.group({
            defaultKey: 'elements',
            maxSize: 5,
            setCollideWorldBounds: true,
            runChildUpdate: true,
            createCallback: function (el) {
            },
        });

        // crear los cinco de una sola vez
        this.time.addEvent({
            delay: 1000,
            repeat: 4,
            loop: false,
            callback: () => { this.createElement() }
        });
    },
    setPoints(val, el) {
        if (val > this.record) {
            this.record = val;
            localStorage.setItem("record", val);
            //this.cameras.main.setBackgroundColor(Phaser.Display.Color.RandomRGB().color);
        }
        if (val===0 && val!=this.points){window.navigator.vibrate(1000);}
        if (!this.silence && val >= 1) { this.bell.play(); }

        this.points = val;
        this.myText.text = `🍊  ${this.points}\n 🏆 ${this.record}`;
        this.myText.updateText();
        el.x = Phaser.Math.Between(0.1 * realWidth, realWidth - (0.1 * realWidth));
        el.y = 0;

    },
    createElement: function () {
        if (!this.elements.isFull()) {
            let el = this.elements.create(Phaser.Math.Between(0.1 * realWidth, realWidth - (0.1 * realWidth)), 0, 'elements', Phaser.Math.Between(0, 3));
            el.setInteractive();
            el.setVisible(true);
            el.setName('e' + this.elements.getLength());

            const colores = [0xffaaaa, 0xac93de, 0xffdd55, 0xffffff]
            const randomColor = colores[Math.floor(Math.random() * colores.length)];
            el.setTint(randomColor);
            el.on('pointerdown', (pointer, localX, localY, event) => {
                this.setPoints(this.points + 1, el);
                this.particles.emitParticleAt(pointer.x, pointer.y);

            })
        }
        else {
            return;
        }
    },
    interactElements: function () {
        this.elements.children.iterate((el) => {
            if (el.y > realHeight) {
                this.setPoints(0, el);
            }
        })
    },
    update: function (time, delta) {
        let velocidad = 1 + this.points * 0.1;
        Phaser.Actions.IncY(this.elements.getChildren(), velocidad);
        this.interactElements();
    }
})


let config = {
    type: Phaser.AUTO,
    width: realWidth,
    height: realHeight,
    pixelArt: true,
    backgroundColor: Phaser.Display.Color.RandomRGB().color,
    zoom: 1,
    audio: {
        disableWebAudio: true
    },
    input: {
        activePointers: 3
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
        },
    },
    scene: GameScene
}

const game = new Phaser.Game(config);

window.addEventListener('resize', (evt) => {
    realWidth = window.innerWidth;
    realHeight = window.innerHeight;
    game.scale.resize(realWidth, realHeight);
}, false)