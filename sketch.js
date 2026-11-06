// =====================================================
// SISMO DEL MUNDO - TUTORIAL 10
// Implementación de los tres retos
// =====================================================


// DECLARACIONES

const URL_SISMOS =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/' +
  'summary/2.5_month.geojson';

let crudo;
let sismos = [];
let anillos = [];

let t0, duracion;
let indice = 0;
let ultimoAhora = 0;

// Magnitud mínima
let magMin = 5;
let sliderMag;

// Sonido
let botonSonido;
let osc, env;
let sonidoActivo = false;

// Selector de tipo de onda
let selectorOnda;


// =====================================================
// CARGA DE DATOS
// =====================================================

function preload() {
  crudo = loadJSON(URL_SISMOS);
}


// =====================================================
// CONFIGURACIÓN
// =====================================================

function setup() {

  let ancho = min(windowWidth, 1000);

  createCanvas(ancho, ancho / 2);

  // Convertir los datos GeoJSON
  sismos = crudo.features
    .map(f => ({
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      prof: f.geometry.coordinates[2],
      mag: f.properties.mag,
      lugar: f.properties.place,
      t: f.properties.time
    }))
    .filter(s => s.mag !== null)
    .sort((a, b) => a.t - b.t);

  // Fecha inicial y duración
  t0 = sismos[0].t;
  duracion = sismos[sismos.length - 1].t - t0;


  // =================================================
  // RETO 1: CONTROL DESLIZANTE
  // =================================================

  let etiquetaMag = createSpan('Magnitud mínima: ');
  etiquetaMag.position(10, height + 15);

  sliderMag = createSlider(2.5, 8, magMin, 0.1);
  sliderMag.position(135, height + 15);
  sliderMag.style('width', '180px');


  // =================================================
  // RETO 3: SELECTOR DE TIPO DE ONDA
  // =================================================

  let etiquetaOnda = createSpan('Tipo de onda: ');
  etiquetaOnda.position(340, height + 15);

  selectorOnda = createSelect();

  selectorOnda.position(435, height + 15);

  selectorOnda.option('Seno', 'sine');
  selectorOnda.option('Triangular', 'triangle');
  selectorOnda.option('Cuadrada', 'square');
  selectorOnda.option('Diente de sierra', 'sawtooth');

  selectorOnda.changed(cambiarOnda);


  // =================================================
  // BOTÓN DE SONIDO
  // =================================================

  botonSonido = createButton('Activar sonido');
  botonSonido.position(10, height + 50);
  botonSonido.mousePressed(alternarSonido);


  // Oscilador
  osc = new p5.Oscillator('sine');

  env = new p5.Envelope();

  env.setADSR(0.01, 0.15, 0.1, 0.4);
  env.setRange(0.4, 0);

  osc.amp(env);

}


// =====================================================
// ANIMACIÓN
// =====================================================

function draw() {

  background(10, 12, 30);

  dibujarCuadricula();


  // Actualizar magnitud mínima desde el slider
  magMin = sliderMag.value();


  // Reloj simulado
  let ahora = t0 +
    (millis() * duracion / 60000) % duracion;


  // Reiniciar cuando termina el periodo
  if (ahora < ultimoAhora) {

    indice = 0;
    anillos = [];

  }

  ultimoAhora = ahora;


  // Procesar los sismos
  while (
    indice < sismos.length &&
    sismos[indice].t <= ahora
  ) {

    let s = sismos[indice];

    indice++;

    if (s.mag >= magMin) {

      anillos.push({
        s: s,
        nacio: millis()
      });

      sonar(s);

    }

  }


  // =================================================
  // DIBUJAR SISMOS PERMANENTES
  // =================================================

  noStroke();

  for (let i = 0; i < indice; i++) {

    let s = sismos[i];

    if (s.mag < magMin) continue;

    let p = proyectar(s.lon, s.lat);

    let c = colorProfundidad(s.prof);

    c.setAlpha(140);

    fill(c);

    circle(p.x, p.y, 3);

  }


  // =================================================
  // DIBUJAR ONDAS ANIMADAS
  // =================================================

  noFill();

  for (let i = anillos.length - 1; i >= 0; i--) {

    let a = anillos[i];

    let edad = (millis() - a.nacio) / 3000;

    if (edad > 1) {

      anillos.splice(i, 1);

      continue;

    }

    let p = proyectar(a.s.lon, a.s.lat);

    let c = colorProfundidad(a.s.prof);

    c.setAlpha(255 * (1 - edad));

    stroke(c);

    strokeWeight(2);

    circle(
      p.x,
      p.y,
      tamano(a.s.mag) * (0.3 + 2 * edad)
    );

  }


  // Fecha simulada
  noStroke();

  fill(255);

  textSize(14);

  textAlign(LEFT, TOP);

  text(
    new Date(ahora).toLocaleDateString('es-CO'),
    10,
    10
  );


  // =================================================
  // RETO 2: INFORMACIÓN DEL SISMO MÁS CERCANO
  // =================================================

  mostrarSismoCercano();

}


