/* code in here is about running one GMM update */ 
import { expectation, maximization, ll} from "./utils";
import kmeans from "./kmeans";

            
function oneStep(gmmMeans: number[], gmmStds: number[], gmmMixtureWeights: number[], data: number[], numClusters: number, oldLL: number, tolerance: number) {
    const clusterProbabilities = expectation(gmmMeans, gmmStds, gmmMixtureWeights, data, numClusters); // get the cluster probabilities 
    console.log(clusterProbabilities);
    const newParams = maximization(gmmMeans, gmmStds, gmmMixtureWeights, data, numClusters, clusterProbabilities);
    console.log(newParams);
    gmmMeans = newParams.means; gmmStds = newParams.stds; gmmMixtureWeights = newParams.mixture_weights; // update all params 
    
    // Naan check
    for (let j = 0; j < numClusters; j++){
        if (Number.isNaN(gmmMeans[j]) || Number.isNaN(gmmStds[j])) {
            return {
                error: true, 
                stop: true, 
                gmmMeans: gmmMeans,
                gmmStds: gmmStds,
                gmmMixtureWeights: gmmMixtureWeights, 
                newLL: -Infinity
            }
        }
    }

    const newLL = ll(clusterProbabilities);

    if (Math.abs(newLL - oldLL) < tolerance) {
        console.log(`change in LL: ${Math.abs(newLL - oldLL)}`);
        console.log(`this is tolerance: ${tolerance}, and this is negative: ${Math.abs(newLL - oldLL) - tolerance < 0}`);

        return {
            error: false, 
            stop: true, 
            gmmMeans: gmmMeans,
            gmmStds: gmmStds,
            gmmMixtureWeights: gmmMixtureWeights,
            newLL: newLL
        }
    }

    return {
        error: false,
        stop: false,
        gmmMeans: gmmMeans,
        gmmStds: gmmStds,
        gmmMixtureWeights: gmmMixtureWeights,
        newLL: newLL
    }
}

function oneGMMRun(iters: number, means: number[], std: number[], mixtureWeights: number[], data: number[], numClusters: number, tolerance: number): {error: boolean, gmmMeans: number[], gmmStds: number[], gmmMixtureWeights: number[], newLL: number} {
    let oldLL : number = -Infinity;
    console.log("------------------")
    for (let i =0; i < iters; i++) {
        const {error, stop, gmmMeans, gmmStds, gmmMixtureWeights, newLL} = oneStep(means, std, mixtureWeights, data, numClusters, oldLL, tolerance);  
        if (error) {
            return {
                error: true, 
                gmmMeans: means,
                gmmStds: std,
                gmmMixtureWeights: mixtureWeights,
                newLL: -Infinity
            }
        }

        if (stop) {
            console.log(`model converged @ ${iters}`);
            return {error: false, gmmMeans, gmmStds, gmmMixtureWeights, newLL};
        }

        oldLL = newLL; // otherwise keep continuing on

        if (i + 1 == iters) {
            return {
                error: false,
                gmmMeans, 
                gmmStds, 
                gmmMixtureWeights,
                newLL
            }
        }
    }
    
    console.log("------------------")
    
    return {
        error: true,
        gmmMeans: means,
        gmmStds: std,
        gmmMixtureWeights: mixtureWeights,
        newLL: -Infinity
    }
    
}

function initialization(data: number[], numClusters: number) {
    let means = [];
    const stds = [];
    const mixtureWeights = Array(numClusters).fill(1/numClusters);

    const {centroids} = kmeans(data.map(e => [e]), numClusters); 
    means = centroids; 

    for (const _ of mixtureWeights) {
        stds.push(Math.random()); // random initialization 
    }

    return {means, stds, mixtureWeights}
}

// we need to do multiple GMM runs to get the best parameters, each for a timeframe of `max_tries` and `max_iters` iterations.
export function multipleGMMRuns(max_tries: number, max_iters: number, data: number[], numClusters: number, tolerance: number) {
    let bestParams = {
        gmmMeans: Array(numClusters).fill(0),
        gmmStds: Array(numClusters).fill(1),
        gmmMixtureWeights: Array(numClusters).fill(1/numClusters),
        newLL: -Infinity
    }

    for (let i = 0; i < max_tries; i++) {
        const {means, stds, mixtureWeights} = initialization(data, numClusters);

        // @ts-ignore
        const {error, gmmMeans, gmmStds, gmmMixtureWeights, newLL} = oneGMMRun(max_iters, means, stds, mixtureWeights, data, numClusters, tolerance);
        if (error) {
            continue; // we are not trying to update params 
        }

        
        if (newLL > bestParams.newLL) {
            console.log(`success at last, ${newLL - bestParams.newLL}`);
            bestParams = {
                gmmMeans,
                gmmStds,
                gmmMixtureWeights,
                newLL
            };
        } else {
            console.log("another failure, again.")
        }
    }

    // check the likelihood when getting the best parameters back 
    return bestParams;
}