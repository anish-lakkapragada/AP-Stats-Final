<script>
    import { onMount } from "svelte";
    import CustomizeCluster from "../lib/CustomizeCluster.svelte";
    import {giveData} from "../utils.ts";
    // Aak07Dz5rcZ494apI6oq
    // anish-lakkapragada
    import '../app.css';

    let numClusters = 2; // number of clusters 
    let means = []; 
    let stds = []; 
    let data = []; // the plotted numbers 
    let showHistogram = false; 
    const N= 1000000; // number of data points

    $: numClusters, resize(); 

    function resize() {
        means = []; 
        stds = []; 
        for (let i = 0; i < numClusters; i++) {
            means.push(0); 
            stds.push(1); 
        }
    }

    async function handleUpdateParams(e) {
        const {index, mu, std} = e.detail;
        means[index] = mu; 
        stds[index] = std; 
        console.log(means);
        console.log(stds);

        console.log("generating new data")
        // update the plotly histogram based on this 
        data = giveData(means, stds, N); // N = 10000
        console.log(data);
        if (!showHistogram) {
            showHistogram = true;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000))
        Plotly.newPlot('histogram', [{
            type: "histogram", 
            x: data,
        }]);
        
    }


</script> 

<svelte:head> 
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</svelte:head>

<html data-theme="cupcake">

<div class="text-center"> 
    <h1 class="text-4xl my-4"> Gaussian Mixture Model Demo </h1>  
    <p class="mb-4"> Anish Lakkapragada's AP Stats Final Project. </p>

    <!-- show the histogram-->

    {#if showHistogram}
        <div id="histogram" /> 
    {/if}

    <!-- one bar for number of clusters  -->
    <h2 class=" mt-[50px]"> Choose Number of Clusters </h2> 
    <input bind:value={numClusters} type="number" class="input input-bordered w-full max-w-xs" onkeypress="return (event.charCode !=8 && event.charCode ==0 || (event.charCode >= 48 && event.charCode <= 57))" />
    
    <!-- this is like well known.-->
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



</div>
</html>

<style> 

</style> 