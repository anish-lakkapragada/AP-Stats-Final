/* code in here is about running one GMM update */ 
import { expectation, maximization, ll, argMax} from "./utils";
import kmeans from "./kmeans";

            
function oneStep(gmmMeans: number[], gmmStds: number[], gmmMixtureWeights: number[], data: number[], numClusters: number, oldLL: number, tolerance: number) {
    const clusterProbabilities = expectation(gmmMeans, gmmStds, gmmMixtureWeights, data, numClusters); // get the cluster probabilities 
    if (clusterProbabilities == null) {
        // i hate NaaN
        return {
                error: true, 
                stop: true, 
                gmmMeans: gmmMeans,
                gmmStds: gmmStds,
                gmmMixtureWeights: gmmMixtureWeights, 
                newLL: -Infinity
        }

    }
    const newParams = maximization(gmmMeans, gmmStds, gmmMixtureWeights, data, numClusters, clusterProbabilities);
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

    if (newLL - oldLL < tolerance) {
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

function oneGMMRun(iters: number, means: number[], std: number[], mixtureWeights: number[], data: number[], numClusters: number, tolerance: number){
    let oldLL : number = -Infinity;
    console.log("------------------")
    for (let i =0; i < iters; i++) {
        const {error, stop, gmmMeans, gmmStds, gmmMixtureWeights, newLL} = oneStep(means, std, mixtureWeights, data, numClusters, oldLL, tolerance);  
        if (error) {
            console.log(`model stopping @ ${iters}`)
            return {
                error: true, 
                gmmMeans: means,
                gmmStds: std,
                iters: i, 
                gmmMixtureWeights: mixtureWeights,
                newLL: -Infinity
            }
        }

        if (stop) {
            console.log(`model converged @ ${iters}`);
            return {error: false, iters: i, gmmMeans, gmmStds, gmmMixtureWeights, newLL};
        }

        oldLL = newLL; // otherwise keep continuing on

        if (i + 1 == iters) {
            return {
                error: false,
                gmmMeans, 
                gmmStds, 
                iters: i, 
                gmmMixtureWeights,
                newLL
            }
        }
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
    
    const LLs = [];
    const params = []; 
    let maxLL = -Infinity;
    let maxIndex = -1;  
    const originalData = data; 

    for (let i = 0; i < max_tries; i++) {
        const {means, stds, mixtureWeights} = initialization(data, numClusters);
        if (JSON.stringify(originalData) !== JSON.stringify(data)) {
            console.log("WE FUCKED");
        }

        // @ts-ignore
        const {error, gmmMeans, gmmStds, iters, gmmMixtureWeights, newLL} = oneGMMRun(max_iters, means, stds, mixtureWeights, data, numClusters, tolerance);
        console.log(`model needed: ${iters} iterations`);
        if (error) {
            console.log("we have an error");
            continue; // we are not trying to update params 
        }

        
        if (maxIndex = -1) {
            maxLL = newLL; 
            maxIndex =0; 
            params.push({gmmMeans, gmmStds, iters, gmmMixtureWeights, newLL});
        } 
        else if (maxLL < newLL) {
            maxIndex = i; // this trial 
            maxLL = newLL; 
            params.push({gmmMeans, gmmStds, iters, gmmMixtureWeights, newLL});
        }
        else {
            console.log("another failure, again.")
        }
    }

    // check the likelihood when getting the best parameters back 
    return params[maxIndex];
}