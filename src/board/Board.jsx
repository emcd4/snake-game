import React, {useState} from 'react';
import {useInterval, randomIntFromInterval, reverseSinglyLinkedList} from '../lib/utils.js';

import './Board.css';

const BOARD_SIZE = 12;
const SNAKE_SPEED = 250;
const DELTA_SPEED = 10;
const DELTA_SCORE = 1;
const PROBABILITY_FOOD_REVERSES_SNAKE = 0.3;
const INVALID_DIRECTION = 'INVALID';

let direction;
let foodShouldReverseDirection;

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

export class LinkedListNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

export class LinkedList {
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
        let curr = this.tail;
        while(curr !== null) {
            str = str + `${curr.value.getCell()} -> `;
            curr = curr.next;
        }
        str = str + 'null';
        return str;
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
    const startPos = generateStartPosition(board);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [endMessage, setEndMessage] = useState("You Lose!");

    const [snake, setSnake] = useState(new LinkedList(startPos));
    const [snakeCells, setSnakeCells] = useState(new Set([startPos.cell]));
    const [snakeSpeed, setSnakeSpeed] = useState(SNAKE_SPEED);

    const [foodCell, setFoodCell] = useState(getFirstFoodCell());
    const [foodReversesSnake, setFoodReversesSnake] = useState(false);

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
        foodShouldReverseDirection = false;
    });

    const endGame = () => {
        displayElement('overlay');
        setGameOver(true);
    };

    const handleKeyDown = e => {
        const newDirection = getDirectionFromKey(e.key);
        const isValidDirection = newDirection !== INVALID_DIRECTION;
        if (!isValidDirection) return;
        const snakeWillRunIntoItself = snake.length > 1 && getOppositeDirection(newDirection) === direction;
        if (snakeWillRunIntoItself) return;
        direction = newDirection;
    };

    const aboutToHitWall = () => {
        const currHeadCoords = new Coords(snake.head.value.getRow(), snake.head.value.getCol());
        const nextHeadCoordinates = getNextCoords(currHeadCoords, direction);
        return isOutOfBounds(nextHeadCoordinates);
    }

    const aboutToEatSelf = () => {
        const currHeadCoords = new Coords(snake.head.value.getRow(), snake.head.value.getCol());
        const nextHeadCoordinates = getNextCoords(currHeadCoords, direction);
        const nextHeadCellValue = getCellValueFromCoords(board, nextHeadCoordinates);
        return snakeCells.has(nextHeadCellValue);
    }

    const aboutToEatFood = () => {
        const currHeadCoords = new Coords(snake.head.value.getRow(), snake.head.value.getCol());
        const nextHeadCoordinates = getNextCoords(currHeadCoords, direction);
        const nextHeadCellValue = getCellValueFromCoords(board, nextHeadCoordinates);
        return nextHeadCellValue === foodCell;
    }

    const moveSnake = () => {        
        if (aboutToHitWall()) {
            setEndMessage("Snake hit the wall!");
            endGame();
            return;
        }

        if (aboutToEatSelf()) {
            setEndMessage("Snake ate it's tail!");
            endGame();
            return;
        }

        if (aboutToEatFood()) {
            consumeFood();
        }

        const tailCell = snake.tail.value.getCell();

        const currHeadCoords = new Coords(snake.head.value.getRow(), snake.head.value.getCol());
        const nextHeadCoordinates = getNextCoords(currHeadCoords, direction);
        const nextHeadCellValue = getCellValueFromCoords(board, nextHeadCoordinates);

        const newHead = new LinkedListNode(new CellData(nextHeadCoordinates, nextHeadCellValue));
        snake.addNodeToStart(newHead);
        snake.removeLastNode();

        const newSnakeCells = new Set(snakeCells);
        newSnakeCells.add(newHead.value.getCell());
        newSnakeCells.delete(tailCell);

        setSnakeCells(newSnakeCells);
    };

    const growSnake = () => {
        const growDirection = getOppositeDirectionOfNode(snake.tail, direction);

        const currTailCoords = new Coords(snake.tail.value.getRow(), snake.tail.value.getCol());
        const newCoords = getNextCoords(currTailCoords, growDirection);
        const newCellValue = getCellValueFromCoords(board, newCoords);

        const newNode = new LinkedListNode(new CellData(newCoords, newCellValue));
        snake.addNodeToEnd(newNode);
        setSnake(snake);

        const newSnakeCells = new Set(snakeCells);
        newSnakeCells.add(newCellValue);
        setSnakeCells(newSnakeCells);
    };

    const reverseSnake = () => {
        const newDirection = getOppositeDirection(getNodeDirection(snake.tail));
        const newSnake = reverseSinglyLinkedList(snake);
        setSnake(newSnake);
        direction = newDirection;
    };

    const consumeFood = () => {
        if (foodReversesSnake) reverseSnake();
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
    };

    const incrementScore = () => {
        setScore(score + DELTA_SCORE);
    };

    const getNextFoodCell = () => {
        let nextFoodCell;

        setFoodReversesSnake(Math.random() < PROBABILITY_FOOD_REVERSES_SNAKE);

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
            if (foodReversesSnake) {
                cellStyle = 'reverse-food-cell';
            } else {
                cellStyle = 'food-cell';
            }
        }
        if (snakeCells.has(cellValue)) {
            cellStyle = 'snake-cell';
        }
        return cellStyle;
    };

    const reload = () => {
        window.location.reload();
    };

    return (
        <div className="content">
            <div id="overlay" className="overlay">
                <h1 className="header">Game Over</h1>
                <p className="paragraph">{endMessage}</p>
                <button className="button" onClick={reload}>Restart</button>
            </div>
            <div className="title">Snake Game</div>
            <div>
                <div className="score">Score: {score}</div>
                <div className="board">
                    {board.map((row, rowIdx) => {
                        return <div key={rowIdx} className="row">
                            {row.map((cellValue, cellIdx) => {
                                return <div 
                                key={cellIdx} 
                                className={`cell ${getCellStyle(cellValue)}`}>{}</div>
                            })}
                        </div>
                    })}
                </div>
            </div>
    </div>
    );
};

