document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("interactive-canvas");
  const ctx = canvas.getContext("2d");
  const mapImg = document.getElementById("campus-map-img");
  const mapContainer = document.querySelector(".map-container");
  const sectors = window.sectors;

  let scale = 1;
  let originX = 0;
  let originY = 0;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  // Detecta se é um dispositivo touch
  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  if (!isTouchDevice) return;

  function drawAllElements() {
    const originalWidth = mapImg.naturalWidth;
    const originalHeight = mapImg.naturalHeight;

    canvas.width = originalWidth;
    canvas.height = originalHeight;

    ctx.clearRect(0, 0, originalWidth, originalHeight);
    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(scale, scale);

    ctx.drawImage(mapImg, 0, 0, originalWidth, originalHeight);

    for (const id in sectors) {
      const coords = sectors[id].coords;
      drawPolygon(coords, { stroke: "#2a8e8e", lineWidth: 4 });
      drawSectorIcon(id, coords, sectors[id].icon);
    }

    ctx.restore();
  }

  let initialTouches = [];
  let initialDistance = 0;
  let lastPinchCenter = { x: 0, y: 0 };

  canvas.addEventListener("touchstart", (e) => {
    initialTouches = Array.from(e.touches);
    if (initialTouches.length === 2) {
      isDragging = false;
      initialDistance = Math.hypot(
        initialTouches[1].clientX - initialTouches[0].clientX,
        initialTouches[1].clientY - initialTouches[0].clientY
      );
      lastPinchCenter.x =
        (initialTouches[0].clientX + initialTouches[1].clientX) / 2;
      lastPinchCenter.y =
        (initialTouches[0].clientY + initialTouches[1].clientY) / 2;
    } else if (initialTouches.length === 1) {
      isDragging = true;
      lastX = initialTouches[0].clientX;
      lastY = initialTouches[0].clientY;
    }
  });

  canvas.addEventListener("touchmove", (e) => {
    if (!isDragging && e.touches.length !== 2) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();

    if (e.touches.length === 1 && isDragging) {
      // Pan
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      originX += dx;
      originY += dy;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Pinch-to-zoom
      isDragging = false;
      const currentDistance = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      const zoomFactor = currentDistance / initialDistance;

      const currentPinchCenter = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };

      const dx = currentPinchCenter.x - lastPinchCenter.x;
      const dy = currentPinchCenter.y - lastPinchCenter.y;

      const transformedX = (currentPinchCenter.x - rect.left - originX) / scale;
      const transformedY = (currentPinchCenter.y - rect.top - originY) / scale;

      const newScale = scale * zoomFactor;

      if (newScale > 0.5 && newScale < 3) {
        originX = currentPinchCenter.x - rect.left - transformedX * newScale;
        originY = currentPinchCenter.y - rect.top - transformedY * newScale;
        scale = newScale;
      }

      originX += dx;
      originY += dy;

      initialDistance = currentDistance;
      lastPinchCenter = currentPinchCenter;
    }

    drawAllElements();
  });

  canvas.addEventListener("touchend", (e) => {
    isDragging = false;

    if (e.touches.length === 0 && e.changedTouches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.changedTouches[0];

      const transformedX = (touch.clientX - rect.left - originX) / scale;
      const transformedY = (touch.clientY - rect.top - originY) / scale;

      for (const id in sectors) {
        const coords = sectors[id].coords;
        const points = coords.split(",").map(Number);

        ctx.beginPath();
        ctx.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
          ctx.lineTo(points[i], points[i + 1]);
        }
        ctx.closePath();

        if (ctx.isPointInPath(transformedX, transformedY)) {
          window.showInfo(id);
          break;
        }
      }
    }
  });

  window.initMap = () => {
    canvas.width = mapImg.naturalWidth;
    canvas.height = mapImg.naturalHeight;
  };

  window.addEventListener("resize", () => {
    if (mapImg.complete) {
      drawAllElements();
    }
  });

  drawAllElements();
});
