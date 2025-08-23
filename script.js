// Palette Generator
const boxes = document.querySelectorAll(".color-box");
const generateBtn = document.getElementById("generate-btn");

// Generate random color
function randomColor() {
  return "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, "0");
}

// Apply colors
function generatePalette() {
  boxes.forEach(box => {
    const color = randomColor();
    box.style.background = color;
    box.querySelector("span").innerText = color;
    box.onclick = () => {
      navigator.clipboard.writeText(color);
      alert("Copied: " + color);
    };
  });
}

generateBtn.addEventListener("click", generatePalette);
document.body.addEventListener("keydown", (e) => {
  if (e.code === "Space") generatePalette();
});

// Animation Auto-Show
window.addEventListener("load", () => {
  const animation = document.querySelector(".animation");
  animation.style.display = "flex";
  setTimeout(() => {
    animation.style.display = "none";
    document.querySelector(".landing").scrollIntoView({ behavior: "smooth" });
  }, 3500);
});
const navLinks = document.querySelector(".nav-links");
    const openMenu = document.getElementById("openMenu");
    const closeMenu = document.getElementById("closeMenu");

    openMenu.addEventListener("click", () => {
      navLinks.classList.add("active");
    });

    closeMenu.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });

    // Close menu on link click or outside click
    document.querySelectorAll(".nav-links a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
      });
    });

    document.addEventListener("click", (e) => {
      if (!navLinks.contains(e.target) && !openMenu.contains(e.target)) {
        navLinks.classList.remove("active");
      }
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener("click", function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute("href")).scrollIntoView({
          behavior: "smooth"
        });
      });
    });
