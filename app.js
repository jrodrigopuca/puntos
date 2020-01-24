/**
 *  Puntos v1.2: Actualizado el 1/24
 * - mejora en el redimensionamiento de la pantalla
 * 
 */

// Capturar las dimensiones
let realWidth= window.innerWidth; // *window.devicePixelRatio;
let realHeight= window.innerHeight; // window.devicePixelRatio;

// Capturar los puntos anteriores
var points=!!localStorage.getItem("puntos")?parseInt(localStorage.getItem("puntos")):0;
var record=!!localStorage.getItem("record")?parseInt(localStorage.getItem("record")):0;


const config = {
    type: Phaser.AUTO,
    width: realWidth,
    height: realHeight,
    pixelArt: true,
    backgroundColor: Phaser.Display.Color.RandomRGB().color,
    zoom:1,
    input:{
        activePointers:3},
    pixelArt:true,
    physics: {
        default: 'arcade',
        arcade: {
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var progress;
var miTexto, camera,elementos, particulas, cuadro1,cuadro2,cuadro3,music, campana;

function preload (){
    progress = this.add.graphics();

    this.load.on('progress', function (value) {
        progress.clear();
        progress.fillStyle(0xffffff, 1);
        progress.fillRect(0, realHeight/2, realWidth * value, 60);

    });

    this.load.on('complete', function () {
        progress.destroy();

    });

    this.load.audio('tema', ['audio/tema.ogg', 'audio/tema.mp3']);
    this.load.audio('campana', ['audio/accept.mp3']);
    this.load.spritesheet('elementos', 'img/elementos.png', { frameWidth: 50, frameHeight: 50 });
    this.load.spritesheet('particulas', 
        'img/files.png',
        { frameWidth: 25, frameHeight: 25}
    ); 
}

function create (){
    
    music = this.sound.add('tema');
    music.loop=true;
    music.play();
    //setTimeout(()=>{ music.play();console.log('music'); }, 72600);
    campana = this.sound.add('campana');
    //campana.volume=1.5;

    particulas = this.add.particles('particulas');
    cuadro1 = particulas.createEmitter({
        frame: 0,
        x: 25,
        y: 25,
        speed: 300,
        frequency: 5000,
        lifespan: 1000, 
        on: false
    });
    cuadro2 = particulas.createEmitter({
        frame: 1,
        x: 25,
        y: 25,
        speed: 300,
        frequency: 5000,
        lifespan: 1000, 
        on: false
    });
    cuadro3 = particulas.createEmitter({
        frame: 2,
        x: 25,
        y: 25,
        speed: 300,
        frequency: 5000,
        lifespan: 1000, 
        on: false
    });


    elementos = this.add.group({
        defaultKey: 'elementos',
        maxSize: 5,
        
        createCallback: function (el) {
            el.setName('e' + this.getLength());
            //console.log('Created', el.name);
            //#=> e1,e2, e3, e4, e5
        },
        removeCallback: function (el) {
            //console.log('Removed', el.name);
        }
    });
    //setScale: { x: 0.1*realWidth, y: 0.1*realWidth, stepX:1 },
    //elementos.sca


    //texto puntos
    estiloFuente={font: '3em tres', align: 'left', fontWeight: 'bold', stroke: '#000000', strokeThickness: 9};
    miTexto = this.add.text(0.1*realWidth, 10, `points ${points}\n record ${record}`, estiloFuente);  


    this.time.addEvent({
        delay: 100,
        loop: true,
        callback: agregarElemento
    });

    this.input.on('pointerdown', function (pointer, gObjects) {
        if (gObjects.length >0){
            elementos.kill(gObjects[0]);
            campana.play();
            points+=1;
            if (points > record){
                record=points;
                localStorage.setItem("record", points);
            }
            //record=points>record?points:record;

            localStorage.setItem("puntos", points);
            miTexto.text= `points ${points}\n record ${record}`;
            miTexto.updateText();
            particulas.emitParticleAt(pointer.x, pointer.y);
        }
        
    });

}

function agregarElemento(){
    let el = elementos.get(Phaser.Math.Between(0.1*realWidth, realWidth-(0.1*realWidth)), 0, 'elementos', Phaser.Math.Between(0,2));
    if (!el) return;
    el.setActive(true);
    el.setInteractive();
    el.setVisible(true);
    el.setTint(Phaser.Display.Color.RandomRGB().color);
}

function update(){
    let velocidad= 1+points*0.1;

    Phaser.Actions.IncY(elementos.getChildren(), velocidad);

    elementos.children.iterate((elemento)=>{
        if (elemento.y > realHeight) {
            if (points>0){let vibrar=window.navigator.vibrate(1000);}

            elementos.killAndHide(elemento);
            points=0;
            localStorage.setItem("puntos", points);
            miTexto.text= `points ${points}\n record ${record}`;
            miTexto.updateText();
        }
    });
    
    //arbol.setData('h', points);

    /*
    miTexto.text= `points ${points}`;
    points+=1;
    miTexto.updateText();
    */
}

/**
 * Adaptar en caso de cambio de pantalla
 */
window.addEventListener('resize', (evt)=>{
    realWidth= window.innerWidth; 
    realHeight= window.innerHeight;
    game.scale.resize(realWidth,realHeight);
},false)