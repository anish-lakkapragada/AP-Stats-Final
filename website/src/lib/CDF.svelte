<script lang="ts"> 
    import '../app.css';
    import { createEventDispatcher } from 'svelte';
    import { integral } from '../utils';
    export let means: number[]; 
    export let stds: number[]; 
    export let mw: number[]; 
    const dispatch = createEventDispatcher(); // dispatcher

    let start: number; 
    let end: number; 
    let pvalue: number; 

    $: {
        if (start != null && end != null) {
            pvalue = integral(start, end, means, stds, mw);
            dispatch("update", {
                start,
                end
            })
        }
    }

</script> 


<h1 class="text-4xl mb-4"> Gaussian Mixture Model CDF </h1>
<div class="w-full flex gap-2 m-0 p-0 items-center flex-row"> 
    <h1 class="text-2xl"> gmmcdf( </h1> 
    <input type="number" placeholder="Start Value" bind:value={start} class="input input-bordered w-[8em]"  />
    <h1 class="text-2xl"> , </h1> 
    <input type="number" placeholder="End Value" bind:value={end} class="input input-bordered w-[8em]"  />
    <h1 class="text-2xl"> ) </h1> 
</div> 

{#if start != null && end != null}
    <h3 class="mt-4 text-2xl"> P-Value: {pvalue} </h3>
{/if}


<style> 

div {
    align-items: center;
}

</style> 