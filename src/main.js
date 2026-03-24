import { Grid } from './grid.js';
import { BFSPathfinder, DFSPathfinder, AStarPathfinder } from './algorithms.js';

const ROWS = 25;
const COLS = 50;

let grid;
let isPainting = false;
let isMovingStart = false;
let isMovingEnd = false;
let isRunning = false;
let speed = 50;

const gridContainer = document.getElementById('grid-container');
const algoSelect = document.getElementById('algo-select');
const speedRange = document.getElementById('speed-range');
const startBtn = document.getElementById('start-btn');
const clearBoardBtn = document.getElementById('clear-board-btn');
const clearWallsBtn = document.getElementById('clear-walls-btn');
const randomMazeBtn = document.getElementById('random-maze-btn');
const statusBadge = document.getElementById('app-status');

const statNodesVisited = document.getElementById('stat-nodes-visited');
const statPathLength = document.getElementById('stat-path-length');
const statTime = document.getElementById('stat-time');
const statComplexity = document.getElementById('stat-complexity');

const bars = {
    astar: document.getElementById('bar-astar'),
    bfs: document.getElementById('bar-bfs'),
    dfs: document.getElementById('bar-dfs')
};

// Initialization
function init() {
    grid = new Grid(ROWS, COLS);
    renderGrid();
    setupEventListeners();
}

function renderGrid() {
    gridContainer.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;
    gridContainer.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    gridContainer.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const node = grid.nodes[r][c];
            const div = document.createElement('div');
            div.id = `node-${r}-${c}`;
            div.className = 'node';
            if (node.isStart) div.classList.add('node-start');
            if (node.isEnd) div.classList.add('node-end');
            if (node.isWall) div.classList.add('node-wall');
            
            div.addEventListener('mousedown', (e) => handleMouseDown(r, c, e));
            div.addEventListener('mouseenter', () => handleMouseEnter(r, c));
            div.addEventListener('mouseup', () => handleMouseUp());
            
            gridContainer.appendChild(div);
        }
    }
}

function updateNodeUI(r, c) {
    const node = grid.nodes[r][c];
    const div = document.getElementById(`node-${r}-${c}`);
    if (!div) return;

    div.className = 'node';
    if (node.isStart) div.classList.add('node-start');
    else if (node.isEnd) div.classList.add('node-end');
    else if (node.isWall) div.classList.add('node-wall');
    else if (node.isPath) div.classList.add('node-path');
    else if (node.isVisited) div.classList.add('node-visited');
}

// Handlers
function handleMouseDown(r, c, e) {
    if (isRunning) return;
    const node = grid.nodes[r][c];
    if (node.isStart) isMovingStart = true;
    else if (node.isEnd) isMovingEnd = true;
    else {
        isPainting = true;
        grid.toggleWall(r, c);
        updateNodeUI(r, c);
    }
}

function handleMouseEnter(r, c) {
    if (isRunning) return;
    const node = grid.nodes[r][c];
    if (isMovingStart) {
        if (!node.isEnd && !node.isWall) {
            grid.setStart(r, c);
            renderGrid(); // Redraw for simplicity, can be optimized
        }
    } else if (isMovingEnd) {
        if (!node.isStart && !node.isWall) {
            grid.setEnd(r, c);
            renderGrid();
        }
    } else if (isPainting) {
        grid.toggleWall(r, c);
        updateNodeUI(r, c);
    }
}

function handleMouseUp() {
    isPainting = false;
    isMovingStart = false;
    isMovingEnd = false;
}

function setupEventListeners() {
    startBtn.addEventListener('click', startVisualization);
    clearBoardBtn.addEventListener('click', () => {
        if (isRunning) return;
        grid.reset();
        renderGrid();
        resetStats();
    });
    clearWallsBtn.addEventListener('click', () => {
        if (isRunning) return;
        grid.clearWalls();
        renderGrid();
    });
    randomMazeBtn.addEventListener('click', () => {
        if (isRunning) return;
        generateRandomMaze();
    });
    speedRange.addEventListener('input', (e) => {
        speed = 101 - e.target.value; // Invert so higher value = faster
    });
}

function generateRandomMaze() {
    grid.clearWalls();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (Math.random() < 0.25) {
                grid.toggleWall(r, c);
            }
        }
    }
    renderGrid();
}

async function startVisualization() {
    if (isRunning) return;
    isRunning = true;
    grid.reset();
    renderGrid();
    statusBadge.innerText = 'Running...';
    statusBadge.style.background = 'rgba(255, 184, 0, 0.1)';
    statusBadge.style.color = '#ffb800';

    const algoType = algoSelect.value;
    let pathfinder;
    let complexityLabel = "";

    switch (algoType) {
        case 'bfs': 
            pathfinder = new BFSPathfinder(); 
            complexityLabel = "O(V + E)";
            break;
        case 'dfs': 
            pathfinder = new DFSPathfinder(); 
            complexityLabel = "O(V + E)";
            break;
        case 'astar': 
            pathfinder = new AStarPathfinder(); 
            complexityLabel = "O(E log V)";
            break;
    }

    statComplexity.innerText = complexityLabel;

    const result = await pathfinder.findPath(
        grid.nodes, 
        grid.startNode, 
        grid.endNode, 
        async (node) => {
            updateNodeUI(node.row, node.col);
            statNodesVisited.innerText = pathfinder.nodesVisited;
            await new Promise(r => setTimeout(r, speed));
        }
    );

    if (result.path.length > 0) {
        for (const node of result.path) {
            node.isPath = true;
            updateNodeUI(node.row, node.col);
            await new Promise(r => setTimeout(r, 10));
        }
    }

    statPathLength.innerText = result.path.length;
    statTime.innerText = result.metrics.timeTaken;
    updateComparisonChart(algoType, result);

    isRunning = false;
    statusBadge.innerText = result.path.length > 0 ? 'Success' : 'No Path Found';
    statusBadge.style.background = result.path.length > 0 ? 'rgba(0, 255, 163, 0.1)' : 'rgba(255, 60, 0, 0.1)';
    statusBadge.style.color = result.path.length > 0 ? 'var(--accent)' : 'var(--end)';
}

function updateComparisonChart(type, result) {
    const maxNodes = ROWS * COLS;
    const percentage = (result.visitedNodesInOrder.length / maxNodes) * 100;
    if (bars[type]) {
        bars[type].style.width = `${percentage}%`;
    }
}

function resetStats() {
    statNodesVisited.innerText = '0';
    statPathLength.innerText = '0';
    statTime.innerText = '0ms';
    statComplexity.innerText = '-';
    statusBadge.innerText = 'Ready';
    statusBadge.style.background = 'rgba(0, 255, 163, 0.1)';
    statusBadge.style.color = 'var(--accent)';
    Object.values(bars).forEach(bar => bar.style.width = '0%');
}

init();
