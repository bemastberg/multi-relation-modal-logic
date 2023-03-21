
import { FormulaParser } from "./formula-parser-es.js";
import { powerSet } from "./powerSetOfAgents.js";
import { forceReflexivity, forceSymmetry, forceTransitivity, forcedTransitions, removeForcedProperty } from "./forcedProperties.js";
import { publicAnnouncement } from "./dynamicOperations.js";
import { publicCommunication } from "./dynamicOperations.js";
import { cartesian, complement, inverse } from "./furtherModalities.js";
import { toD3js } from "./toD3Data.js";
import { everybodyKnows, distributedKnowledge, commonKnowledge } from "./groupNotions.js";
//import * as d3 from "./node_modules/d3/dist/d3.js";


// from https://github.com/rkirsling/modallogic/blob/master/js/MPL.js
let relations = new Object();
let worlds = new Object();
let modelLoaded = false;
const variableKey = 'prop';
let graph = new Object;

const unaries = [
    { symbol: '~', key: 'neg', precedence: 4 },
    { symbol: `K`, key: `nec`, precedence: 4 },
    { symbol: '<>', key: 'poss', precedence: 4 },
    { symbol: 'D', key: 'diff', precedence: 4 },
    { symbol: 'E', key: 'glob', precedence: 4 },
    { symbol: '[C!]', key: 'comm', precedence: 4 },
    { symbol: 'EK', key: 'ekno', precedence: 4 },
    { symbol: 'DK', key: 'dist', precedence: 4 },
    { symbol: 'CK', key: 'cokn', precedence: 4 },
    { symbol: '[|]', key: 'inac', precedence: 4 },
    { symbol: `[<-]`, key: `inve`, precedence: 4 }

];


const binaries = [
    { symbol: '&', key: 'conj', precedence: 3, associativity: 'right' },
    { symbol: '|', key: 'disj', precedence: 2, associativity: 'right' },
    { symbol: '->', key: 'impl', precedence: 1, associativity: 'right' },
    { symbol: '<->', key: 'equi', precedence: 0, associativity: 'right' },
    { symbol: '[!]', key: 'ann', precedence: 4, associativity: 'right' }
];

let uploadButton = document.querySelector('#uploadButton')
let uploadRelations = document.querySelector('#inputrelations')
let uploadWorlds = document.querySelector('#inputworlds')


uploadButton.addEventListener //(handleSubmit)
window.handleSubmit = async function () {
    //event.preventDefault();
    if (!uploadRelations.value.length) return;
    if (!uploadWorlds.value.length) return;
    let relationsReader = new FileReader();
    let worldsReader = new FileReader();
    relationsReader.onload = logFileRelations;
    worldsReader.onload = logFileWorlds;
    relations = relationsReader.readAsText(uploadRelations.files[0]);
    worlds = worldsReader.readAsText(uploadWorlds.files[0]);
    modelLoaded = true;

}

function logFileWorlds(event) {
    let str = event.target.result;
    let json = JSON.parse(str);
    worlds = json;


}
function logFileRelations(event) {
    let str = event.target.result;
    let json = JSON.parse(str);
    relations = json;
    populateUnariesBinaries()

}

function populateUnariesBinaries() {
    const agents = Object.keys(relations);
    for (const agent of agents) {
        unaries.push(
            { symbol: `K${agent}`, key: `nec${agent}`, precedence: 4 },
            { symbol: `<>${agent}`, key: `poss${agent}`, precedence: 4 },
            { symbol: `[|]${agent}`, key: `inac${agent}`, precedence: 4 },
            { symbol: `[<-]${agent}`, key: `inve${agent}`, precedence: 4 },
        )
    }
    for (const agent of powerSet(agents)) {
        unaries.push(
            { symbol: `[C!]${agent}`, key: `comm${agent}`, precedence: 4 },
            { symbol: `EK${agent}`, key: `ekno${agent}`, precedence: 4 },
            { symbol: `DK${agent}`, key: `dist${agent}`, precedence: 4 },
            { symbol: `CK${agent}`, key: `cokn${agent}`, precedence: 4 },
        )
    }

}


window.getModel = async function () {
    const name = document.getElementById("inputmodel").value;
    const model = JSON.parse(localStorage.getItem(`${name}`));
    relations = model['relations'];
    worlds = model['worlds'];


}

let checkboxReflexive = document.getElementById("reflexiveCheckBox");
let checkboxSymmetric = document.getElementById("symmetricCheckBox");
let checkboxTransitive = document.getElementById("transitiveCheckBox");

