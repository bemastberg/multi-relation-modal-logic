
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
//let data;
const variableKey = 'prop';

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
    console.log(unaries)

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
    }
    if (checkboxReflexive.checked !== true) {
        relations = removeForcedProperty("Reflexive");
    }
    //console.log(relations)
    createGraph(false);
}
window.checkSymmetry = async function () {
    if (checkboxSymmetric.checked === true) {
        relations = forceSymmetry();
        if (checkboxTransitive.checked === true) {
            relations = forceTransitivity();
        }
    }
    if (checkboxSymmetric.checked !== true) {
        relations = removeForcedProperty("Symmetric");
    }
    console.log(relations)
    createGraph(false);
}
window.checkTransitivity = async function () {
    if (checkboxTransitive.checked === true) {
        relations = forceTransitivity();
        if (checkboxSymmetric.checked === true) {
            relations = forceSymmetry();
        }
    }
    if (checkboxTransitive.checked !== true) {
        relations = removeForcedProperty("Transitive");
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

    const DELParser = new FormulaParser(variableKey, unaries, binaries)
    document.getElementById("result").innerHTML = ''
    const formula = document.getElementById("formula").value;
    const parsedFormula = DELParser.parse(formula);
    for (const world of Object.keys(worlds)) {
        if (truth(world, worlds, relations, parsedFormula)) {
            document.getElementById("result").innerHTML += `<span style='color:green'>Formula is true at world ${world}</span><br>`
            changeNodeColor(`w${world}`, 'limegreen');
        } else {
            document.getElementById("result").innerHTML += `<span style='color:red'>Formula is false at world ${world}</span><br>`
            changeNodeColor(`w${world}`, 'red');
        }
    }

}



var svg = d3.select("svg");

var width = svg.attr("width");
var height = svg.attr("height");
var radius = 6;

//svg = svg.call(d3.zoom().on("zoom", zoomed)).append("g");

svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 32)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#FF5733");

var color = d3.scaleOrdinal(d3.schemeCategory10);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2));



//window.createGraph = async function (error) {
window.changeNodeColor = async function (node, color) {
    svg.selectAll(`#${node}`)
        .attr('fill', color);
}

window.drawAnnouncedModel = async function () {
    const DELParser = new FormulaParser(variableKey, unaries, binaries);
    const formula = document.getElementById("formula").value;
    const parsedFormula = DELParser.parse(formula);
    const announcedModel = publicAnnouncement(parsedFormula, worlds, relations);
    relations = announcedModel[1];
    worlds = announcedModel[0];
    createGraph(false);
}

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
    let graph = toD3js(r, w);
    console.log(graph);

    var canvas = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "pink")

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph['links'])
        .enter().append("line")
        //.attr("stroke", function (d) { return color(d.type); })
        .attr("stroke", "#FF5733")
        .attr("marker-end", "url(#arrow)");


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
            .on("end", dragended));

    var text = svg.append("g").attr("class", "labels").selectAll("g")
        .data(graph.nodes)
        .enter().append("g");

    text.append("text")
        .attr("x", 30)
        .attr("y", "1em")
        .style("font-family", "sans-serif")
        .style("font-size", "0.7em")
        .text(function (d) { return d.id; });

    text.append("text")
        .attr("x", -5)
        .attr("y", 0)
        .style("font-family", "sans-serif")
        .style("font-size", "0.7em")
        .text(function (d) { return d.prop; });

    var textEdges = svg.append("g").attr("class", "labels").selectAll("g")
        .data(graph["links"])
        .enter().append("g")

    textEdges.append("text")
        .attr("x", -30)
        .attr("y", 15)
        .style("font-family", "sans-serif")
        .style("font-size", "0.7em")
        .text(function (d) { return d.agent })


    node.on("click", function (d) {
        console.log("clicked", d.id);
    });

    canvas.on("click", function () { return createNode() });

    node.append("title")
        .text(function (d) { return d.id; });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function createNode() {
        console.log("clicked")
        node.append("circle")
            .data({ "id": `w${Object.keys(worlds).length}`, "prop": "", "truth": null })
            .enter().append("circle")
            .attr("r", 20)
            .attr("id", function (d) { return d.id; })
            .attr("fill", function (d) { if (d.root == "true") return color(d.root); return color(d.type); })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
    }
    function ticked() {
        link
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

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
        textEdges
            .attr("transform", function (d) { return "translate(" + (d.target.x + d.source.x) / 2 + "," + (d.target.y + d.source.y) / 2 + ")"; })



    }
}


function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.1).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// function zoomed() {
//     //svg.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
//     svg.attr("transform", "translate(" + d3.event.translate + ")");
// }


export { relations, truth, worlds }



