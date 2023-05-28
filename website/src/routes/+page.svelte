<script lang="ts">
    import { onMount } from "svelte";
    import CustomizeCluster from "../lib/CustomizeCluster.svelte";
    import Modal from "../lib/Modal.svelte";
    import CDF from "../lib/CDF.svelte";
    import {giveData, getBounds, getGMMPDF, integral} from "../utils";
    import { multipleGMMRuns } from "../gmm";
    // Aak07Dz5rcZ494apI6oq
    // anish-lakkapragada
    import '../app.css';

    let numClusters = 2; // number of clusters 
    let means : number[] = []; 
    let stds : number[]= [];
    let data : number[] = []; 
    let showHistogram: boolean = false; 
    let started: boolean = false; 
    let stop: boolean = false; 
    let cdfModalOpen: boolean = false; 

    // GMM params 
    let gmmMeans: number[] = []; 
    let gmmStds: number[] = []; 
    let gmmMixtureWeights: number[] = []; 

    // GMM training params
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
           
            stop = false; 
            
            // regression time
            const bestParams = multipleGMMRuns(tries, iters, data, numClusters, 1e-16);
            gmmMeans = bestParams.gmmMeans; gmmStds = bestParams.gmmStds; gmmMixtureWeights = bestParams.gmmMixtureWeights;
            
            stop = true; 
            console.log("integral of GMM PDF", integral(-200, 200, gmmMeans, gmmStds, gmmMixtureWeights, 0.0001, 1)); 
            const {x, y} = getGMMPDF(gmmMeans, gmmStds, gmmMixtureWeights, 0.1, Math.min(...data), Math.max(...data), data.length); 
            
            Plotly.newPlot("histogram", [
                {
                    type: "histogram", 
                    x: giveData(means, stds, data.length)
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
    // bruh

    function displayCDF(e: any) {
        const {start, end} = e.detail; 
        // from x E {start, end} show a shaded area
        const {start: trueStart, end: trueEnd} = getBounds(gmmMeans, gmmStds);
        const {x, y} = getGMMPDF(gmmMeans, gmmStds, gmmMixtureWeights, 0.001, trueStart, trueEnd, data.length);
        const lowerX: number[] = [];
        const lowerY: number[] = []; 
        const includedX: number[] = []; 
        const includedY: number[] = []; 
        const upperX: number[] = []; 
        const upperY: number[] = []; 


        for (let i =0; i < x.length; i++) {
            console.log(x[i]);
            if (x[i] >= start && x[i] <= end) {
                includedX.push(x[i]);
                includedY.push(y[i]);
                continue;
            }
            else if (x[i] <= start) {
                lowerX.push(x[i]);
                lowerY.push(y[i]);
            }
            else {
                upperX.push(x[i]);
                upperY.push(y[i]);
            }
        }

        Plotly.newPlot("histogram", [
            // {
            //     type: "histogram", 
            //     x: giveData(means, stds, data.length)
            // }, 
            {
                x: includedX, 
                y: includedY, 
                type: "scatter",
                fill: "tozeroy", 
            }, 
            {
                x: lowerX, 
                y: lowerY, 
                type: "scatter",
                line: {
                    color: "orange"
                }
            }, 
            {
                x: upperX, 
                y: upperY, 
                type: "scatter", 
                line: {
                    color: "orange"
                }
            }
        ]);

    }


</script> 

<svelte:head> 
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</svelte:head>

<html lang="en" data-theme="cupcake">

<body class="text-center"> 
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

    <button on:click={() => {started = true; }} class="btn btn-block mb-4  bg-blue-200 w-[60%] mt-4 text-black hover:text-white">Run Gaussian Mixture Model (<em> k </em> = {numClusters})! </button>
    <!-- on click run the GMMs, which constantly update this function's parameters-->
    
    <!-- if they have stopped, then you should show the CDF operation -->
    {#if stop}
        <div> 
        <button on:click={() => {cdfModalOpen = true; }} class="btn btn-block mb-4 bg-blue-200 w-[60%] mt-4 text-black hover:text-white"> CDF??</button>
            <Modal showModal={cdfModalOpen}>
                <CDF on:update={displayCDF} means={gmmMeans} stds={gmmStds} mw={gmmMixtureWeights} /> 
            </Modal>
        </div> 
    {/if}

    <div id="histogram"/> 
</body>
</html>

<style> 

</style> 