import {useEffect, useRef} from 'react';
import {LinkedList} from '../board/Board';

// min and max included
export function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min); 
}

// Copied from https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export function useInterval(callback, delay) {
    const savedCallback = useRef();
  
    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
  
    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

// Reverse a Linked List (as implemented in Board.jsx)
export function reverseSinglyLinkedList(list) {
    // if (print) {console.log('Before: list = ' + list.toString() + ' tail = ' + list.tail.value.getCell() + ' head = ' + list.head.value.getCell() + ' length = ' + list.length);}

	if (list.length === 1) {return list;}
        
    const first = list.tail;
    const rest = new LinkedList('');
    rest.tail = list.tail.next;
    rest.head = list.head;
    rest.length = list.length - 1;
    const revRest = reverseSinglyLinkedList(rest);
    first.next = null;
    revRest.head.next = first;
    revRest.head = first;
    revRest.length = list.length;

    list.head = revRest.head;
    list.tail = revRest.tail;

    // if (print) {
    //     console.log('After: revRest = ' + revRest.toString() + ' tail = ' + revRest.tail.value.getCell() + ' head = ' + revRest.head.value.getCell() + ' length = ' + revRest.length);
    //     console.log('After: list = ' + list.toString() + ' tail = ' + list.tail.value.getCell() + ' head = ' + list.head.value.getCell() + ' length = ' + list.length);
    // }
    return revRest;
}