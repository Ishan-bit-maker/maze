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
            if (node.isStart) {
                div.classList.add('node-start');
                const character = document.createElement('div');
                character.id = 'steve-character';
                character.className = 'character';
                div.appendChild(character);
            }
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

    // Save character if it's there
    const character = document.getElementById('steve-character');
    const isCharacterHere = div.contains(character);

    // Reset keeping only 'node' base class
    div.className = 'node';
    
    if (node.isStart) div.classList.add('node-start');
    else if (node.isEnd) div.classList.add('node-end');
    else if (node.isWall) div.classList.add('node-wall');
    else if (node.isPath) div.classList.add('node-path');
    else if (node.isVisited) div.classList.add('node-visited');

    if (isCharacterHere && character) {
        div.appendChild(character);
    }
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
            renderGrid();
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
        generateRecursiveMaze();
    });
    speedRange.addEventListener('input', (e) => {
        speed = 101 - e.target.value;
    });
}

async function generateRecursiveMaze() {
    isRunning = true;
    grid.clearWalls();
    
    // Fill with walls
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            grid.nodes[r][c].isWall = true;
        }
    }

    const unvisited = [];
    for (let r = 0; r < ROWS; r += 2) {
        for (let c = 0; c < COLS; c += 2) {
            unvisited.push(`${r}-${c}`);
        }
    }

    const stack = [];
    let current = grid.nodes[0][0];
    current.isWall = false;
    stack.push(current);

    while (stack.length > 0) {
        const neighbors = [];
        const dr = [-2, 2, 0, 0];
        const dc = [0, 0, -2, 2];

        for (let i = 0; i < 4; i++) {
            const nr = stack[stack.length - 1].row + dr[i];
            const nc = stack[stack.length - 1].col + dc[i];
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid.nodes[nr][nc].isWall) {
                neighbors.push(grid.nodes[nr][nc]);
            }
        }

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            const wallR = (stack[stack.length - 1].row + next.row) / 2;
            const wallC = (stack[stack.length - 1].col + next.col) / 2;
            grid.nodes[wallR][wallC].isWall = false;
            next.isWall = false;
            stack.push(next);
            if (Math.random() > 0.3) renderGrid(); // Visual feedback
            await new Promise(r => setTimeout(r, 5));
        } else {
            stack.pop();
        }
    }

    // Ensure start and end are passages
    grid.startNode.isWall = false;
    grid.endNode.isWall = false;
    
    renderGrid();
    isRunning = false;
}

async function startVisualization() {
    if (isRunning) return;
    isRunning = true;
    grid.reset();
    renderGrid();
    statusBadge.innerText = 'RUNNING...';
    statusBadge.style.color = '#ffff00';

    const algoType = algoSelect.value;
    let pathfinder;
    switch (algoType) {
        case 'bfs': pathfinder = new BFSPathfinder(); break;
        case 'dfs': pathfinder = new DFSPathfinder(); break;
        case 'astar': pathfinder = new AStarPathfinder(); break;
    }

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
        const character = document.getElementById('steve-character');
        for (const node of result.path) {
            node.isPath = true;
            updateNodeUI(node.row, node.col);
            
            // Move character
            const nodeDiv = document.getElementById(`node-${node.row}-${node.col}`);
            if (nodeDiv && character) {
                nodeDiv.appendChild(character);
            }
            
            await new Promise(r => setTimeout(r, 30));
        }
    }

    statPathLength.innerText = result.path.length;
    statTime.innerText = result.metrics.timeTaken;
    updateComparisonChart(algoType, result);

    isRunning = false;
    statusBadge.innerText = result.path.length > 0 ? 'SUCCESS!' : 'NO PATH!';
    statusBadge.style.color = result.path.length > 0 ? '#00ff00' : '#ff0000';
}

function updateComparisonChart(type, result) {
    const maxNodes = ROWS * COLS;
    const percentage = (result.visitedNodesInOrder.length / maxNodes) * 100;
    if (bars[type]) bars[type].style.width = `${percentage}%`;
}

function resetStats() {
    statNodesVisited.innerText = '0';
    statPathLength.innerText = '0';
    statTime.innerText = '0ms';
    statComplexity.innerText = '-';
    statusBadge.innerText = 'READY';
    statusBadge.style.color = '#00ff00';
    Object.values(bars).forEach(bar => bar.style.width = '0%');
}

init();
