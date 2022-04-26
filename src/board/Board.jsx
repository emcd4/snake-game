import React, {useState, useEffect} from 'react';
import {useInterval, randomIntFromInterval} from '../lib/utils.js';

import './Board.css';

const BOARD_SIZE = 12;
const DELTA_SPEED = 10;
const DELTA_SCORE = 1;

let direction;

class CellData {
    constructor(coords, cell) {
        this.coords = coords;
        this.cell = cell;
    }

    getRow() {
        return this.coords.row;
    }

    getCol() {
        return this.coords.col;
    }

    getCell() {
        return this.cell;
    }
}

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

// Top left corner is (x = 0, y = 0)
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
    const START_POS = generateStartPosition(board);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const [snake, setSnake] = useState(new LinkedList(START_POS));
    const [snakeCells, setSnakeCells] = useState(new Set([START_POS.cell]));
    const [snakeSpeed, setSnakeSpeed] = useState(250);

    const [foodCell, setFoodCell] = useState(generateFirstFoodCell());

    useInterval(() => {
        if (!gameOver) {
            moveSnake();
        }
    }, snakeSpeed);

    document.onkeydown = function (e) {
        handleKeyDown(e);
    };

    window.addEventListener('load', e => {
        direction = Direction.DOWN;
    });

    const endGame = () => {
        setGameOver(true);
    };

    const handleKeyDown = e => {
        const newDirection = getDirectionFromKey(e.key);
        const isValidDirection = newDirection !== '';
        if (!isValidDirection) return;
        const snakeWillRunIntoItself = snake.length > 1 && getOppositeDirection(newDirection) === direction;
        if (snakeWillRunIntoItself) return;
        direction = newDirection;
    };

    const moveSnake = () => {
        const currHeadCoords = new Coords(snake.head.value.getRow(), snake.head.value.getCol());
        const tailCell = snake.tail.value.getCell();
        const nextHeadCoordinates = getNextCoords(currHeadCoords, direction);
        if (isOutOfBounds(nextHeadCoordinates)) {
            console.log("Out of Bounds!");
            endGame();
            return;
        }
        const nextHeadCellValue = getCellValueFromCoords(board, nextHeadCoordinates);
        if (snakeCells.has(nextHeadCellValue)) {
            console.log("Collision!");
            endGame();
            return;
        }

        if (nextHeadCellValue === foodCell) {
            consumeFood();
        }

        const newHead = new LinkedListNode(new CellData(nextHeadCoordinates, nextHeadCellValue));
        snake.addNodeToStart(newHead);
        snake.removeLastNode();

        const newSnakeCells = new Set(snakeCells);
        newSnakeCells.add(newHead.value.getCell());
        newSnakeCells.delete(tailCell);

        setSnakeCells(newSnakeCells);
    };

    const growSnake = () => {
        const growDirection = getGrowDirection(snake.tail, direction);

        const currTailCoords = new Coords(snake.tail.value.getRow(), snake.tail.value.getCol());
        const newCoords = getNextCoords(currTailCoords, growDirection);
        const newCellValue = getCellValueFromCoords(board, newCoords);

        const newNode = new LinkedListNode(new CellData(newCoords, newCellValue));
        snake.addNodeToEnd(newNode);
        
        const newSnakeCells = new Set(snakeCells);
        newSnakeCells.add(newCellValue);
        setSnakeCells(newSnakeCells);
    };

    const consumeFood = () => {
        let nextFoodCell = getNextFoodCell();
        setFoodCell(nextFoodCell);
        increaseSpeed();
        incrementScore();
        growSnake();
    };

    const increaseSpeed = () => {
        if (snakeSpeed > 100) {
            setSnakeSpeed(snakeSpeed - DELTA_SPEED);
        }
    }

    const incrementScore = () => {
        setScore(score + DELTA_SCORE);
    }

    const getNextFoodCell = () => {
        let nextFoodCell;
        while (true) {
            nextFoodCell = randomIntFromInterval(1, BOARD_SIZE * BOARD_SIZE);
            if (foodCell !== nextFoodCell && !snakeCells.has(nextFoodCell)) {
                return nextFoodCell;
            }
        }
    };

    const getCellStyle = (cellValue) => {
        let cellStyle = '';
        if (foodCell === cellValue) {
            cellStyle = 'food-cell'; 
        }
        if (snakeCells.has(cellValue)) {
            cellStyle = 'snake-cell';
        }
        return cellStyle;
    };

    return (
        <div>
            <div className="title">Snake Game</div>
            <div className="score">Score: {score}</div>
            <div className="board">
                {board.map((row, rowIdx) => {
                    return <div key={rowIdx} className="row">
                        {row.map((cellValue, cellIdx) => {
                            return <div 
                            key={cellIdx} 
                            className={`cell ${getCellStyle(cellValue)}`}>{cellValue}</div>
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
    if (node.value.getRow() > next.value.getRow()) {
        return Direction.UP;
    }
    if (node.value.getRow() < next.value.getRow()) {
        return Direction.DOWN;
    }
    if (node.value.getCol() < next.value.getCol()) {
        return Direction.RIGHT;
    }
    if (node.value.getCol() > next.value.getCol()) {
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
            newCoords = new Coords(
                coords.row - 1,
                coords.col
            );
            break;
        case Direction.DOWN:
            newCoords = new Coords(
                coords.row + 1,
                coords.col
            );
            break;
        case Direction.RIGHT:
            newCoords = new Coords(
                coords.row,
                coords.col + 1
            );
            break;
        case Direction.LEFT:
            newCoords = new Coords(
                coords.row,
                coords.col - 1
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

const generateStartPosition = (board) => {
    const rowVal = Math.floor(BOARD_SIZE / 2);
    const colVal = Math.floor(BOARD_SIZE / 2)
    const coords = new Coords(rowVal, colVal);
    const cellVal = getCellValueFromCoords(board, coords);
    return new CellData(coords, cellVal);
}

const generateFirstFoodCell = () => {
    return (BOARD_SIZE * 3) - Math.floor(BOARD_SIZE / 3);
}

const isOutOfBounds = (coords) => {
    return coords.row >= BOARD_SIZE || coords.row < 0 || coords.col >= BOARD_SIZE || coords.col < 0;
}

export default Board;