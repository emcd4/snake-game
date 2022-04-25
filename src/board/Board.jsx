import React, {useState, useEffect} from 'react';
import {useInterval, useUpdate} from '../lib/utils.js';

import './Board.css';

const BOARD_SIZE = 10;

let direction;

const START_POS = {
    row: 0,
    col: 4,
    cell: 5
};

class LinkedListNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class LinkedList {
    constructor(value) {
        const node = new LinkedListNode(value);
        this.head = node;
        this.tail = node;
        this.length = 1;
    }

    addNodeToStart(newNode) {
        this.head.next = newNode;
        this.head = newNode;
        this.length = this.length + 1;
    }

    removeLastNode() {
        this.tail = this.tail.next;
        this.length = this.length - 1;
    }

    addNodeToEnd(newNode) {
        newNode.next = this.tail;
        this.tail = newNode;
        this.length = this.length + 1;
    }
}

class Coords {
    constructor(x, y) {
        this.row = x;
        this.col = y;
    }
}

const Direction = {
    UP: 'UP',
    DOWN: 'DOWN',
    RIGHT: 'RIGHT',
    LEFT: 'LEFT'
};

const Board = () => {
    const [board, setBoard] = useState(createBoard(BOARD_SIZE));
    const [snakeCells, setSnakeCells] = useState(new Set([START_POS.cell]));
    const [snake, setSnake] = useState(new LinkedList(START_POS));

    useInterval(() => {
        moveSnake();
    }, 250);

    document.onkeydown = function (e) {
        handleKeyDown(e);
    };

    window.addEventListener('load', e => {
        direction = Direction.DOWN;
    });

    const handleKeyDown = e => {
        const newDirection = getDirectionFromKey(e.key);
        const isValidDirection = newDirection !== '';
        if (!isValidDirection) return;
        const snakeWillRunIntoItself = snake.length > 1 && getOppositeDirection(newDirection) === direction;
        if (snakeWillRunIntoItself) return;
        direction = newDirection;
    };

    const moveSnake = () => {
        const currHeadCoords = new Coords(snake.head.value.row, snake.head.value.col);
        const nextHeadCoordinates = getNextCoords(currHeadCoords, direction);
        const nextHeadCellValue = getCellValueFromCoords(board, nextHeadCoordinates);
        const tailCell = snake.tail.value.cell;

        const newHead = new LinkedListNode({
            row: nextHeadCoordinates.row,
            col: nextHeadCoordinates.col,
            cell: nextHeadCellValue
        });
        snake.addNodeToStart(newHead);
        snake.removeLastNode();

        const newSnakeCells = new Set(snakeCells);
        newSnakeCells.add(newHead.value.cell);
        newSnakeCells.delete(tailCell);

        setSnakeCells(newSnakeCells);
    };

    const growSnake = () => {
        const growDirection = getGrowDirection(snake.tail, direction);

        const currTailCoords = new Coords(snake.tail.value.row, snake.tail.value.col);
        const newCoords = getNextCoords(currTailCoords, growDirection);
        const newCellValue = getCellValueFromCoords(board, newCoords);

        const newNode = new LinkedListNode({
            row: newCoords.row,
            col: newCoords.col,
            cell: newCellValue
        });
        snake.addNodeToEnd(newNode);
        
        const newSnakeCells = new Set(snakeCells);
        newSnakeCells.add(newCellValue);
        setSnakeCells(newSnakeCells);
    };

    return (
        <div>
            <button onClick={growSnake}>Grow Snake</button>
            <div className="board">
                {board.map((row, rowIdx) => {
                    return <div key={rowIdx} className="row">
                        {row.map((cellValue, cellIdx) => {
                            return <div 
                            key={cellIdx} 
                            className={`cell ${snakeCells.has(cellValue) ? "snake-cell" : ""}`}>{}</div>
                        })}
                    </div>
                })}
            </div>
        </div>
    );
};

const createBoard = (BOARD_SIZE) => {
    let counter = 1;
    const board = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        const currentRow = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            currentRow.push(counter);
            counter++;
        }
        board.push(currentRow);
    }
    return board;
};

const getNodeDirection = (node) => {
    if (node === null || node.next === null) return '';
    const next = node.next;
    if (node.value.row > next.value.row) {
        return Direction.UP;
    }
    if (node.value.row < next.value.row) {
        return Direction.DOWN;
    }
    if (node.value.col < next.value.col) {
        return Direction.RIGHT;
    }
    if (node.value.col > next.value.col) {
        return Direction.LEFT;
    }
}

const getDirectionFromKey = (key) => {
    if (key === 'ArrowUp') return Direction.UP;
    if (key === 'ArrowDown') return Direction.DOWN;
    if (key === 'ArrowRight') return Direction.RIGHT;
    if (key === 'ArrowLeft') return Direction.LEFT;
    return '';
}

const getNextCoords = (coords, dir) => {
    let newCoords;
    switch (dir) {
        case Direction.UP:
            let newRowCoord;
            if (coords.row - 1 < 0) {
                newRowCoord = BOARD_SIZE - 1;
            } else {
                newRowCoord = coords.row - 1
            }
            newCoords = new Coords(
                newRowCoord,
                coords.col
            );
            break;
        case Direction.DOWN:
            newCoords = new Coords(
                (coords.row + 1) % BOARD_SIZE,
                coords.col
            );
            break;
        case Direction.RIGHT:
            newCoords = new Coords(
                coords.row,
                (coords.col + 1) % BOARD_SIZE
            );
            break;
        case Direction.LEFT:
            let newColCoord;
            if (coords.col - 1 < 0) {
                newColCoord = BOARD_SIZE - 1;
            } else {
                newColCoord = coords.col - 1
            }
            newCoords = new Coords(
                coords.row,
                newColCoord
            );
            break;
    }
    return newCoords;
};

const isValidDirection = (direction) => {
    return direction !== '';
}

const getOppositeDirection = (direction) => {
    switch(direction) {
        case Direction.UP:
            return Direction.DOWN;
        case Direction.DOWN:
            return Direction.UP;
        case Direction.RIGHT:
            return Direction.LEFT;
        case Direction.LEFT:
            return Direction.RIGHT;
    }
    return '';
}

const getGrowDirection = (tail, direction) => {
    const nodeDirection = getNodeDirection(tail);
    const tailDirection = isValidDirection(nodeDirection) ? nodeDirection : direction;
    const growDirection = getOppositeDirection(tailDirection);
    return growDirection;
}

const getCellValueFromCoords = (board, coords) => {
    return board[coords.row][coords.col];
}

export default Board;