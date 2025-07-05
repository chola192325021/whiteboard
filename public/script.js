const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let socket = new WebSocket("wss://whiteboard-1-jtnv.onrender.com");

let penColor = "#000000";
let color = penColor;
let penSize = 2;
let isErasing = false;

socket.onmessage = function(event) {
  event.data.text().then((message) => {
    const data = JSON.parse(message);
    if (data.type === "draw") {
      draw(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
    } else if (data.type === "clear") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
};

function draw(x0, y0, x1, y1, color = 'black', size = 2, emit = true) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.stroke();
  ctx.closePath();

  if (!emit) return;

  const data = {
    type: "draw",
    x0, y0, x1, y1, color, size
  };
  socket.send(JSON.stringify(data));
}

let last = {};

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  last = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  draw(last.x, last.y, e.clientX, e.clientY, color, penSize, true);
  last = { x: e.clientX, y: e.clientY };
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Tool logic
document.getElementById("colorPicker").addEventListener("input", (e) => {
  penColor = e.target.value;
  if (!isErasing) color = penColor;
});

document.getElementById("penSize").addEventListener("input", (e) => {
  penSize = parseInt(e.target.value);
});

document.getElementById("eraserBtn").addEventListener("click", () => {
  isErasing = !isErasing;
  color = isErasing ? "#ffffff" : penColor;
});

document.getElementById("clearBtn").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const data = { type: "clear" };
  socket.send(JSON.stringify(data));
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const dataURL = canvas.toDataURL("image/png");

  fetch("/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ image: dataURL })
  })
  .then(res => res.text())
  .then(msg => alert(msg))
  .catch(err => alert("Save failed"));
});

document.getElementById("viewBtn").addEventListener("click", () => {
  const modal = document.getElementById("previewModal");
  const img = document.getElementById("previewImage");

  img.src = "saved-board.png?t=" + new Date().getTime(); // bust cache
  modal.style.display = "flex";
});

// Load saved image at startup
const savedImage = new Image();
savedImage.src = "saved-board.png";
savedImage.onload = () => {
  ctx.drawImage(savedImage, 0, 0, canvas.width, canvas.height);
};
