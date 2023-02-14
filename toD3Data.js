// function to adapt model to D3.js data

//import { relations, worlds } from "./parser_test";

function toD3js(relations, worlds) {
    let data = new Object();
    data["nodes"] = new Array();
    data["links"] = new Array();
    for (const world of Object.keys(worlds)) {
        data["nodes"].push({ "id": `w${world}`, "prop": worlds[world], "truth": null });
    }
    for (const agent of Object.keys(relations)) {
        for (const world of Object.keys(worlds)) {
            for (const successor of relations[agent][world]) {
                data["links"].push({ "source": `w${world}`, "target": `w${successor}`, "agent": agent })
            }
        }
    }
    return data;
}

export { toD3js };
