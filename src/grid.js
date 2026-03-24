/**
 * Node class to represent each cell in the grid
 */
export class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.isStart = false;
        this.isEnd = false;
        this.isWall = false;
        this.isVisited = false;
        this.isPath = false;
        this.previousNode = null;
        this.g = Infinity;
        this.f = Infinity;
    }
}

/**
 * Grid class to manage the maze grid
 */
export class Grid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.nodes = [];
        this.startNode = null;
        this.endNode = null;
        this.init();
    }

    init() {
        this.nodes = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push(new Node(r, c));
            }
            this.nodes.push(row);
        }
        
        // Set default start and end nodes
        this.setStart(5, 5);
        this.setEnd(this.rows - 6, this.cols - 6);
    }

    setStart(row, col) {
        if (this.startNode) this.startNode.isStart = false;
        this.startNode = this.nodes[row][col];
        this.startNode.isStart = true;
        this.startNode.isWall = false;
    }

    setEnd(row, col) {
        if (this.endNode) this.endNode.isEnd = false;
        this.endNode = this.nodes[row][col];
        this.endNode.isEnd = true;
        this.endNode.isWall = false;
    }

    toggleWall(row, col) {
        const node = this.nodes[row][col];
        if (!node.isStart && !node.isEnd) {
            node.isWall = !node.isWall;
        }
    }

    reset() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const node = this.nodes[r][c];
                node.isVisited = false;
                node.isPath = false;
                node.previousNode = null;
                node.g = Infinity;
                node.f = Infinity;
            }
        }
    }

    clearWalls() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.nodes[r][c].isWall = false;
            }
        }
    }
}
