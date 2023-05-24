<script lang="ts">
    import { onMount } from "svelte";
    import CustomizeCluster from "../lib/CustomizeCluster.svelte";
    import {expectation, maximization, giveData, ll, getGMMPDF, integral} from "../utils";
    import kmeans from "../kmeans";

    // Aak07Dz5rcZ494apI6oq
    // anish-lakkapragada
    import '../app.css';

    let numClusters = 2; // number of clusters 
    let means : number[] = []; 
    let stds : number[]= [];
    let data : number[] = []; 
    let showHistogram = false; 
    let started = false; 
    const iters = 1000; // 100 max iterations
    const N= 10000; // number of data points
    const tries = 10; 

    $: numClusters, resize(); 

    function resize() {
        means = []; 
        stds = []; 
        for (let i = 0; i < numClusters; i++) {
            means.push(0); 
            stds.push(1); 
        }
    }

    // immediately add everything.
    onMount(async () => {
        data = giveData(means, stds, N); // the plotted numbers 

        await new Promise((r) => setTimeout(r, 2000));

        Plotly.newPlot('histogram', [{
            type: "histogram", 
            x: data,
        }]);
    });

    async function handleUpdateParams(e : any) {
        const {index, mu, std} = e.detail;
        means[index] = mu; 
        stds[index] = std; 
        console.log(means);
        console.log(stds);

        showHistogram = true; 

        console.log("generating new data")
        // update the plotly histogram based on this 
        data = giveData(means, stds, N); 

        await new Promise((resolve) => setTimeout(resolve, 500));

        Plotly.newPlot('histogram', [{
            type: "histogram", 
            x: data,
        }]);   
    }

    $: {
        if (started) {
            let gmmMeans : number[] = []; 
            let gmmStds: number[] = []; 
            let gmmMixtureWeights : number[] = Array(numClusters).fill(1/numClusters);
            let stop: boolean = false; 
            let oldLL : number = -100; 

            const {centroids} = kmeans(data.map(e => [e]), numClusters); 
            gmmMeans = centroids; 
            console.log("initial means"); 
            console.log(gmmMeans); 

            for (const _ of gmmMixtureWeights) {
                gmmStds.push(Math.random()); // random initialization 
            }

            
            function oneStep() {
                const clusterProbabilities = expectation(gmmMeans, gmmStds, gmmMixtureWeights, data, numClusters); // get the cluster probabilities 
                console.log(clusterProbabilities);
                const newParams = maximization(gmmMeans, gmmStds, gmmMixtureWeights, data, numClusters, clusterProbabilities);
                console.log(newParams);
                gmmMeans = newParams.means; gmmStds = newParams.stds; gmmMixtureWeights = newParams.mixture_weights; // update all params 
                
                // Naan check
                for (let j = 0; j < numClusters; j++){
                    if (Number.isNaN(gmmMeans[j]) || Number.isNaN(gmmStds[j])) {
                        stop = true; 
                    }
                }

                const newLL = ll(clusterProbabilities);
                if (newLL - oldLL < 1e-6) {
                    stop = true; 
                    console.log("Model Converged.")
                }

                oldLL = newLL; 

            }

            function oneTry() {
                for (let i =0; i < iters; i++){
                    oneStep();
                    if (stop) {
                        console.log("stopping");
                        break;
                    }
                }
            }

            oneTry();
            
            
            if (stop) {
                // once the model has (hopefully) converged, run this code over here. 
                console.log("integral of GMM PDF", integral(-200, 200, gmmMeans, gmmStds, gmmMixtureWeights, 0.0001, N)); 
                const {x, y} = getGMMPDF(gmmMeans, gmmStds, gmmMixtureWeights, 0.1, Math.min(...data), Math.max(...data), data.length); 
                console.log(Math.max(...data));
                
                Plotly.newPlot("histogram", [
                    {
                        type: "histogram", 
                        x: giveData(gmmMeans, gmmStds, data.length)
                    }, 
                    {
                        x: x, 
                        y: y, 
                        type: "scatter"
                    }
                ]); 
                console.log(gmmMeans);
                console.log(gmmStds);
            }
        }
    }


</script> 

<svelte:head> 
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</svelte:head>

<html lang="en" data-theme="cupcake">

<div class="text-center"> 
    <h1 class="text-4xl my-4"> Gaussian Mixture Model Demo </h1>  
    <p class="mb-4"> Anish Lakkapragada's AP Stats Final Project. </p>

    <!-- show the histogram-->

    <!-- {#if showHistogram} -->

    <!-- {/if} -->

    <!-- one bar for number of clusters  -->
    <h2 class=" mt-[50px]"> Choose Number of Clusters </h2> 
    <input bind:value={numClusters} type="number" class="input input-bordered w-full max-w-xs" onkeypress="return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))" />
    
    <!-- this is like well known.-->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div tabindex="0" class="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box mt-4 mx-[20%]">
        <input type="checkbox" />
        <div class="collapse-title text-xl font-medium"> Configure Clusters </div>
        <div class="collapse-content">
            <!-- clusters for each amount -->
            <div class="flex flex-row justify-evenly gap-2 w-full"> 
                {#each {length: numClusters} as _, i}
                    <CustomizeCluster on:updateParams={handleUpdateParams} index={i} /> 
                {/each}
            </div> 
        </div>
    </div>

    <button on:click={() => {started = true; }} class="btn btn-block bg-blue-200 w-[60%] mt-4 text-black hover:text-white">Run Gaussian Mixture Model (<em> k </em> = {numClusters})! </button>
    <!-- on click run the GMMs, which constantly update this function's parameters-->

    <div id="histogram"/> 
</div>
</html>

<style> 

</style> 