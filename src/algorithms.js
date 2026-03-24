/**
 * Base Pathfinder class (Strategy Pattern)
 */
class Pathfinder {
    constructor() {
        this.nodesVisited = 0;
        this.startTime = 0;
        this.endTime = 0;
    }

    start() {
        this.nodesVisited = 0;
        this.startTime = performance.now();
    }

    stop() {
        this.endTime = performance.now();
    }

    getMetrics() {
        return {
            nodesVisited: this.nodesVisited,
            timeTaken: (this.endTime - this.startTime).toFixed(2) + "ms",
        };
    }

    getNeighbors(node, grid) {
        const neighbors = [];
        const { row, col } = node;
        const directions = [
            { r: -1, c: 0 }, { r: 1, c: 0 },
            { r: 0, c: -1 }, { r: 0, c: 1 }
        ];

        for (const dir of directions) {
            const newRow = row + dir.r;
            const newCol = col + dir.c;
            if (
                newRow >= 0 && newRow < grid.length &&
                newCol >= 0 && newCol < grid[0].length &&
                !grid[newRow][newCol].isWall
            ) {
                neighbors.push(grid[newRow][newCol]);
            }
        }
        return neighbors;
    }

    reconstructPath(endNode) {
        const path = [];
        let curr = endNode;
        while (curr !== null) {
            path.unshift(curr);
            curr = curr.previousNode;
        }
        return path;
    }
}

/**
 * Breadth-First Search (BFS)
 */
export class BFSPathfinder extends Pathfinder {
    async findPath(grid, startNode, endNode, onVisit) {
        this.start();
        const queue = [startNode];
        const visitedNodesInOrder = [];
        startNode.isVisited = true;

        while (queue.length > 0) {
            const curr = queue.shift();
            visitedNodesInOrder.push(curr);
            this.nodesVisited++;
            
            if (onVisit) await onVisit(curr);

            if (curr === endNode) {
                this.stop();
                return {
                    visitedNodesInOrder,
                    path: this.reconstructPath(endNode),
                    metrics: this.getMetrics()
                };
            }

            const neighbors = this.getNeighbors(curr, grid);
            for (const neighbor of neighbors) {
                if (!neighbor.isVisited) {
                    neighbor.isVisited = true;
                    neighbor.previousNode = curr;
                    queue.push(neighbor);
                }
            }
        }

        this.stop();
        return { visitedNodesInOrder, path: [], metrics: this.getMetrics() };
    }
}

/**
 * Depth-First Search (DFS)
 */
export class DFSPathfinder extends Pathfinder {
    async findPath(grid, startNode, endNode, onVisit) {
        this.start();
        const stack = [startNode];
        const visitedNodesInOrder = [];
        
        while (stack.length > 0) {
            const curr = stack.pop();
            
            if (curr.isVisited) continue;
            
            curr.isVisited = true;
            visitedNodesInOrder.push(curr);
            this.nodesVisited++;

            if (onVisit) await onVisit(curr);

            if (curr === endNode) {
                this.stop();
                return {
                    visitedNodesInOrder,
                    path: this.reconstructPath(endNode),
                    metrics: this.getMetrics()
                };
            }

            const neighbors = this.getNeighbors(curr, grid);
            for (const neighbor of neighbors) {
                if (!neighbor.isVisited) {
                    neighbor.previousNode = curr;
                    stack.push(neighbor);
                }
            }
        }

        this.stop();
        return { visitedNodesInOrder, path: [], metrics: this.getMetrics() };
    }
}

/**
 * A* Algorithm (A-Star)
 */
export class AStarPathfinder extends Pathfinder {
    async findPath(grid, startNode, endNode, onVisit) {
        this.start();
        const openSet = [startNode];
        const visitedNodesInOrder = [];

        startNode.g = 0;
        startNode.f = this.heuristic(startNode, endNode);

        while (openSet.length > 0) {
            // Sort by f-score (could use a priority queue for efficiency)
            openSet.sort((a, b) => a.f - b.f);
            const curr = openSet.shift();

            if (curr.isVisited) continue;
            curr.isVisited = true;
            visitedNodesInOrder.push(curr);
            this.nodesVisited++;

            if (onVisit) await onVisit(curr);

            if (curr === endNode) {
                this.stop();
                return {
                    visitedNodesInOrder,
                    path: this.reconstructPath(endNode),
                    metrics: this.getMetrics()
                };
            }

            const neighbors = this.getNeighbors(curr, grid);
            for (const neighbor of neighbors) {
                const tentativeG = curr.g + 1;
                if (tentativeG < neighbor.g) {
                    neighbor.previousNode = curr;
                    neighbor.g = tentativeG;
                    neighbor.f = neighbor.g + this.heuristic(neighbor, endNode);
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        this.stop();
        return { visitedNodesInOrder, path: [], metrics: this.getMetrics() };
    }

    heuristic(node, endNode) {
        // Manhattan distance
        return Math.abs(node.row - endNode.row) + Math.abs(node.col - endNode.col);
    }
}