window.checkReflexivity = async function () {
    if (checkboxReflexive.checked === true) {
        relations = forceReflexivity();
        document.getElementById("reflexive").style.fontWeight = "bold";
    }
    if (checkboxReflexive.checked !== true) {
        relations = removeForcedProperty("Reflexive");
        document.getElementById("reflexive").style.fontWeight = "normal";
    }
    createGraph(false);
}
window.checkSymmetry = async function () {
    if (checkboxSymmetric.checked === true) {
        relations = forceSymmetry();
        if (checkboxTransitive.checked === true) {
            relations = forceTransitivity();
        }
        document.getElementById("symmetric").style.fontWeight = "bold";
    }
    if (checkboxSymmetric.checked !== true) {
        relations = removeForcedProperty("Symmetric");
        document.getElementById("symmetric").style.fontWeight = "normal";
    }
    createGraph(false);
}
window.checkTransitivity = async function () {
    if (checkboxTransitive.checked === true) {
        relations = forceTransitivity();
        if (checkboxSymmetric.checked === true) {
            relations = forceSymmetry();
        }
        document.getElementById("transitive").style.fontWeight = "bold";
    }
    if (checkboxTransitive.checked !== true) {
        relations = removeForcedProperty("Transitive");
        document.getElementById("transitive").style.fontWeight = "normal";
    }
    createGraph(false);
}


