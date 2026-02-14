const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let forming = false;
let totalParticles = 1400;

let textPoints = [];
let heartBasePoints = [];
let heartCenter;
let heartScale = 9;
let previousBeat = 0;
let showBook = false;
let dispersing = false;
let globalFade = false;


class Particle {
   constructor() {
    this.alpha = 1;
    this.exploding = false;

    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.targetX = this.x;
    this.targetY = this.y;

    // ✨ tamaño más pequeño y variado
    this.size = Math.random() * 1.8 + 0.5;

    this.speed = 0.15;

    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = (Math.random() - 0.5) * 1.2;

    this.isForming = false;

    // ✨ efecto parpadeo
    this.twinkle = Math.random() * Math.PI * 2;
}


   update() {

if (this.exploding) {

    this.x += this.vx;
    this.y += this.vy;

    // ✨ fricción suave para que se estabilicen
    this.vx *= 0.98;
    this.vy *= 0.98;

    // cuando la velocidad sea muy pequeña, vuelven al estado normal
    if (Math.abs(this.vx) < 0.3 && Math.abs(this.vy) < 0.3) {
        this.exploding = false;
    }

    return;
}

    if (this.exploding) {
        this.x += this.vx;
        this.y += this.vy;

        this.alpha -= 0.02;
        if (this.alpha <= 0) this.alpha = 0;

        return;
    }

    if (!forming) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    } 
    else {
        if (this.isForming) {
            this.x += (this.targetX - this.x) * this.speed;
            this.y += (this.targetY - this.y) * this.speed;
        } else {
            this.x += this.vx;
            this.y += this.vy;
        }
    }
}



    draw() {
    if (this.alpha <= 0) return;

    this.twinkle += 0.05;

    // ✨ parpadeo suave
    let twinkleAlpha = this.alpha * (0.6 + Math.sin(this.twinkle) * 0.4);

    ctx.globalAlpha = twinkleAlpha;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

   if (this.isForming) {
    // 💜 partículas del texto y corazón (más intensas)
    ctx.fillStyle = "#e754ff";       // rosa/lila más brillante
    ctx.shadowColor = "#d63fff";     // resplandor más visible
    ctx.shadowBlur = 22;             // efecto glow más intenso
    } else {
        // 🌌 polvo estelar púrpura suave
        ctx.fillStyle = "#b185db";
        ctx.shadowColor = "#7b2cbf";
        ctx.shadowBlur = 8;
    }


    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}

}

function createParticles() {
    particles = [];
    for (let i = 0; i < totalParticles; i++) {
        particles.push(new Particle());
    }
}

function generateTextPoints(text, yOffset = -40) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let fontSize = canvas.width < 600 ? 50 : 120;

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + yOffset);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let points = [];

    for (let y = 0; y < canvas.height; y += 6) {
        for (let x = 0; x < canvas.width; x += 6) {
            const index = (y * canvas.width + x) * 4;
            if (data[index + 3] > 128) {
                points.push({ x, y });
            }
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return points;
}

function generateHeartBase() {
    heartBasePoints = [];
    heartCenter = {
        x: canvas.width / 2,
        y: canvas.height / 2 + 120
    };

    for (let t = 0; t < Math.PI * 2; t += 0.05) {
        let x = 16 * Math.pow(Math.sin(t), 3);
        let y =
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t);

        heartBasePoints.push({ x, y });
    }
}

let previousSin = 0;

function updateTargets() {

    let time = Date.now() * 0.005;
    let currentSin = Math.sin(time);

    heartScale = 9 + currentSin * 1.8;

    let heartPoints = heartBasePoints.map(p => ({
        x: heartCenter.x + p.x * heartScale,
        y: heartCenter.y - p.y * heartScale
    }));

    let combined = textPoints.concat(heartPoints);

    for (let i = 0; i < particles.length; i++) {

        if (combined[i]) {
            particles[i].targetX = combined[i].x;
            particles[i].targetY = combined[i].y;
            particles[i].isForming = true;
        } else {
            particles[i].isForming = false;
        }
    }

    // 💥 EMPUJE EN CADA PICO DEL LATIDO
    // Detecta cuando el seno empieza a bajar después de estar arriba
    if (previousSin > 0.95 && currentSin < previousSin) {

        particles.forEach(p => {
            if (!p.isForming) {

                let dx = p.x - heartCenter.x;
                let dy = p.y - heartCenter.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 250 && dist > 0) {
                    let force = (250 - dist) / 250;
                    p.vx += (dx / dist) * force * 3;
                    p.vy += (dy / dist) * force * 3;
                }
            }
        });
    }

    previousSin = currentSin;
}


function form(text) {
    textPoints = generateTextPoints(text);
    forming = true;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (forming) updateTargets();

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    if (showBook) {
        book.classList.add("show");
    }

    requestAnimationFrame(animate);
}


let step = 0;



window.addEventListener("click", () => {

    if (step === 0) {
        form("ERES");
        step = 1;
    }
    else if (step === 1) {
        form("LA MEJOR");
        step = 2;
    }
    else if (step === 2) {
        explodeParticles();
        step = 3;
    }

});

function explodeParticles() {

    forming = false;


    particles.forEach(p => {

        if (p.isForming) {

            let angle = Math.random() * Math.PI * 2;
            let force = 4 + Math.random() * 5;

            p.vx = Math.cos(angle) * force;
            p.vy = Math.sin(angle) * force;
        }

        // Todas pierden su estado de formación
        p.isForming = false;
        p.exploding = true;
    });

    // Cuando ya desaparecieron, limpiamos el array
   setTimeout(() => {
    resetBook();
    showBookAnimated();
}, 800);


}


const book = document.getElementById("book");
const pages = document.querySelectorAll(".page");

pages.forEach((page, index) => {
    page.style.zIndex = pages.length - index;
});



let currentPage = 0;

function showBookAnimated() {
  book.classList.add("show");
}

book.addEventListener("click", () => {

  if (currentPage < pages.length) {

   if (currentPage < pages.length) {
    const page = pages[currentPage];
    page.classList.add("flipped");

    // Ajustar z-index: la página volteada va al frente
    page.style.zIndex = pages.length + currentPage;

    currentPage++;
}


  } else {

    pages.forEach((page, index) => {
      page.classList.remove("flipped");
      page.style.zIndex = pages.length - index;
    });

    currentPage = 0;
  }

});


function resetBook() {

    pages.forEach((p, index) => {
        p.classList.remove("flipped");

        // 🔥 Restaurar orden original
        p.style.zIndex = pages.length - index;
    });

    currentPage = 0;
}


window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateHeartBase();
});

createParticles();
generateHeartBase();
animate();
