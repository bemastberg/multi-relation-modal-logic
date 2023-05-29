// function to adapt model to D3.js data

//import { relations, worlds } from "./parser_test";

function toD3js(relations, worlds) {
    let data = new Object();
    let distance = new Object();
    const agents = Object.keys(relations)
    for (const agent of agents) {
        distance[agent] = agents.indexOf(agent)
    }
    data["nodes"] = new Array();
    data["links"] = new Array();
    for (const world of Object.keys(worlds)) {
        data["nodes"].push({ "id": `w${world}`, "prop": worlds[world], "truth": null });
    }
    for (const agent of Object.keys(relations)) {
        for (const world of Object.keys(worlds)) {
            let counter = 0;
            for (const successor of relations[agent][world]) {
                data["links"].push({ "source": `w${world}`, "target": `w${successor}`, "agent": agent, "c": distance[agent] });
                counter += 1;
            }
        }
    }
    return data;
}
// function to transform D3.js objects to model objects
function fromD3js(links, nodes) {
    let agents = new Set()
    let worlds = new Object();
    let relations = new Object();
    for (const node of nodes) {
        if (node.vals) {
            worlds[node.id] = node.vals;
        } else { worlds[node.id] = '' }

    }
    for (const link of links) {
        agents.add(link.id[0]);
    }
    for (const node of nodes) {
        if (node.reflexive) {
            for (const agent of node.reflexive) {
                agents.add(agent)
            }
        }
    }
    agents = new Array(...agents)
    for (const agent of agents) {
        relations[agent] = new Object();
        for (const world of Object.keys(worlds)) {
            relations[agent][world] = new Array();
        }
    }
    console.log(Object.keys(relations))
    for (const agent of Object.keys(relations)) {
        for (const link of links) {
            const linkIDAsArr = link.id.split("-")
            if (linkIDAsArr[0] === agent) {
                console.log(linkIDAsArr[1])
                relations[agent][linkIDAsArr[1]].push(parseInt(linkIDAsArr[2]));
                if (link.left && link.right) {
                    relations[agent][link.target.id].push(link.source.id);
                }

            };

        }
    }
    for (const agent of Object.keys(relations)) {
        for (const node of nodes) {
            if (node.reflexive.includes(agent) && !relations[agent][node.id].includes(node.id)) { relations[agent][node.id].push(node.id) }
        }
    }
    console.log(worlds);
    console.log(relations);
    return [worlds, relations]
}

export { toD3js, fromD3js };
