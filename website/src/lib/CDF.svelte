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
<div class="w-full flex gap-2 m-0 p-0 items-center flex-row overflow-hidden"> 
    <h1 class="text-2xl"> gmmcdf( </h1> 
    <input type="number" placeholder={window.innerWidth > 500 ? "Start Value": "Start Val"} bind:value={start} class="input w-[8em] input-bordered"  />
    <h1 class="text-2xl"> , </h1> 
    <input type="number" placeholder={window.innerWidth > 500 ? "End Value": "End Val"} bind:value={end} class="input w-[8em] input-bordered"  />
    <h1 class="text-2xl"> ) </h1> 
</div> 

{#if start != null && end != null}
    <h3 class="mt-4 text-2xl"> P-Value: <strong> {pvalue} </strong> </h3>
{/if}


<style> 

@media(max-width: 500px) {
    input {
        width: 6em;
    }
}


div {
    align-items: center;
}

</style> 