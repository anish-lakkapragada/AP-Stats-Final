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
    const iters = 10; // 100 max iterations
    let N= 10000; // number of data points
    let tries = 10; 

    // random plotly shiz
    const layout = { 
        title: `univariate distribution of clusters`,
        font: {size: 12}
    };

    const config = {responsive: true}


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
        }], layout, config);
    });

    async function handleUpdateParams(e : any) {
        stop = false; 

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
        // @ts-ignore
        Plotly.newPlot('histogram', [{
            type: "histogram", 
            x: data,
        }], layout, config);   
    }

    $: {
        if (started) {
           
            stop = false; // restarting the machine, no CDF option
            
            // regression time
            const bestParams = multipleGMMRuns(10, iters, data, numClusters, 1e-6);
            console.log(`LL: ${bestParams.newLL}`);
            gmmMeans = bestParams.gmmMeans; gmmStds = bestParams.gmmStds; gmmMixtureWeights = bestParams.gmmMixtureWeights;
            
            stop = true; 
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
            ], layout, config); 
            console.log(gmmMeans);
            console.log(gmmStds);

            started = false; // so that we can replay everything 
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
    <h1 class="text-4xl my-4"> gaussian mixture model demo </h1>  
    <p class="mb-4"> anish lakkapragada's ap stats final project </p>

    <!-- show the histogram-->

    <!-- {#if showHistogram} -->

    <!-- {/if} -->

    <!-- one bar for number of clusters  -->
    <h2 class=" mt-[50px]"> choose number of clusters </h2> 
    <input bind:value={numClusters} type="number" class="input input-bordered w-full max-w-xs" onkeypress="return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))" />
    
    <!-- this is like well known.-->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div tabindex="0" class="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box mt-4 mx-[20%]">
        <input type="checkbox" />
        <div class="collapse-title text-xl font-medium"> configure clusters </div>
        <div class="collapse-content">
            <!-- clusters for each amount -->
            <div class="flex flex-col gap-3">
                <div class="flex flex-row justify-evenly gap-2 w-full"> 
                    {#each {length: numClusters} as _, i}
                        <CustomizeCluster on:updateParams={handleUpdateParams} index={i} /> 
                    {/each}
                </div> 

                <div class="flex flex-col gap-[1em] mt-4 mx-[10%]"> 
                    <h2 class="text-xl"> sample size <em> N </em> per cluster: {N} </h2>
                    <input type="range" min="1000" max="100000" bind:value={N} class="range range-info range-xs" />
                    <h2 class="text-xl"> {tries > 1 ? "attempts" : "attempt"} to regress distribution: {tries} </h2>
                    <input type="range" min="1" max="50" bind:value={tries} class="range range-info range-xs" />
                </div> 
            </div>
        </div>
    </div>

    <button on:click={() => {started = true; }} class="btn btn-block mb-4 lowercase  bg-blue-200 w-[60%] mt-4 text-black hover:text-white"> run gaussian mixture model (<em> k </em> = {numClusters})! </button>
    <!-- on click run the GMMs, which constantly update this function's parameters-->
    
    <!-- if they have stopped, then you should show the CDF operation -->
    {#if stop}
        <div> 
        <button on:click={() => {cdfModalOpen = true; }} class="btn btn-block mb-4 lowercase bg-blue-200 w-[60%] mt-4 text-black hover:text-white"> cumulative distribution function </button>
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