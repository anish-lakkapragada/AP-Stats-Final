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


    const secretString = "return (event.charCode !=8 && event.charCode ==0 || ( event.charCode == 46 || (event.charCode >= 48 && event.charCode <= 57)))";
</script> 


<div> 
    <h3 class="text-xl"> Cluster {index + 1} Params </h3> 
    <div class="flex flex-col gap-2"> 
        <h4 class="text-sm mt-4"> Cluster Mu </h4>
        <input type="number" bind:value={mu} class="input input-bordered w-full max-w-xs" onkeypress={secretString} />

        <h4 class="text-sm"> Cluster Std </h4>
        <input type="number" bind:value={std} class="input input-bordered w-full max-w-xs" onkeypress={secretString} />
    </div> 
</div>
