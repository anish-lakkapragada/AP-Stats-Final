<script lang="ts">
    import "../app.css";
    import { createEventDispatcher } from 'svelte';
    export let index : number; 
    const dispatcher = createEventDispatcher(); 

    let mu : number = 0; 
    let std : number = 1;

    function updateParams() {
        if (mu == null) {
            mu = 0; 
        }
        if (std == null || std == 0) {
            std = 1; 
        }
        
        dispatcher("updateParams", {index, mu, std});

    }

    $: mu, std, updateParams(); 


    const secretString = "return (event.charCode !=8 && event.charCode ==0 || ( event.charCode == 46 || (event.charCode >= 48 && event.charCode <= 57)) || event.charCode == 45)";
</script> 


<div> 
    <h3 class="text-xl"> cluster {index + 1} params </h3> 
    <div class="gap-2"> 
        <h4 class="text-sm mt-4"> cluster µ </h4>
        <!-- @ts -->
        <input type="number" bind:value={mu} class="input input-bordered w-full max-w-xs"  />

        <h4 class="text-sm"> cluster σ </h4>
        <input type="number" bind:value={std} class="input input-bordered w-full max-w-xs" />
    </div> 
</div>