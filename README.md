Inclined Plane — Resolution of Forces Simulator

Overview

This small static project demonstrates resolution of forces on an inclined plane. It computes weight, normal force, component of weight along the plane, maximum friction, the friction used, net force and acceleration. It also visualizes the incline, block and force vectors.

Formulas

- Weight: W = m * g
- Normal force: N = W * cos(θ)
- Component along plane: W_parallel = W * sin(θ)
- Max friction (static/kinetic simplification): f_max = µ * N
- Net force down the plane: F_net = W_parallel - f_used (if sliding)
- Acceleration: a = F_net / m

Files

- `index.html` — UI and canvas
- `styles.css` — styles
- `app.js` — calculator and rendering logic

How to run

Open `index.html` in a browser (double-click or right-click → Open with...). The page is fully static and requires no server.

Notes and assumptions

- The simulator treats friction simply: if W_parallel <= f_max, block is static (no net force). Otherwise friction = f_max and block slides down.
- Vectors are scaled for visualization and don't reflect exact on-screen distances in real units.

Next steps you might want

- Add an option for kinetic friction separate from static friction
- Animate the block sliding when it accelerates
- Add numeric time-based motion simulation

