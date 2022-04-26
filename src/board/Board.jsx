import React, {useState, useEffect} from 'react';
import {useInterval, randomIntFromInterval} from '../lib/utils.js';

import './Board.css';

const BOARD_SIZE = 12;
const SNAKE_SPEED = 250;
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

    toString() {
        let str = '';
        let curr = this.head;
        while(curr !== null) {
            str = str + `${curr.value.getCell()} -> `;
            curr = curr.next;
        }
        str = str + 'null';
        return str
    }

    newList(value) {
        const node = new LinkedListNode(value);
        this.head = node;
        this.tail = node;
        this.length = 1;
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

let restart = false;

const Board = () => {
    const [board, setBoard] = useState(createBoard(BOARD_SIZE));
    const startPos = generateStartPosition(board);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [endMessage, setEndMessage] = useState("You Lose!");


    const [snake, setSnake] = useState(new LinkedList(startPos));
    const [snakeCells, setSnakeCells] = useState(new Set([startPos.cell]));
    const [snakeSpeed, setSnakeSpeed] = useState(SNAKE_SPEED);

    const [foodCell, setFoodCell] = useState(getFirstFoodCell());

    useInterval(() => {
        if (!gameOver) {
            moveSnake();
        }
    }, snakeSpeed);

    document.onkeydown = function (e) {
        handleKeyDown(e);
    };

    window.addEventListener('load', e => {
        direction = Direction.RIGHT;
    });

    const endGame = () => {
        displayElement('overlay');
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
            setEndMessage("Snake hit the wall!");
            endGame();
            return;
        }
        const nextHeadCellValue = getCellValueFromCoords(board, nextHeadCoordinates);
        if (snakeCells.has(nextHeadCellValue)) {
            setEndMessage("Snake ate it's tail!");
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

    const reload = () => {
        window.location.reload();
    }

    return (
        <div class="content">
            <div id="overlay" class="overlay">
                <h1 class="header">Game Over</h1>
                <p class="paragraph">{endMessage}</p>
                <button class="button" onClick={reload}>Restart</button>
            </div>
            <div class="title">Snake Game</div>
            <div>
                <div class="score">Score: {score}</div>
                <div class="board">
                    {board.map((row, rowIdx) => {
                        return <div key={rowIdx} class="row">
                            {row.map((cellValue, cellIdx) => {
                                return <div 
                                key={cellIdx} 
                                class={`cell ${getCellStyle(cellValue)}`}>{}</div>
                            })}
                        </div>
                    })}
                </div>
            </div>
    </div>
    );
};

function displayElement(elementId) {
    document.getElementById(elementId).style.display = "block";
}

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

const getCoordsFromCellValue = (cellVal) => {
    let row = Math.floor((cellVal-1)/BOARD_SIZE);
    let col = (cellVal % BOARD_SIZE) - 1;
    if ((cellVal % BOARD_SIZE) === 0) {
        col = BOARD_SIZE - 1;
    }
    return new Coords(row, col);
}

const generateStartPosition = (board) => {
    const cellVal = (BOARD_SIZE * 6) - (BOARD_SIZE - 3);
    const coords = getCoordsFromCellValue(cellVal);
    return new CellData(coords, cellVal);
}

const getFirstFoodCell = () => {
    return (BOARD_SIZE * 6) - 2;
}

const isOutOfBounds = (coords) => {
    return coords.row >= BOARD_SIZE || coords.row < 0 || coords.col >= BOARD_SIZE || coords.col < 0;
}

export default Board;