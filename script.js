// ===== NAVIGATION =====
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

// Scroll effect
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile menu toggle
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  navToggle.classList.toggle('open');
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    navToggle.classList.remove('open');
  });
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  });
});

// ===== COUNTER ANIMATION =====
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  counters.forEach(counter => {
    if (counter.dataset.animated) return;

    const rect = counter.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;

    counter.dataset.animated = 'true';
    const target = parseFloat(counter.dataset.target);
    const suffix = counter.dataset.suffix || '';
    const isDecimal = counter.dataset.decimal === 'true';
    const duration = 2500;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = eased * target;

      if (isDecimal) {
        counter.textContent = current.toFixed(1) + suffix;
      } else {
        counter.textContent = Math.floor(current).toLocaleString() + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (isDecimal) {
          counter.textContent = target.toFixed(1) + suffix;
        } else {
          counter.textContent = target.toLocaleString() + suffix;
        }
      }
    }

    requestAnimationFrame(update);
  });
}

// ===== SCROLL REVEAL =====
function revealElements() {
  const reveals = document.querySelectorAll('.reveal, .fade-up');
  reveals.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    if (rect.top < windowHeight - 50) {
      el.classList.add('revealed');
    }
  });
}

window.addEventListener('scroll', () => {
  animateCounters();
  revealElements();
});

// Initial check
window.addEventListener('load', () => {
  animateCounters();
  revealElements();
  initSolarCanvas();
  updateBatteryVisibility();
});

// ===== CALCULATOR TABS =====
const calcTabs = document.querySelectorAll('.calc-tab');
let currentSystem = 'ongrid';

calcTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    calcTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentSystem = tab.dataset.tab;
    updateBatteryVisibility();

    // Hide results when switching tabs
    document.getElementById('calcResults').classList.remove('show');
  });
});

function updateBatteryVisibility() {
  const batteryGroup = document.getElementById('batteryGroup');
  if (currentSystem === 'offgrid') {
    batteryGroup.style.display = 'block';
  } else {
    batteryGroup.style.display = 'none';
  }
}

