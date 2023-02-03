// function to adapt model to D3.js data

//import { relations, worlds } from "./parser_test";

function toD3js(relations, worlds) {
    let data = new Object();
    data["nodes"] = new Array();
    data["links"] = new Array();
    for (const world of Object.keys(worlds)) {
        data["nodes"].push({ "id": world, "name": `w${world}` });
    }
    for (const agent of Object.keys(relations)) {
        for (const world of Object.keys(worlds)) {
            for (const successor of relations[agent][world]) {
                data["links"].push({ "source": world, "target": successor, "agent": agent })
            }
        }
        console.log(data)
    }
    return data;
}

export { toD3js };
