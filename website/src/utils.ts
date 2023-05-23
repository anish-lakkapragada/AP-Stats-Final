import NormalDistribution from "normal-distribution";

function boxMullerTransform() {
  const u1 = Math.random();
  const u2 = Math.random();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

  return { z0, z1 };
}

function getNormallyDistributedRandomNumber(mean : number, stddev : number) {
  const { z0 } = boxMullerTransform();

  return z0 * stddev + mean;
}

export function giveData(means: number[], stds: number[], N : number) {
  const newData = []; 
  // get the same amount of data from each one 
  for (let i = 0; i < means.length; i++) {
    for (let n = 0; n < N; n++) {
      const dataPoint = getNormallyDistributedRandomNumber(means[i], stds[i]);
      newData.push(dataPoint);
    }
  }

  return newData;
}


function divideByRowSum(matrix: number[][]) {
  const sums = []; 
  for (let i =0; i < matrix.length; i++) {
    let sum =0; 
    for (let j =0; j < matrix[i].length; j++) {
      sum += matrix[i][j];
    }
    sums.push(sum);
  }

  for (let i =0; i < matrix.length; i++) {
    for (let j =0; j < matrix[i].length; j++) {
      matrix[i][j] /= sums[i];
    }
  }

  return matrix;
}


function getCol(matrix: number[][], col: number) : number[] {
  const column: number[] = []; 
  for (let i =0; i < matrix.length; i++) {
    column.push(matrix[i][col]);
  }
  return column; 
}
function sumCol(matrix: number[][], col: number): number {
  return sumList(getCol(matrix, col));
}

function sumList(list: number[]) {
  let sum: number = 0; 
  for (let i =0; i < list.length; i++) {
    sum += list[i];
  }
  return sum; 
}

function elementMult(a1: number[], a2: number[]) {
  const prod = []; 
  for (let i =0; i < a1.length; i++) {
    prod.push(a1[i] * a2[i]);
  }
  return prod; 
}

function meanDiffSquared(list: number[], mean: number): number[] {
  return list.map((element) => (element - mean) * (element - mean));
}

function xlfNormalPDF1b (x: number, mu: number, sigma: number): number {
  var num = Math.exp(- 1 / 2 * Math.pow((x - mu) / sigma, 2))
  var denom = sigma * Math.sqrt(2 * Math.PI)
  return num / denom
}

// expectation step 
export function expectation(means: number[], stds: number[], mixture_weights: number[], data: number[], k : number) : number[][] {
  const N = data.length; 
  const clusterProbabilities : number[][] = [];

  for (let i =0; i < N; i++) {
    const row = []; 
    for (let k_index =0; k_index < k; k_index++) {
       const mean = means[k_index]; 
      const sigma = stds[k_index];
      const normalDist : NormalDistribution = new NormalDistribution(mean, sigma);
      row.push(mixture_weights[k_index] * normalDist.pdf(data[i]));
      if (Number.isNaN(mixture_weights[k_index] * xlfNormalPDF1b(data[i], mean, sigma))) {
        console.log("bruh nanner");
      }
    }
    clusterProbabilities.push(row);
  }

  return divideByRowSum(clusterProbabilities);
}

// maximization step 
export function maximization(means: number[], stds: number[], mixture_weights: number[], data: number[], k: number, clusterProbabilities: number[][]) : {means: number[], stds: number[], mixture_weights: number[]} {
  const N = data.length; 
  console.log(means)
  for (let k_index = 0; k_index < k; k_index++) {

    const sum_cluster_probs: number = sumCol(clusterProbabilities, k_index);
    const column = getCol(clusterProbabilities, k_index); // probabilities of X belong to Cluster k_index


    console.log("column"); 
    console.log(column);
    
    if (Number.isNaN(sum_cluster_probs)) {
      console.log("we have a NaN");
    }

    const updated_mean = sumList(elementMult(data, column)) / sum_cluster_probs;
    const updated_sigma = sumList(elementMult(column, meanDiffSquared(data, means[k_index]))) / sum_cluster_probs; 
    const updated_mixture_weight = sumList(column) / N; 

    means[k_index] = updated_mean;
    stds[k_index] = updated_sigma; 
    mixture_weights[k_index] = updated_mixture_weight; 
  }


  return {means: means, stds: stds, mixture_weights: mixture_weights}
}

export function ll(clusterProbabilities: number[][]) {
  // divide by row sum 
  const rowSums: number[] = []; 
  for (let i =0; i < clusterProbabilities.length; i++) {
    let row  = 0; 
    for (let j =0; j < clusterProbabilities[i].length;j++) {
      row += clusterProbabilities[i][j];
    }
    rowSums.push(row); 
  }

  let lll : number = 0; 
  for (let i = 0; i < rowSums.length; i++) {
    lll += Math.log(rowSums[i]); 
  }
  return lll; 
}

function getFreqAtOneLocation(x: number, means: number[], stds: number[], mixture_weights: number[]) {
  let sum =0; 
  for (let i = 0; i < means.length; i++) {
    sum += mixture_weights[i] * xlfNormalPDF1b(x, means[i], stds[i]); 
  }
  return sum; 
}

const argFact = (compareFn: { (min: any, el: any): any; (max: any, el: any): any; }) => (array: any[]) => array.map((el: any, idx: any) => [el, idx]).reduce(compareFn)[1]
const argMax = argFact((min: number[], el: number[]) => (el[0] > min[0] ? el : min))
const argMin = argFact((max: number[], el: number[]) => (el[0] < max[0] ? el : max))

export function getGMMPDF(means: number[], stds: number[], mixture_weights: number[], dx: number, start: number, end: number, N_tot: number) {
  const lineFreq : number[] = []; 
  const exes : number[] = []; 

  while (start < end) {
    exes.push(start);
    lineFreq.push(N_tot * getFreqAtOneLocation(start, means, stds, mixture_weights));
    start += dx; 
  }

  return {x: exes, y: lineFreq}; 
}