// =====================================================
// FUNCIONES AUXILIARES
// =====================================================


// Convertir longitud y latitud en posiciones del lienzo

function proyectar(lon, lat) {

  return {

    x: map(lon, -180, 180, 0, width),

    y: map(lat, 90, -90, 0, height)

  };

}


// Tamaño según la magnitud

function tamano(mag) {

  return map(mag, 2.5, 8, 6, 80);

}


// Color según profundidad

function colorProfundidad(prof) {

  let f = constrain(prof / 300, 0, 1);

  return lerpColor(
    color('#ffd166'),
    color('#7b2cbf'),
    f
  );

}


// Dibujar cuadrícula

function dibujarCuadricula() {

  stroke(255, 25);

  strokeWeight(1);

  for (let lon = -180; lon <= 180; lon += 30) {

    let x = proyectar(lon, 0).x;

    line(x, 0, x, height);

  }

  for (let lat = -90; lat <= 90; lat += 30) {

    let y = proyectar(0, lat).y;

    line(0, y, width, y);

  }

}


// =====================================================
// RETO 1: CONTROL DE MAGNITUD
// =====================================================

// La magnitud se actualiza directamente dentro de draw()
// mediante sliderMag.value().


// =====================================================
// RETO 2: INFORMACIÓN DEL SISMO MÁS CERCANO
// =====================================================

function mostrarSismoCercano() {

  let cercano = null;

  let distanciaMinima = Infinity;


  // Buscar entre los sismos que ya ocurrieron
  for (let i = 0; i < indice; i++) {

    let s = sismos[i];

    if (s.mag < magMin) continue;

    let p = proyectar(s.lon, s.lat);

    let distancia = dist(
      mouseX,
      mouseY,
      p.x,
      p.y
    );

    if (distancia < distanciaMinima) {

      distanciaMinima = distancia;

      cercano = s;

    }

  }


  // Mostrar información si el cursor está cerca
  if (cercano !== null && distanciaMinima < 25) {

    let informacion =
      'Lugar: ' + cercano.lugar +
      '\nMagnitud: ' + cercano.mag +
      '\nProfundidad: ' + cercano.prof + ' km';


    // Resaltar el sismo seleccionado
    let p = proyectar(cercano.lon, cercano.lat);

    noFill();

    stroke(255);

    strokeWeight(2);

    circle(p.x, p.y, 18);


    // Cuadro de información
    let anchoCaja = 260;
    let altoCaja = 85;

    let xCaja = constrain(
      mouseX + 15,
      0,
      width - anchoCaja
    );

    let yCaja = constrain(
      mouseY + 15,
      0,
      height - altoCaja
    );

    noStroke();

    fill(20, 25, 45, 235);

    rect(
      xCaja,
      yCaja,
      anchoCaja,
      altoCaja,
      8
    );

    fill(255);

    textSize(12);

    textAlign(LEFT, TOP);

    text(
      informacion,
      xCaja + 10,
      yCaja + 10,
      anchoCaja - 20,
      altoCaja - 15
    );

  }

}


// =====================================================
// SONIDO
// =====================================================


// Activar o silenciar el sonido

function alternarSonido() {

  userStartAudio();

  sonidoActivo = !sonidoActivo;

  if (sonidoActivo) {

    osc.start();

  } else {

    osc.stop();

  }

  botonSonido.html(
    sonidoActivo ? 'Silenciar' : 'Activar sonido'
  );

}


// Reproducir sonido según magnitud y longitud

function sonar(s) {

  if (!sonidoActivo) return;

  osc.freq(
    map(s.mag, 2.5, 8, 880, 110)
  );

  osc.pan(
    map(s.lon, -180, 180, -1, 1)
  );

  env.play();

}


// =====================================================
// RETO 3: CAMBIAR EL TIPO DE ONDA
// =====================================================

function cambiarOnda() {

  let tipoSeleccionado = selectorOnda.value();

  osc.setType(tipoSeleccionado);

}