* {
.menu-card {
  text-decoration: none;
  color: white;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 25px;
  padding: 40px 25px;
  transition: 0.4s;
}

.menu-card:hover {
  transform: translateY(-10px);
  background: rgba(255,255,255,0.25);
}

.menu-card span {
  font-size: 4rem;
}

.menu-card h3 {
  margin-top: 20px;
  font-size: 1.5rem;
}

.menu-card p {
  margin-top: 10px;
}

.hidden {
  display: none;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-15px);
  }

  100% {
    transform: translateY(0px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {

  h1 {
    font-size: 2.5rem;
  }

  .mascota img {
    width: 160px;
  }

  .subtitle {
    font-size: 1rem;
  }

}
