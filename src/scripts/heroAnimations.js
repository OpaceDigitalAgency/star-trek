import * as THREE from 'three';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
  // Title animation
  const titleElement = document.querySelector('[data-animation="title"]');
  
  if (titleElement) {
    gsap.fromTo(
      titleElement,
      { 
        opacity: 0,
        y: 40
      },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out"
      }
    );
  }
  
  // Animate the subtitle
  const subtitle = document.querySelector('.hero-subtitle');
  if (subtitle) {
    gsap.fromTo(
      subtitle,
      { 
        opacity: 0,
        y: 30
      },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        delay: 0.3,
        ease: "power2.out"
      }
    );
  }
  
  // Buttons animation
  const buttons = document.querySelectorAll('.hero-content .trek-button');
  if (buttons.length) {
    gsap.fromTo(
      buttons,
      { 
        opacity: 0,
        y: 20
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.6,
        stagger: 0.2,
        ease: "back.out(1.5)"
      }
    );
  }
  
  // LCARS decoration animation
  const lcarsDecoration = document.querySelector('.lcars-decoration');
  if (lcarsDecoration) {
    gsap.fromTo(
      lcarsDecoration,
      { 
        opacity: 0,
        y: 20
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 1,
        ease: "power2.out"
      }
    );
  }
  
  // 3D Starship model
  initStarshipModel();
});

function initStarshipModel() {
  // Check if canvas exists
  const canvas = document.getElementById('starship-model');
  if (!canvas) return;
  
  // Initialize Three.js scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 400 / 300, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  
  // Set up lights
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Create a simple starship model (placeholder)
  const shipGeometry = new THREE.ConeGeometry(1, 4, 32);
  const shipMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.7,
    roughness: 0.2
  });
  const ship = new THREE.Mesh(shipGeometry, shipMaterial);
  scene.add(ship);
  
  // Add glow
  const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00b2ff,
    transparent: true,
    opacity: 0.5
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.z = -2;
  scene.add(glow);
  
  // Position camera
  camera.position.z = 10;
  
  // Show container
  const container = document.getElementById('starship-container');
  gsap.to(container, {
    opacity: 1,
    duration: 1,
    delay: 1.5
  });
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Rotate ship
    ship.rotation.y += 0.01;
    ship.rotation.z += 0.005;
    
    // Pulse glow
    const time = Date.now() * 0.001;
    glow.scale.set(
      1 + Math.sin(time) * 0.2,
      1 + Math.sin(time) * 0.2,
      1 + Math.sin(time) * 0.2
    );
    
    renderer.render(scene, camera);
  }
  
  animate();
}