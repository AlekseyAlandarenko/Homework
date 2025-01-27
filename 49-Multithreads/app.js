'use strict';

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const { performance } = require('perf_hooks');

function main() {
  if (isMainThread) {
    const array = generateArray(300000);

    console.log('Запуск линейного подхода...');
    linearCountDivisibleByThree(array);

    console.log('\nЗапуск многопоточного подхода...');
    multithreadedCountDivisibleByThree(array);
  } else {
    processWorkerData();
  }
}

function generateArray(size) {
  return Array.from({ length: size }, (_, i) => i + 1);
}

function linearCountDivisibleByThree(array) {
  performance.mark('linear-start');
  const divisibleByThree = array.filter(num => num % 3 === 0).length;
  performance.mark('linear-end');

  performance.measure('linearCountDivisibleByThree', 'linear-start', 'linear-end');
  const [measure] = performance.getEntriesByName('linearCountDivisibleByThree');
  console.log(`Линейный подход: ${divisibleByThree} чисел найдены за ${measure.duration.toFixed(2)} мс`);
  performance.clearMarks();
  performance.clearMeasures();
}

function multithreadedCountDivisibleByThree(array) {
  const numThreads = os.cpus().length;
  const chunks = splitArrayIntoChunks(array, numThreads);

  let completedThreads = 0;
  let divisibleByThree = 0;

  performance.mark('multithreaded-start');

  chunks.forEach(chunk => {
    const worker = new Worker(__filename, { workerData: chunk });

    worker.on('message', count => {
      divisibleByThree += count;
      completedThreads++;
      if (completedThreads === numThreads) {
        handleMultithreadedCompletion(divisibleByThree);
      }
    });

    worker.on('error', err => {
      console.error(`Ошибка в потоке: ${err.message}`);
    });
  });
}

function splitArrayIntoChunks(array, numChunks) {
  const chunkSize = Math.ceil(array.length / numChunks);
  const chunks = [];
  for (let i = 0; i < numChunks; i++) {
    chunks.push(array.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  return chunks;
}

function handleMultithreadedCompletion(divisibleByThree) {
  performance.mark('multithreaded-end');
  performance.measure('multithreadedCountDivisibleByThree', 'multithreaded-start', 'multithreaded-end');
  const [measure] = performance.getEntriesByName('multithreadedCountDivisibleByThree');
  console.log(`Многопоточный подход: ${divisibleByThree} чисел найдены за ${measure.duration.toFixed(2)} мс`);
  performance.clearMarks();
  performance.clearMeasures();
}

function processWorkerData() {
  const divisibleByThree = workerData.filter(num => num % 3 === 0).length;
  parentPort.postMessage(divisibleByThree);
}

main();