function truth(world, worlds, relations, parsedFormula) {
    if (parsedFormula.prop) {
        return (worlds[world].includes(parsedFormula.prop))
    }
    else if (parsedFormula.neg) {
        return !truth(world, worlds, relations, parsedFormula.neg)
    }
    else if (parsedFormula.conj) {
        return (truth(world, worlds, relations, parsedFormula.conj[0]) && truth(world, worlds, relations, parsedFormula.conj[1]))
    }
    else if (parsedFormula.disj) {
        return (truth(world, worlds, relations, parsedFormula.disj[0]) || (truth(world, worlds, relations, parsedFormula.disj[1])))
    }
    else if (parsedFormula.impl) {
        return (!truth(world, worlds, relations, parsedFormula.impl[0]) || (truth(world, worlds, relations, parsedFormula.impl[1])))
    }
    else if (parsedFormula.equi) {
        return (truth(world, worlds, relations, parsedFormula.equi[0]) === (truth(world, worlds, relations, parsedFormula.equi[1])))
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 3) === 'nec') {
        return (Array.from(relations[Object.keys(parsedFormula)[0].slice(3)][world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); }))
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'poss') {
        return (Array.from(relations[Object.keys(parsedFormula)[0].slice(4)][world]).some(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); }))
    }
    else if (parsedFormula.ann) {
        const announcedModel = publicAnnouncement(parsedFormula.ann[0], worlds, relations)
        return (truth(world, announcedModel[0], announcedModel[1], parsedFormula.ann[1]))
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'comm') {
        //console.log(Object.keys(parsedFormula)[0].slice(4))
        //console.log([...Object.keys(parsedFormula)[0].slice(4)].sort((a, b) => a.localeCompare(b)).join(""))
        const communicatedModel = publicCommunication(Object.keys(relations), [...Object.keys(parsedFormula)[0].slice(4)].sort((a, b) => a.localeCompare(b)).join(""), worlds, relations);
        return truth(world, worlds, communicatedModel, parsedFormula[Object.keys(parsedFormula)[0]]);
    }
    else if (parsedFormula.glob) {
        const globalModel = cartesian(true);
        return (globalModel[world]).some(function (succState) { return truth(succState, worlds, relations, parsedFormula.glob) })
    }
    else if (parsedFormula.diff) {
        const globalModel = cartesian(false);
        return (globalModel[world]).some(function (succState) { return truth(succState, worlds, relations, parsedFormula.diff) })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'inac') {
        const complementModel = complement(worlds, relations);
        return (complementModel[Object.keys(parsedFormula)[0].slice(4)][world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'inve') {
        const inverseModel = inverse(worlds, relations);
        return (inverseModel[Object.keys(parsedFormula)[0].slice(4)][world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'ekno') {
        const unionizedModel = everybodyKnows(Object.keys(parsedFormula)[0].slice(4), worlds, relations)
        return (unionizedModel[world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'dist') {
        const intersectedModel = distributedKnowledge(Object.keys(parsedFormula)[0].slice(4), worlds, relations);
        return (intersectedModel[world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }
    else if (Object.keys(parsedFormula)[0].slice(0, 4) === 'cokn') {
        const commonKnowledgeModel = commonKnowledge(Object.keys(parsedFormula)[0].slice(4), worlds, relations);
        return (commonKnowledgeModel[world]).every(function (succState) { return truth(succState, worlds, relations, parsedFormula[Object.keys(parsedFormula)[0]]); })
    }

    else { throw new Error('Invalid formula!') }
}


window.evaluateFormula = async function () {

    //if 
    const DELParser = new FormulaParser(variableKey, unaries, binaries)
    document.getElementById("result").innerHTML = ''
    const formula = document.getElementById("formula").value;
    const parsedFormula = DELParser.parse(formula);
    for (const world of Object.keys(worlds)) {
        if (truth(world, worlds, relations, parsedFormula)) {
            document.getElementById("result").innerHTML += `<span style='color:green'>Formula is true at world ${world}</span><br>`
            document.getElementById("true").innerHTML += `w${world}<br>`
            changeNodeColor(`w${world}`, 'limegreen');
        } else {
            document.getElementById("result").innerHTML += `<span style='color:red'>Formula is false at world ${world}</span><br>`
            document.getElementById("false").innerHTML += `w${world}<br>`
            changeNodeColor(`w${world}`, 'red');
        }
    }

}



var svg = d3.select("svg");

var width = svg.attr("width");
var height = svg.attr("height");
var radius = 6;

svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 35)
    //.attr("refY", -3)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#FF5733");

svg.append("defs").append("marker")
    .attr("id", "arrowSelf")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 18)
    //.attr("refY", -3)
    .attr("refY", -2)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#FF5733");

var color = d3.scaleOrdinal(d3.schemeCategory10);
var canvas = svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "pink")
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-5000))
    .force("center", d3.forceCenter(width / 2, height / 2));

window.changeNodeColor = async function (node, color) {
    svg.selectAll(`#${node}`)
        .attr('fill', color);
}
// Remove worlds
window.drawAnnouncedModel = async function () {
    const DELParser = new FormulaParser(variableKey, unaries, binaries);
    const formula = document.getElementById("formula").value;
    const parsedFormula = DELParser.parse(formula);
    const announcedModel = publicAnnouncement(parsedFormula, worlds, relations);
    relations = announcedModel[1];
    const removedWorlds = Object.keys(worlds).filter(w => !Object.keys(announcedModel[0]).includes(w));
    worlds = announcedModel[0];
    for (const world of removedWorlds) {
        removeNode(world)
    }
}
// Remove links
window.drawCommunicatedModel = async function () {
    const DELParser = new FormulaParser(variableKey, unaries, binaries);
    const communicatingAgents = document.getElementById("communicatingAgents").value;
    relations = publicCommunication(Object.keys(relations), communicatingAgents, worlds, relations);
    createGraph(false);
}
window.createGraph = async function (error, r = relations, w = worlds) {
    if (error) throw error;
    svg.selectAll('g')
        .remove();
    console.log(worlds)
    if (Object.keys(graph).length === 0) {
        graph = toD3js(r, w);
    }
    console.log(graph);
    if (Object.keys(worlds).length === 0) {
        worlds = w;
        relations = r;
        populateUnariesBinaries()
    }
    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(graph['links'])
        .enter().append("path")
        .attr("fill", "transparent")
        .attr("stroke", "#FF5733")
        .attr("marker-end", function (d) {
            if (d.source === d.target) { return "url(#arrowSelf)" }
            else return "url(#arrow)"
        })
        .attr('class', function (d) { return `${d.source} ${d.target}` })


    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", 20)
        .attr("id", function (d) { return d.id; })
        .attr("fill", function (d) { if (d.root == "true") return color(d.root); return color(d.type); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("contextmenu", removeNode);

    var text = svg.append("g").attr("class", "labels").selectAll("g")
        .data(graph.nodes)
        .enter().append("g");

    text.append("text")
        .attr("x", 30)
        .attr("y", "1em")
        .attr("class", function (d) { return d.id })
        .style("font-family", "sans-serif")
        .style("font-size", "0.7em")
        .text(function (d) { return d.id; });


    text.append("text")
        .attr("x", -5)
        .attr("y", 0)
        .attr("class", function (d) { return d.id })
        .style("font-family", "sans-serif")
        .style("font-size", "0.8em")
        .text(function (d) { return d.prop; });

    var textEdges = svg.append("g").attr("class", "labels").selectAll("g")
        .data(graph["links"])
        .enter().append("g")


    textEdges.append("text")

        .attr("x", function (d) {
            console.log(d)
            if (d.source === d.target) {
                return (`${-3.5 + (parseInt(d.c) / 1.8)}em`)
            }
            else { return (`${0.5 + (parseInt(d.c) / 1.8)}em`) }
            //else { return (`0em`) }
        })
        .attr("y", function (d) {
            if (d.source === d.target) {
                return (`-1em`)
            }
            else { return (`0em`) }
        })
        .attr("id", function (d) { return d.agent + d.source + d.target })
        .attr('class', function (d) { return `${d.source} ${d.target}` })
        .style("font-family", "sans-serif")
        .style("font-size", "0.7em")
        .text(function (d) { return d.agent })
    console.log(textEdges)


    node.on("click", function (d) {
        ticked();
        console.log("clicked", d.id);
    });
    node.on("contextmenu", function (d) {
        d3.event.preventDefault();
        console.log('right');
        removeNode(d);
    });
    //canvas.on("click", function () { return createNode() });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);



    function ticked() {
        link.attr("d", function (d) {
            var x1 = d.source.x,
                y1 = d.source.y,
                x2 = d.target.x,
                y2 = d.target.y,
                //dx = x2 - x1,
                //dy = y2 - y1,
                //dr = Math.sqrt(dx * dx + dy * dy),

                // Defaults for non-self loops
                drx = 0,
                dry = 0,
                xRotation = 0,
                largeArc = 0,
                sweep = 1;

            // Self loop
            if (x1 === x2 && y1 === y2) {
                xRotation = 0;
                largeArc = 1;
                sweep = 1;
                drx = 20;
                dry = 10;
                // Crucial to align self loop with arrow head
                x2 = x2 - 10;
                y2 = y2 - 10;

            }
            //else { return "L" + x1 + " " + y1 + " " + x2 + " " + y2 }
            return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;

        });


        node
            //make sure the nodes don't leave the bounds
            .attr("cx", function (d) {
                return (d.x = Math.max(radius, Math.min(width - radius, d.x)));
            })
            .attr("cy", function (d) {
                return (d.y = Math.max(radius, Math.min(height - radius, d.y)));
            })

        text
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

        // agent names on edges should be close to target node
        textEdges
            .attr("transform", function (d) {
                if (d.target === d.source) { return "translate(" + (d.target.x + d.source.x) / 2 + "," + (d.target.y + d.source.y) / 2 + ")"; }
                else { return "translate(" + (d.target.x * 1.5 + d.source.x * 0.5) / 2 + "," + (d.target.y * 1.5 + d.source.y * 0.5) / 2 + ")"; }
            })
        // tlables
        //     .attr("transform", function (d) { return "translate(" + (d.target.x + d.source.x) / 2 + "," + (d.target.y + d.source.y) / 2 + ")"; })


    }
}

d3.select("rect")
    .on('click', function (d) {
        console.log(d);

        var mousePosition = d3.mouse(this);
        createNode(mousePosition[0], mousePosition[1])
    })
    .on("contextmenu", function (d) { d3.event.preventDefault() });


function createNode(x, y) {
    const newWorld = Object.keys(worlds).length
    worlds[newWorld] = ""
    let newNode = { "id": `w${newWorld}`, "prop": "", "truth": null, x: x, y: y };
    graph.nodes.push(newNode);
    update([newNode], false);
}
function removeNode(d) {
    let id;
    if (typeof (d) === 'object') { id = d.id }
    else { id = `w${d}` };
    console.log(id)
    var node = svg.select(`#${id}`)
        .remove();
    var link = svg.selectAll(`.${id}`)
        .remove();
    graph.nodes = graph.nodes.filter(n => n.id !== id);
    graph.links = graph.links.filter(l => !(l.source.id == id || l.target.id == id));

    // Remove world from worlds and relations
    const worldToBeRemoved = id.slice(1)
    delete worlds[worldToBeRemoved]
    for (const agent of Object.keys(relations)) {
        delete relations[agent][worldToBeRemoved]
        for (const world of Object.keys(relations[agent])) {
            relations[agent][world] = relations[agent][world].filter(w => w !== worldToBeRemoved)
        }
    }
}


function update(addNode = false, removeNode = false) {
    if (addNode) {
        var node = svg.select(".nodes")
            .selectAll(".node")
            .data(addNode)

        node.enter().append("circle")
            .attr("r", 20)
            .attr("id", function (d) { return d.id; })
            .attr("fill", function (d) { if (d.root == "true") return color(d.root); return color(d.type); })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("contextmenu", removeNode)
            // .attr("r", 20)
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; })
        // .attr("id", function (d) { return d.id; })
        // .attr("fill", function (d) { if (d.root == "true") return color(d.root); return color(d.type); })


        //node.exit().remove();
        var link = svg.select(".links")
            .selectAll(".link");
        var text = svg.append("g").attr("class", "labels").selectAll("g")
            .data(addNode)
            .enter().append("g");

        text.append("text")
            .attr("x", 30)
            .attr("y", "1em")
            .attr("class", function (d) { return d.id })
            .style("font-family", "sans-serif")
            .style("font-size", "0.7em")
            .text(function (d) { return d.id; });


        text.append("text")
            .attr("x", -5)
            .attr("y", 0)
            .attr("class", function (d) { return d.id })
            .style("font-family", "sans-serif")
            .style("font-size", "0.8em")
            .text(function (d) { return d.prop; });

        var textEdges = svg.append("g").attr("class", "labels").selectAll("g")

        textEdges.append("text")

            .attr("x", function (d) {
                console.log(d)
                if (d.source === d.target) {
                    return (`${-3.5 + (parseInt(d.c) / 1.8)}em`)
                }
                else { return (`${0.5 + (parseInt(d.c) / 1.8)}em`) }
            })
            .attr("y", function (d) {
                if (d.source === d.target) {
                    return (`-1em`)
                }
                else { return (`0em`) }
            })
            .attr("id", function (d) { return d.agent + d.source + d.target })
            .attr('class', function (d) { return `${d.source} ${d.target}` })
            .style("font-family", "sans-serif")
            .style("font-size", "0.7em")
            .text(function (d) { return d.agent })

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function (d) { return d.id; }))
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(width / 2, height / 2))


        simulation
            .nodes(addNode)
            .on("tick", ticked);
        simulation.alpha(0.1).restart();
        // function ticked() {
        //     // node.attr("cx", function (d) { return d.x; })
        //     //     .attr("cy", function (d) { return d.y; });
        //     node
        //         //make sure the nodes don't leave the bounds
        //         .attr("cx", function (d) {
        //             return (d.x = Math.max(radius, Math.min(width - radius, d.x)));
        //         })
        //         .attr("cy", function (d) {
        //             return (d.y = Math.max(radius, Math.min(height - radius, d.y)));
        //         })
        //     // text
        //     //     .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
        //     link.attr("x1", function (d) { return d.source.x; })
        //         .attr("y1", function (d) { return d.source.y; })
        //         .attr("x2", function (d) { return d.target.x; })
        //         .attr("y2", function (d) { return d.target.y; });
        // }
        function ticked() {
            link.attr("d", function (d) {
                var x1 = d.source.x,
                    y1 = d.source.y,
                    x2 = d.target.x,
                    y2 = d.target.y,


                    // Defaults for non-self loops
                    drx = 0,
                    dry = 0,
                    xRotation = 0,
                    largeArc = 0,
                    sweep = 1;

                // Self loop
                if (x1 === x2 && y1 === y2) {
                    xRotation = 0;
                    largeArc = 1;
                    sweep = 1;
                    drx = 20;
                    dry = 10;
                    // Crucial to align self loop with arrow head
                    x2 = x2 - 10;
                    y2 = y2 - 10;

                }
                return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;

            });


            node
                //make sure the nodes don't leave the bounds
                .attr("cx", function (d) {
                    return (d.x = Math.max(radius, Math.min(width - radius, d.x)));
                })
                .attr("cy", function (d) {
                    return (d.y = Math.max(radius, Math.min(height - radius, d.y)));
                })

            text
                .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

            // agent names on edges should be close to target node
            textEdges
                .attr("transform", function (d) {
                    if (d.target === d.source) { return "translate(" + (d.target.x + d.source.x) / 2 + "," + (d.target.y + d.source.y) / 2 + ")"; }
                    else { return "translate(" + (d.target.x * 1.5 + d.source.x * 0.5) / 2 + "," + (d.target.y * 1.5 + d.source.y * 0.5) / 2 + ")"; }
                })


        }
        svg.selectAll("circle")
            .call(drag)
    }

}
var drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended)

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.1).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    if (!d3.event.active) simulation.alphaTarget(0.1);
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0.1);
    d.fx = null;
    d.fy = null;
}

// initialize default model
const defaultWorlds = { "0": "p", "1": "q" };
const defaultRelations = { "a": { "0": ["0", "1"], "1": ["0", "1"] }, "b": { "0": ["0", "1"], "1": ["0", "1"] } };

createGraph(false, defaultRelations, defaultWorlds)


export { relations, truth, worlds }