// ===== SOLAR CALCULATOR =====
function calculateSolar() {
  const inverterKW = parseFloat(document.getElementById('inverterSize').value);
  const monthlyBill = parseFloat(document.getElementById('monthlyBill').value);
  const buildingType = document.getElementById('buildingType').value;
  const region = document.getElementById('region').value;

  if (!monthlyBill || monthlyBill < 500) {
    alert('กรุณากรอกค่าไฟรายเดือนอย่างน้อย 500 บาท');
    return;
  }

  // Regional sun hours factor
  const sunHours = {
    central: 4.5,
    north: 4.3,
    northeast: 4.8,
    south: 4.0,
    east: 4.6
  };

  const peakSunHrs = sunHours[region] || 4.5;

  // Panel calculations (Using selected panel)
  const panelSelect = document.getElementById('panelType');
  const selectedPanel = panelSelect.options[panelSelect.selectedIndex];
  const panelWatt = parseFloat(selectedPanel.dataset.watt);
  const panelPrice = parseFloat(selectedPanel.dataset.price);
  
  const panelCount = Math.ceil((inverterKW * 1000) / panelWatt);
  const panelArea = panelCount * 2.8; // ~2.8 sqm per panel
  const totalPanelCost = panelCount * panelPrice;

  // Monthly production
  const dailyProduction = inverterKW * peakSunHrs * 0.82; // 82% efficiency
  const monthlyProduction = dailyProduction * 30;

  // Electricity rate (average 4.5 THB/kWh)
  const electricityRate = 4.5;
  const monthlyConsumption = monthlyBill / electricityRate;

  // Savings calculation
  let monthlySavings;
  if (currentSystem === 'ongrid') {
    // On-Grid: save up to what you produce or consume (whichever is less)
    const usableSolar = Math.min(monthlyProduction, monthlyConsumption);
    monthlySavings = usableSolar * electricityRate;
    // Sell excess at reduced rate (2.2 THB/kWh)
    const excess = Math.max(0, monthlyProduction - monthlyConsumption);
    monthlySavings += excess * 2.2;
  } else {
    // Off-Grid: all consumption covered by solar (up to production)
    monthlySavings = Math.min(monthlyProduction, monthlyConsumption) * electricityRate;
  }

  // Cost calculation
  // Base Inverter Cost Estimation
  let inverterCost = 25000 + (inverterKW * 3000); 
  
  // Base Installation & Accessories
  let accessoryCost = 15000 + (inverterKW * 1500);
  let installCost = 20000 + (inverterKW * 1000);

  // Battery Cost for Off-Grid
  let batteryCost = 0;
  let batteryKWh = 0;
  if (currentSystem === 'offgrid') {
    const batterySelect = document.getElementById('batteryType');
    if(batterySelect) {
       const selectedBattery = batterySelect.options[batterySelect.selectedIndex];
       if(selectedBattery) {
         batteryKWh = parseFloat(selectedBattery.dataset.kwh) || (inverterKW * 2.5);
         batteryCost = parseFloat(selectedBattery.dataset.price) || (batteryKWh * 10000);
       } else {
         batteryKWh = inverterKW * 2.5;
         batteryCost = batteryKWh * 10000;
       }
    } else {
       batteryKWh = inverterKW * 2.5;
       batteryCost = batteryKWh * 10000;
    }
    // Need a bit more robust inverter for offgrid
    inverterCost *= 1.4; 
  }

  // Building type modifier for install
  const buildingMod = {
    house: 1.0,
    commercial: 1.15,
    factory: 1.25
  };
  installCost *= buildingMod[buildingType];

  const totalCost = Math.round(totalPanelCost + inverterCost + batteryCost + accessoryCost + installCost);

  // ROI
  const annualSavings = monthlySavings * 12;
  const roiYears = totalCost / annualSavings;
  const lifetimeSavings = (annualSavings * 25) - totalCost; // 25 years lifespan

  // Update Main Results
  document.getElementById('resultCost').textContent = '฿' + totalCost.toLocaleString();
  document.getElementById('resultPanels').textContent = panelCount + ' แผง';
  document.getElementById('resultArea').textContent = panelArea.toFixed(0) + ' ตร.ม.';
  document.getElementById('resultProduction').textContent = monthlyProduction.toFixed(0).toLocaleString() + ' kWh';
  document.getElementById('resultSavings').textContent = '฿' + Math.round(monthlySavings).toLocaleString();
  document.getElementById('resultROI').textContent = roiYears.toFixed(1) + ' ปี';
  document.getElementById('resultLifetimeSavings').textContent = '฿' + Math.round(lifetimeSavings).toLocaleString();

  // Update Breakdown
  document.getElementById('bdPanelCost').textContent = '฿' + Math.round(totalPanelCost).toLocaleString();
  document.getElementById('bdInverterCost').textContent = '฿' + Math.round(inverterCost).toLocaleString();
  document.getElementById('bdAccessoryCost').textContent = '฿' + Math.round(accessoryCost).toLocaleString();
  document.getElementById('bdInstallCost').textContent = '฿' + Math.round(installCost).toLocaleString();
  document.getElementById('bdTotalCost').textContent = '฿' + totalCost.toLocaleString();

  // Battery Breakdown & Card
  const batteryCard = document.getElementById('batteryCard');
  const bdBatteryRow = document.getElementById('bdBatteryRow');
  
  if (currentSystem === 'offgrid') {
    batteryCard.style.display = 'block';
    bdBatteryRow.style.display = 'flex';
    document.getElementById('resultBattery').textContent = batteryKWh.toFixed(1) + ' kWh';
    document.getElementById('bdBatteryCost').textContent = '฿' + Math.round(batteryCost).toLocaleString();
  } else {
    batteryCard.style.display = 'none';
    bdBatteryRow.style.display = 'none';
  }

  // Show results with animation
  const results = document.getElementById('calcResults');
  results.classList.add('show');

  // Trigger counters for results if needed or just simple text update
  // Scroll to results
  setTimeout(() => {
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

// ===== SELECT PRODUCT (from product cards) =====
function selectProduct(kw) {
  // Scroll to calculator
  const calcSection = document.getElementById('calculator');
  calcSection.scrollIntoView({ behavior: 'smooth' });

  // Set inverter size
  setTimeout(() => {
    const select = document.getElementById('inverterSize');
    select.value = kw;
    // Flash the select to show it changed
    const wrapper = select.parentElement;
    wrapper.style.borderColor = 'var(--accent-color)';
    wrapper.style.boxShadow = '0 0 15px var(--accent-glow)';
    setTimeout(() => {
      wrapper.style.borderColor = '';
      wrapper.style.boxShadow = '';
    }, 1500);
  }, 600);
}

// ===== CANVAS PARTICLES (Hero Background) =====
function initSolarCanvas() {
  const canvas = document.getElementById('solar-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let lines = [];
  let animationId;

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.05 + 0.01,
      pulseVal: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? '#FBBF24' : '#F59E0B' // Golden colors
    };
  }

  function init() {
    resize();
    particles = [];
    const count = Math.min(Math.floor((width * height) / 12000), 100);
    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(251, 191, 36, ${0.15 * (1 - dist / 120)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw and update particles
    particles.forEach(p => {
      // Move
      p.x += p.speedX;
      p.y += p.speedY;

      // Bounce
      if (p.x < 0 || p.x > width) p.speedX *= -1;
      if (p.y < 0 || p.y > height) p.speedY *= -1;

      // Pulse opacity
      p.pulseVal += p.pulseSpeed;
      const currentOpacity = p.opacity + Math.sin(p.pulseVal) * 0.3;
      const safeOpacity = Math.max(0.1, Math.min(1, currentOpacity));

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = safeOpacity;
      ctx.fill();
      
      // Draw glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0; // Reset
      ctx.globalAlpha = 1.0;
    });

    animationId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    init(); // Reinit on resize for better distribution
  });

  init();
  draw();
}
