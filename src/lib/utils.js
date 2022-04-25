import {useEffect, useRef} from 'react';

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
