function boxMullerTransform() {
  const u1 = Math.random();
  const u2 = Math.random();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

  return { z0, z1 };
}

function getNormallyDistributedRandomNumber(mean : number, stddev : number) {
  const { z0, _ } = boxMullerTransform();

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