const displayElement = (elementId) => {
    document.getElementById(elementId).style.display = "block";
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
    if (node === null || node.next === null) return direction;
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
};

const getDirectionFromKey = (key) => {
    if (key === 'ArrowUp') return Direction.UP;
    if (key === 'ArrowDown') return Direction.DOWN;
    if (key === 'ArrowRight') return Direction.RIGHT;
    if (key === 'ArrowLeft') return Direction.LEFT;
    return INVALID_DIRECTION;
};

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
    return direction !== INVALID_DIRECTION;
};

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
    return INVALID_DIRECTION;
};

const getOppositeDirectionOfNode = (node, direction) => {
    const nodeDirection = getNodeDirection(node);
    const tailDirection = isValidDirection(nodeDirection) ? nodeDirection : direction;
    const growDirection = getOppositeDirection(tailDirection);
    return growDirection;
};

const getCellValueFromCoords = (board, coords) => {
    return board[coords.row][coords.col];
};

const getCoordsFromCellValue = (cellVal) => {
    let row = Math.floor((cellVal-1)/BOARD_SIZE);
    let col = (cellVal % BOARD_SIZE) - 1;
    if ((cellVal % BOARD_SIZE) === 0) {
        col = BOARD_SIZE - 1;
    }
    return new Coords(row, col);
};

const generateStartPosition = (board) => {
    const cellVal = (BOARD_SIZE * 6) - (BOARD_SIZE - 3);
    const coords = getCoordsFromCellValue(cellVal);
    return new CellData(coords, cellVal);
};

const getFirstFoodCell = () => {
    return (BOARD_SIZE * 6) - 2;
};

const isOutOfBounds = (coords) => {
    return coords.row >= BOARD_SIZE || coords.row < 0 || coords.col >= BOARD_SIZE || coords.col < 0;
};

export default Board;