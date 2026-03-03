# Puntos - Documentación Técnica

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Componentes](#componentes)
- [Interacción del Usuario](#interacción-del-usuario)
- [Ciclo de Vida del Juego](#ciclo-de-vida-del-juego)
- [Known Issues](#known-issues)

---

## Descripción General

**Puntos** es un juego casual tipo PWA (Progressive Web App) desarrollado con PhaserJS 3. El objetivo es simple: hacer tap/click en las frutas que caen antes de que lleguen al fondo de la pantalla.

### Características principales

- 🎮 Juego arcade casual
- 📱 PWA instalable en dispositivos móviles
- 🔇 Control de audio (música y efectos)
- 🏆 Sistema de récord persistente (localStorage)
- 📶 Funciona offline gracias al Service Worker
- 📐 Responsive (adapta a cualquier tamaño de pantalla)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│              (Punto de entrada de la aplicación)            │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   phaser.min.js │  │     app.js      │  │ service-worker  │
│   (Motor)       │  │   (Lógica)      │  │    (Cache)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   GameScene     │
                    │  (Escena única) │
                    └─────────────────┘
                              │
     ┌────────────┬───────────┼───────────┬────────────┐
     ▼            ▼           ▼           ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Sprites │ │  Audio  │ │Particles│ │  Text   │ │  Input  │
│(frutas) │ │ Manager │ │ System  │ │ Display │ │ Handler │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Stack Tecnológico

| Tecnología     | Versión | Propósito                     |
| -------------- | ------- | ----------------------------- |
| PhaserJS       | 3.x     | Motor de juegos 2D            |
| Service Worker | -       | Cache y funcionalidad offline |
| Web Manifest   | -       | Instalación como PWA          |
| localStorage   | -       | Persistencia del récord       |

### Estructura de Archivos

```
puntos/
├── docs/                    # Documentación
├── pwa/                     # Aplicación principal
│   ├── app.js              # Lógica del juego (GameScene)
│   ├── index.html          # Punto de entrada HTML
│   ├── manifest.json       # Configuración PWA
│   ├── service-worker.js   # Cache y offline
│   ├── styles.css          # Estilos base
│   ├── audio/
│   │   ├── accept.mp3      # Sonido al ganar puntos
│   │   └── tema.mp3        # Música de fondo
│   ├── font/
│   │   └── 8BitArtSansNeue.ttf  # Fuente retro
│   ├── img/
│   │   ├── elementos.png   # Spritesheet de frutas
│   │   ├── files.png       # Spritesheet de partículas
│   │   ├── favicon.svg     # Icono del sitio
│   │   └── icons-*.png     # Iconos PWA
│   └── vendor/
│       └── phaser.min.js   # Motor Phaser
├── start.sh                # Script para iniciar servidor
└── README.md               # Documentación básica
```

---

## Componentes

### 1. GameScene (app.js)

La escena principal del juego, implementada como una clase de Phaser que maneja todo el ciclo de vida.

#### Propiedades

| Propiedad   | Tipo      | Descripción                    |
| ----------- | --------- | ------------------------------ |
| `points`    | Integer   | Puntuación actual              |
| `record`    | Integer   | Récord histórico (persistente) |
| `elements`  | Group     | Grupo de sprites de frutas     |
| `particles` | Particles | Sistema de partículas          |
| `music`     | Sound     | Música de fondo                |
| `bell`      | Sound     | Efecto de sonido al puntuar    |
| `silence`   | Boolean   | Estado del audio (mute)        |
| `btnAudio`  | Text      | Botón toggle de audio          |

#### Métodos Principales

```javascript
// Ciclo de vida de Phaser
preload(); // Carga de assets (sprites, audio)
create(); // Inicialización de objetos
update(); // Loop principal (60fps)

// Lógica del juego
createElement(); // Crea nueva fruta
setPoints(val, el); // Actualiza puntuación
interactElements(); // Detecta frutas escapadas
```

### 2. Service Worker (service-worker.js)

Gestiona el cache de la aplicación para funcionalidad offline.

#### Estrategia de Cache

- **Cache First**: Intenta servir desde cache, luego desde red
- **Versionado**: `puntos-v1.3.9` para invalidar cache antiguo

#### Eventos Manejados

| Evento     | Acción                                  |
| ---------- | --------------------------------------- |
| `install`  | Cachea todos los archivos del app shell |
| `activate` | Limpia caches antiguos                  |
| `fetch`    | Sirve desde cache o red                 |

### 3. PWA Manifest (manifest.json)

Configuración para instalación en dispositivos:

| Campo         | Valor      |
| ------------- | ---------- |
| `display`     | fullscreen |
| `orientation` | portrait   |
| `theme_color` | #d5f6ff    |
| `start_url`   | index.html |

---

## Interacción del Usuario

### Diagrama de Flujo de Juego

```
                    ┌──────────────────┐
                    │   Inicio Juego   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Crear 5 frutas   │
                    │ (con delay 1s)   │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ┌─────────────────┐         ┌─────────────────┐
     │ Usuario toca    │         │ Fruta escapa    │
     │ fruta           │         │ (y > screenH)   │
     └────────┬────────┘         └────────┬────────┘
              │                           │
              ▼                           ▼
     ┌─────────────────┐         ┌─────────────────┐
     │ points++        │         │ points = 0      │
     │ partículas      │         │ vibración 1s    │
     │ sonido bell     │         │ reposicionar    │
     └────────┬────────┘         └────────┬────────┘
              │                           │
              └──────────────┬────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ ¿Nuevo récord?   │
                    │ → localStorage   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Mover fruta a    │
                    │ parte superior   │
                    └──────────────────┘
```

### Controles

| Acción                  | Resultado                              |
| ----------------------- | -------------------------------------- |
| **Tap/Click en fruta**  | +1 punto, efecto de partículas, sonido |
| **Tap/Click en 🔇/🔊**  | Toggle música y efectos                |
| **Dejar escapar fruta** | Puntos = 0, vibración                  |

### Mecánicas de Dificultad

La velocidad de caída aumenta progresivamente:

```javascript
velocidad = 1 + (puntos × 0.1)
```

| Puntos | Velocidad |
| ------ | --------- |
| 0      | 1.0       |
| 10     | 2.0       |
| 50     | 6.0       |
| 100    | 11.0      |

---

## Ciclo de Vida del Juego

### Fase 1: Preload

```
1. Mostrar barra de progreso
2. Cargar audio (tema.mp3, accept.mp3)
3. Cargar spritesheet de frutas (75x75px)
4. Cargar spritesheet de partículas (25x25px)
```

### Fase 2: Create

```
1. Crear texto de puntuación y récord
2. Inicializar sistema de audio (silenciado por defecto)
3. Crear botón de audio (🔇)
4. Inicializar sistema de partículas (5 emitters)
5. Crear grupo de elementos (max 5)
6. Programar creación de 5 frutas con delay de 1s
```

### Fase 3: Update (cada frame)

```
1. Calcular velocidad basada en puntos
2. Mover todas las frutas hacia abajo
3. Verificar si alguna fruta escapó
4. Repetir...
```

---

## Known Issues

### 🐛 Bugs Conocidos

| ID  | Descripción                   | Severidad | Estado      |
| --- | ----------------------------- | --------- | ----------- |
| #1  | La tecla 'X' no funciona      | Media     | Pendiente   |
| #2  | Sin funcionalidad de pausa    | Baja      | Por definir |
| #3  | Sin opción de reinicio manual | Baja      | Por definir |

### ⚠️ Limitaciones Técnicas

| Limitación                  | Impacto                   | Workaround     |
| --------------------------- | ------------------------- | -------------- |
| Máximo 5 frutas simultáneas | Limita complejidad visual | Por diseño     |
| Audio requiere interacción  | Política de navegadores   | Botón de audio |
| No hay estados de juego     | Sin menú/pausa/game over  | Juego infinito |

### 📝 Deuda Técnica

1. **Variables globales**: `realWidth` y `realHeight` están en scope global
2. **Sin minificación**: El código no está optimizado para producción
3. **Sin tests**: No existe suite de pruebas automatizadas
4. **Emitters de partículas sin uso diferenciado**: `square1-5` se crean pero solo se usa `emitParticleAt` genérico

### 🔮 Mejoras Futuras Sugeridas

- [ ] Implementar funcionalidad de tecla 'X'
- [ ] Agregar pantalla de pausa
- [ ] Cambio dinámico de color de fondo por récord
- [ ] Agregar botón de reinicio
- [ ] Sistema de niveles o power-ups
- [ ] Leaderboard online
- [ ] Sonidos diferenciados por tipo de fruta

---

## Cómo Ejecutar

```bash
# Desde la raíz del proyecto
cd pwa
# Requiere http-server instalado: npm install -g http-server
http-server .
# Abrir en navegador: http://localhost:8080
```

O simplemente ejecutar `start.sh` (requiere Chrome y http-server).

---

_Documentación generada para el proyecto Puntos v1.3.9_
